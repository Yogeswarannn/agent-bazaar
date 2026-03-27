import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";

describe("VerificationContract", function () {
  let usdc, jobManager, taskContract, biddingContract, verificationContract;
  let owner, client, agent, verifier1, verifier2, verifier3, oracle;

  const USDC_DECIMALS = 6;
  const toUSDC = (n) => ethers.parseUnits(n.toString(), USDC_DECIMALS);

  beforeEach(async function () {
    [owner, client, agent, verifier1, verifier2, verifier3, oracle] =
      await ethers.getSigners();

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
      toUSDC(1)
    );

    const VerificationContract = await ethers.getContractFactory("VerificationContract");
    verificationContract = await VerificationContract.deploy(
      await taskContract.getAddress(),
      await biddingContract.getAddress()
    );

    // Wire
    await jobManager.setTaskContract(await taskContract.getAddress());
    await taskContract.setBiddingContract(await biddingContract.getAddress());
    await taskContract.setVerificationContract(await verificationContract.getAddress());

    // Add verifiers
    await verificationContract.addVerifier(verifier1.address);
    await verificationContract.addVerifier(verifier2.address);
    await verificationContract.addVerifier(verifier3.address);

    // Post job, create task, assign agent, submit work
    await usdc.mint(client.address, toUSDC(1000));
    await usdc.connect(client).approve(await jobManager.getAddress(), toUSDC(1000));
    await jobManager.connect(client).postJob("QmJobCID", toUSDC(100));

    const deadline = (await time.latest()) + 7200;
    await taskContract.createTask(0, "Build UI", "QmRubric", toUSDC(50), deadline);

    // Assign agent via impersonation
    const biddingAddr = await biddingContract.getAddress();
    await ethers.provider.send("hardhat_setBalance", [biddingAddr, "0x56BC75E2D63100000"]);
    const biddingSigner = await ethers.getImpersonatedSigner(biddingAddr);
    await taskContract.connect(biddingSigner).assignAgent(0, agent.address);

    // Submit work
    await taskContract.connect(agent).submitWork(0, "QmOutputCID");
  });

  describe("openRound", function () {
    it("should open a verification round", async function () {
      await expect(
        verificationContract.connect(verifier1).openRound(0, "QmRubric", "QmOutputCID")
      )
        .to.emit(verificationContract, "VerificationRoundOpened")
        .withArgs(0, 0, "QmRubric", "QmOutputCID", 70, 1);
    });

    it("should reject unauthorized caller", async function () {
      await expect(
        verificationContract.connect(client).openRound(0, "QmR", "QmO")
      ).to.be.revertedWith("Not authorised");
    });

    it("should allow owner to open round", async function () {
      await expect(
        verificationContract.connect(owner).openRound(0, "QmR", "QmO")
      ).to.not.be.reverted;
    });
  });

  describe("submitScore (quorum=1)", function () {
    beforeEach(async function () {
      await verificationContract.connect(verifier1).openRound(0, "QmRubric", "QmOutput");
    });

    it("should pass task when score >= threshold", async function () {
      await expect(
        verificationContract.connect(verifier1).submitScore(0, 85, "QmEvidence")
      )
        .to.emit(verificationContract, "VoteSubmitted")
        .withArgs(0, 0, verifier1.address, 85, true)
        .and.to.emit(verificationContract, "TaskPassed")
        .withArgs(0, 0, 85);

      // Task should be VERIFIED
      const task = await taskContract.getTask(0);
      expect(task.status).to.equal(3); // VERIFIED

      // Agent should have been paid
      expect(await usdc.balanceOf(agent.address)).to.equal(toUSDC(50));
    });

    it("should fail task when score < threshold", async function () {
      await expect(
        verificationContract.connect(verifier1).submitScore(0, 40, "QmEvidence")
      )
        .to.emit(verificationContract, "TaskFailed")
        .withArgs(0, 0, 40);

      // Task should be back to OPEN
      const task = await taskContract.getTask(0);
      expect(task.status).to.equal(0); // OPEN
      expect(task.retryCount).to.equal(1);
    });

    it("should reject score > 100", async function () {
      await expect(
        verificationContract.connect(verifier1).submitScore(0, 101, "QmEv")
      ).to.be.revertedWith("Score > 100");
    });

    it("should reject double vote from same verifier", async function () {
      await verificationContract.connect(verifier1).submitScore(0, 85, "QmEv");
      await expect(
        verificationContract.connect(verifier1).submitScore(0, 90, "QmEv2")
      ).to.be.revertedWith("Round not pending"); // settled after quorum=1
    });

    it("should reject non-verifier", async function () {
      await expect(
        verificationContract.connect(client).submitScore(0, 85, "QmEv")
      ).to.be.revertedWith("Not an authorised verifier");
    });
  });

  describe("submitScore (quorum=3, majority vote)", function () {
    beforeEach(async function () {
      await verificationContract.setQuorum(3);
      await verificationContract.connect(verifier1).openRound(0, "QmRubric", "QmOutput");
    });

    it("should not settle until quorum is reached", async function () {
      await verificationContract.connect(verifier1).submitScore(0, 85, "QmEv1");

      const round = await verificationContract.getRound(0);
      expect(round.status).to.equal(0); // PENDING
      expect(round.passVotes).to.equal(1);
    });

    it("should pass with 2/3 pass votes", async function () {
      await verificationContract.connect(verifier1).submitScore(0, 85, "QmEv1"); // pass
      await verificationContract.connect(verifier2).submitScore(0, 40, "QmEv2"); // fail
      await verificationContract.connect(verifier3).submitScore(0, 75, "QmEv3"); // pass

      const round = await verificationContract.getRound(0);
      expect(round.status).to.equal(1); // PASSED

      const task = await taskContract.getTask(0);
      expect(task.status).to.equal(3); // VERIFIED
    });

    it("should fail with 2/3 fail votes", async function () {
      await verificationContract.connect(verifier1).submitScore(0, 30, "QmEv1"); // fail
      await verificationContract.connect(verifier2).submitScore(0, 40, "QmEv2"); // fail
      await verificationContract.connect(verifier3).submitScore(0, 90, "QmEv3"); // pass

      const round = await verificationContract.getRound(0);
      expect(round.status).to.equal(2); // FAILED

      const task = await taskContract.getTask(0);
      expect(task.status).to.equal(0); // OPEN (retried)
    });

    it("should prevent same verifier voting twice in same round", async function () {
      await verificationContract.connect(verifier1).submitScore(0, 85, "QmEv1");
      await expect(
        verificationContract.connect(verifier1).submitScore(0, 90, "QmEv2")
      ).to.be.revertedWith("Already voted");
    });
  });

  describe("Retry nonce (multiple rounds per task)", function () {
    it("should allow a new round after task fails and is retried", async function () {
      // Round 1: fail
      await verificationContract.connect(verifier1).openRound(0, "QmRubric", "QmOutput1");
      await verificationContract.connect(verifier1).submitScore(0, 30, "QmEv"); // FAIL

      // Task is now OPEN again, nonce should still be 0
      const nonce0 = await verificationContract.taskNonce(0);
      expect(nonce0).to.equal(0);

      // Re-assign and re-submit (simulate)
      const biddingAddr = await biddingContract.getAddress();
      await ethers.provider.send("hardhat_setBalance", [biddingAddr, "0x56BC75E2D63100000"]);
      const biddingSigner = await ethers.getImpersonatedSigner(biddingAddr);
      await taskContract.connect(biddingSigner).assignAgent(0, agent.address);
      await taskContract.connect(agent).submitWork(0, "QmOutput2");

      // Round 2: should open with nonce=1
      await verificationContract.connect(verifier1).openRound(0, "QmRubric", "QmOutput2");
      const nonce1 = await verificationContract.taskNonce(0);
      expect(nonce1).to.equal(1);

      // Score pass on round 2
      await verificationContract.connect(verifier1).submitScore(0, 90, "QmEvPass");

      const task = await taskContract.getTask(0);
      expect(task.status).to.equal(3); // VERIFIED
    });

    it("should reject opening a new round while previous is still pending", async function () {
      await verificationContract.connect(verifier1).openRound(0, "QmR", "QmO");

      // Try to open again while pending
      await expect(
        verificationContract.connect(verifier1).openRound(0, "QmR2", "QmO2")
      ).to.be.revertedWith("Previous round still pending");
    });
  });

  describe("View functions", function () {
    it("should return reports for current round", async function () {
      await verificationContract.connect(verifier1).openRound(0, "QmR", "QmO");
      await verificationContract.connect(verifier1).submitScore(0, 85, "QmEv");

      const reports = await verificationContract.getReports(0);
      expect(reports.length).to.equal(1);
      expect(reports[0].verifier).to.equal(verifier1.address);
      expect(reports[0].score).to.equal(85);
    });

    it("should return reports by specific nonce", async function () {
      // Round 0
      await verificationContract.connect(verifier1).openRound(0, "QmR", "QmO");
      await verificationContract.connect(verifier1).submitScore(0, 30, "QmEv1"); // fail

      // Retry
      const biddingAddr = await biddingContract.getAddress();
      await ethers.provider.send("hardhat_setBalance", [biddingAddr, "0x56BC75E2D63100000"]);
      const biddingSigner = await ethers.getImpersonatedSigner(biddingAddr);
      await taskContract.connect(biddingSigner).assignAgent(0, agent.address);
      await taskContract.connect(agent).submitWork(0, "QmO2");

      // Round 1
      await verificationContract.connect(verifier1).openRound(0, "QmR", "QmO2");
      await verificationContract.connect(verifier1).submitScore(0, 90, "QmEv2"); // pass

      // Old round reports still accessible
      const oldReports = await verificationContract.getReportsByNonce(0, 0);
      expect(oldReports.length).to.equal(1);
      expect(oldReports[0].score).to.equal(30);

      // New round reports
      const newReports = await verificationContract.getReportsByNonce(0, 1);
      expect(newReports.length).to.equal(1);
      expect(newReports[0].score).to.equal(90);
    });
  });

  describe("Admin", function () {
    it("should add and remove verifiers", async function () {
      const newVerifier = client; // reuse signer
      await verificationContract.addVerifier(newVerifier.address);
      expect(await verificationContract.authorisedVerifiers(newVerifier.address)).to.be.true;

      await verificationContract.removeVerifier(newVerifier.address);
      expect(await verificationContract.authorisedVerifiers(newVerifier.address)).to.be.false;
    });

    it("should reject zero address verifier", async function () {
      await expect(
        verificationContract.addVerifier(ethers.ZeroAddress)
      ).to.be.revertedWith("Zero address");
    });

    it("should set pass threshold", async function () {
      await verificationContract.setPassThreshold(80);
      expect(await verificationContract.defaultPassThreshold()).to.equal(80);
    });

    it("should reject threshold > 100", async function () {
      await expect(
        verificationContract.setPassThreshold(101)
      ).to.be.revertedWith("Max 100");
    });

    it("should set quorum", async function () {
      await verificationContract.setQuorum(3);
      expect(await verificationContract.defaultQuorum()).to.equal(3);
    });

    it("should reject quorum < 1", async function () {
      await expect(
        verificationContract.setQuorum(0)
      ).to.be.revertedWith("Min quorum 1");
    });

    it("should reject non-owner admin calls", async function () {
      await expect(
        verificationContract.connect(client).setPassThreshold(50)
      ).to.be.reverted;
    });
  });
});
