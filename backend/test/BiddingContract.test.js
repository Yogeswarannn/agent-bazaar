import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";

describe("BiddingContract", function () {
  let usdc, jobManager, taskContract, biddingContract, verificationContract;
  let owner, client, agent1, agent2, agent3, oracle;

  const USDC_DECIMALS = 6;
  const toUSDC = (n) => ethers.parseUnits(n.toString(), USDC_DECIMALS);
  const BOND = toUSDC(1);

  beforeEach(async function () {
    [owner, client, agent1, agent2, agent3, oracle] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    const JobManager = await ethers.getContractFactory("JobManager");
    jobManager = await JobManager.deploy(await usdc.getAddress(), owner.address, 0);

    const TaskContract = await ethers.getContractFactory("TaskContract");
    taskContract = await TaskContract.deploy(
      await usdc.getAddress(),
      await jobManager.getAddress()
    );

    const BiddingContract = await ethers.getContractFactory("BiddingContract");
    biddingContract = await BiddingContract.deploy(
      await usdc.getAddress(),
      await taskContract.getAddress(),
      oracle.address,
      BOND
    );

    const VerificationContract = await ethers.getContractFactory("VerificationContract");
    verificationContract = await VerificationContract.deploy(
      await taskContract.getAddress(),
      await biddingContract.getAddress()
    );

    // Wire contracts
    await jobManager.setTaskContract(await taskContract.getAddress());
    await taskContract.setBiddingContract(await biddingContract.getAddress());
    await taskContract.setVerificationContract(await verificationContract.getAddress());

    // Fund client, post job, create task
    await usdc.mint(client.address, toUSDC(1000));
    await usdc.connect(client).approve(await jobManager.getAddress(), toUSDC(1000));
    await jobManager.connect(client).postJob("QmJobCID", toUSDC(100));

    const deadline = (await time.latest()) + 7200;
    await taskContract.createTask(0, "Build UI", "QmRubric", toUSDC(50), deadline);

    // Set reputation for agents
    await biddingContract.connect(oracle).setReputation(agent1.address, 500);
    await biddingContract.connect(oracle).setReputation(agent2.address, 300);
    await biddingContract.connect(oracle).setReputation(agent3.address, 50); // below min

    // Fund agents for bonds
    for (const agent of [agent1, agent2, agent3]) {
      await usdc.mint(agent.address, toUSDC(10));
      await usdc.connect(agent).approve(await biddingContract.getAddress(), toUSDC(10));
    }
  });

  describe("openBidRound", function () {
    it("should open a bid round for a task", async function () {
      await expect(biddingContract.openBidRound(0, 0, 0))
        .to.emit(biddingContract, "BidRoundOpened");
    });

    it("should reject opening a second round for same task", async function () {
      await biddingContract.openBidRound(0, 0, 0);
      await expect(biddingContract.openBidRound(0, 0, 0))
        .to.be.revertedWith("Round already open");
    });
  });

  describe("placeBid", function () {
    beforeEach(async function () {
      await biddingContract.openBidRound(0, 100, BOND);
    });

    it("should accept a valid bid and pull bond", async function () {
      const balBefore = await usdc.balanceOf(agent1.address);

      await expect(
        biddingContract.connect(agent1).placeBid(0, toUSDC(40), "QmCreds1")
      )
        .to.emit(biddingContract, "BidPlaced")
        .withArgs(0, agent1.address, toUSDC(40));

      const balAfter = await usdc.balanceOf(agent1.address);
      expect(balBefore - balAfter).to.equal(BOND);
      expect(await biddingContract.getBidCount(0)).to.equal(1);
    });

    it("should reject duplicate bid from same agent", async function () {
      await biddingContract.connect(agent1).placeBid(0, toUSDC(40), "QmCreds1");
      await expect(
        biddingContract.connect(agent1).placeBid(0, toUSDC(35), "QmCreds1b")
      ).to.be.revertedWith("Already bid on this task");
    });

    it("should reject agent with low reputation", async function () {
      await expect(
        biddingContract.connect(agent3).placeBid(0, toUSDC(30), "QmCreds3")
      ).to.be.revertedWith("Reputation too low");
    });

    it("should reject zero price bid", async function () {
      await expect(
        biddingContract.connect(agent1).placeBid(0, 0, "QmCreds")
      ).to.be.revertedWith("Zero price bid");
    });

    it("should reject bid after window closes", async function () {
      await time.increase(31 * 60); // 31 minutes
      await expect(
        biddingContract.connect(agent1).placeBid(0, toUSDC(40), "QmCreds")
      ).to.be.revertedWith("Bidding closed");
    });
  });

  describe("selectWinner", function () {
    beforeEach(async function () {
      await biddingContract.openBidRound(0, 100, BOND);
      await biddingContract.connect(agent1).placeBid(0, toUSDC(45), "QmCreds1");
      await biddingContract.connect(agent2).placeBid(0, toUSDC(40), "QmCreds2");
    });

    it("should reject if window still open", async function () {
      await expect(biddingContract.selectWinner(0))
        .to.be.revertedWith("Window still open");
    });

    it("should select lowest bidder as winner", async function () {
      await time.increase(31 * 60);

      await expect(biddingContract.selectWinner(0))
        .to.emit(biddingContract, "WinnerSelected")
        .withArgs(0, agent2.address, toUSDC(40));

      // Task should be assigned to agent2
      const task = await taskContract.getTask(0);
      expect(task.assignedAgent).to.equal(agent2.address);
      expect(task.status).to.equal(1); // ASSIGNED
    });

    it("should credit loser refund via pull-payment", async function () {
      await time.increase(31 * 60);
      await biddingContract.selectWinner(0);

      // Agent1 lost — should have a pending refund
      const pending = await biddingContract.getPendingRefund(agent1.address, 0);
      expect(pending).to.equal(BOND);

      // Agent2 won — no pending refund
      const pendingWinner = await biddingContract.getPendingRefund(agent2.address, 0);
      expect(pendingWinner).to.equal(0);
    });

    it("should reject double settlement", async function () {
      await time.increase(31 * 60);
      await biddingContract.selectWinner(0);
      await expect(biddingContract.selectWinner(0))
        .to.be.revertedWith("Already settled");
    });
  });

  describe("claimRefund (pull-payment)", function () {
    beforeEach(async function () {
      await biddingContract.openBidRound(0, 100, BOND);
      await biddingContract.connect(agent1).placeBid(0, toUSDC(45), "QmCreds1");
      await biddingContract.connect(agent2).placeBid(0, toUSDC(40), "QmCreds2");
      await time.increase(31 * 60);
      await biddingContract.selectWinner(0);
    });

    it("should allow loser to claim refund", async function () {
      const balBefore = await usdc.balanceOf(agent1.address);

      await expect(biddingContract.connect(agent1).claimRefund(0))
        .to.emit(biddingContract, "BidRefunded")
        .withArgs(0, agent1.address, BOND);

      const balAfter = await usdc.balanceOf(agent1.address);
      expect(balAfter - balBefore).to.equal(BOND);
    });

    it("should reject double claim", async function () {
      await biddingContract.connect(agent1).claimRefund(0);
      await expect(
        biddingContract.connect(agent1).claimRefund(0)
      ).to.be.revertedWith("No refund available");
    });

    it("should reject claim from winner (no pending refund)", async function () {
      await expect(
        biddingContract.connect(agent2).claimRefund(0)
      ).to.be.revertedWith("No refund available");
    });
  });

  describe("claimWinnerBond", function () {
    beforeEach(async function () {
      await biddingContract.openBidRound(0, 100, BOND);
      await biddingContract.connect(agent1).placeBid(0, toUSDC(45), "QmCreds1");
      await biddingContract.connect(agent2).placeBid(0, toUSDC(40), "QmCreds2");
      await time.increase(31 * 60);
      await biddingContract.selectWinner(0); // agent2 wins
    });

    it("should reject bond claim before work is submitted", async function () {
      await expect(
        biddingContract.connect(agent2).claimWinnerBond(0)
      ).to.be.revertedWith("Work not yet submitted");
    });

    it("should allow bond claim after work is submitted", async function () {
      // Agent2 submits work
      await taskContract.connect(agent2).submitWork(0, "QmOutput");

      const balBefore = await usdc.balanceOf(agent2.address);
      await biddingContract.connect(agent2).claimWinnerBond(0);
      const balAfter = await usdc.balanceOf(agent2.address);

      expect(balAfter - balBefore).to.equal(BOND);
    });

    it("should reject non-winner claiming bond", async function () {
      await taskContract.connect(agent2).submitWork(0, "QmOutput");
      await expect(
        biddingContract.connect(agent1).claimWinnerBond(0)
      ).to.be.revertedWith("Not winner");
    });
  });

  describe("Reputation", function () {
    it("should allow oracle to set reputation", async function () {
      await expect(
        biddingContract.connect(oracle).setReputation(agent1.address, 800)
      )
        .to.emit(biddingContract, "ReputationUpdated")
        .withArgs(agent1.address, 800);

      expect(await biddingContract.reputation(agent1.address)).to.equal(800);
    });

    it("should reject non-oracle reputation update", async function () {
      await expect(
        biddingContract.connect(agent1).setReputation(agent1.address, 999)
      ).to.be.revertedWith("Only oracle");
    });

    it("should reject score > 1000", async function () {
      await expect(
        biddingContract.connect(oracle).setReputation(agent1.address, 1001)
      ).to.be.revertedWith("Score > 1000");
    });
  });
});
