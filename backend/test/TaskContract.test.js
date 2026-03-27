import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";

describe("TaskContract", function () {
  let usdc, jobManager, taskContract, biddingContract, verificationContract;
  let owner, client, agent, verifier;

  const USDC_DECIMALS = 6;
  const toUSDC = (n) => ethers.parseUnits(n.toString(), USDC_DECIMALS);
  const FEE_BPS = 200n;

  beforeEach(async function () {
    [owner, client, agent, verifier] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    const JobManager = await ethers.getContractFactory("JobManager");
    jobManager = await JobManager.deploy(
      await usdc.getAddress(),
      owner.address, // treasury
      FEE_BPS
    );

    const TaskContract = await ethers.getContractFactory("TaskContract");
    taskContract = await TaskContract.deploy(
      await usdc.getAddress(),
      await jobManager.getAddress()
    );

    const BiddingContract = await ethers.getContractFactory("BiddingContract");
    biddingContract = await BiddingContract.deploy(
      await usdc.getAddress(),
      await taskContract.getAddress(),
      owner.address, // oracle
      toUSDC(1)
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

    // Fund client and post a job
    await usdc.mint(client.address, toUSDC(1000));
    await usdc.connect(client).approve(await jobManager.getAddress(), toUSDC(1000));
    await jobManager.connect(client).postJob("QmJobCID", toUSDC(100));
  });

  describe("createTask", function () {
    it("should create a task and pull budget from JobManager", async function () {
      const deadline = (await time.latest()) + 3600;
      const budget = toUSDC(30);

      await expect(
        taskContract.createTask(0, "HTML/CSS", "QmRubricCID", budget, deadline)
      )
        .to.emit(taskContract, "TaskCreated")
        .withArgs(0, 0, "HTML/CSS", budget, deadline);

      const task = await taskContract.getTask(0);
      expect(task.title).to.equal("HTML/CSS");
      expect(task.budget).to.equal(budget);
      expect(task.status).to.equal(0); // OPEN

      // TaskContract should now hold the USDC
      expect(await usdc.balanceOf(await taskContract.getAddress())).to.equal(budget);
    });

    it("should allow multiple tasks from one job", async function () {
      const deadline = (await time.latest()) + 3600;

      await taskContract.createTask(0, "Task A", "QmR1", toUSDC(20), deadline);
      await taskContract.createTask(0, "Task B", "QmR2", toUSDC(30), deadline);

      const tasks = await taskContract.getJobTasks(0);
      expect(tasks.length).to.equal(2);

      // Job should still be accessible with reduced budget
      const job = await jobManager.getJob(0);
      expect(job.status).to.equal(1); // IN_PROGRESS
    });

    it("should reject zero budget", async function () {
      const deadline = (await time.latest()) + 3600;
      await expect(
        taskContract.createTask(0, "Zero", "QmR", 0, deadline)
      ).to.be.revertedWith("Zero budget");
    });

    it("should reject past deadline", async function () {
      const pastDeadline = (await time.latest()) - 100;
      await expect(
        taskContract.createTask(0, "Late", "QmR", toUSDC(10), pastDeadline)
      ).to.be.revertedWith("Deadline in past");
    });

    it("should reject non-owner caller", async function () {
      const deadline = (await time.latest()) + 3600;
      await expect(
        taskContract.connect(client).createTask(0, "X", "QmR", toUSDC(10), deadline)
      ).to.be.reverted; // OwnableUnauthorizedAccount
    });
  });

  describe("assignAgent", function () {
    beforeEach(async function () {
      const deadline = (await time.latest()) + 3600;
      await taskContract.createTask(0, "Task", "QmR", toUSDC(30), deadline);
    });

    it("should only be callable by BiddingContract", async function () {
      await expect(
        taskContract.connect(owner).assignAgent(0, agent.address)
      ).to.be.revertedWith("Only BiddingContract");
    });
  });

  describe("submitWork", function () {
    beforeEach(async function () {
      const deadline = (await time.latest()) + 3600;
      await taskContract.createTask(0, "Task", "QmR", toUSDC(30), deadline);

      // Simulate assignment via bidding contract
      await biddingContract.setTaskContract(await taskContract.getAddress());
      // We need to call assignAgent from the bidding contract address
      // Use impersonation
      const biddingAddr = await biddingContract.getAddress();
      await ethers.provider.send("hardhat_setBalance", [biddingAddr, "0x56BC75E2D63100000"]);
      const biddingSigner = await ethers.getImpersonatedSigner(biddingAddr);
      await taskContract.connect(biddingSigner).assignAgent(0, agent.address);
    });

    it("should allow assigned agent to submit work", async function () {
      await expect(
        taskContract.connect(agent).submitWork(0, "QmOutputCID")
      )
        .to.emit(taskContract, "TaskSubmitted")
        .withArgs(0, "QmOutputCID");

      const task = await taskContract.getTask(0);
      expect(task.status).to.equal(2); // SUBMITTED
      expect(task.outputCID).to.equal("QmOutputCID");
    });

    it("should reject submission from non-assigned agent", async function () {
      await expect(
        taskContract.connect(client).submitWork(0, "QmBad")
      ).to.be.revertedWith("Not assigned agent");
    });

    it("should reject submission after deadline", async function () {
      await time.increase(3700); // past deadline
      await expect(
        taskContract.connect(agent).submitWork(0, "QmLate")
      ).to.be.revertedWith("Deadline passed");
    });
  });

  describe("markVerified", function () {
    beforeEach(async function () {
      const deadline = (await time.latest()) + 3600;
      await taskContract.createTask(0, "Task", "QmR", toUSDC(30), deadline);

      // Assign agent
      const biddingAddr = await biddingContract.getAddress();
      await ethers.provider.send("hardhat_setBalance", [biddingAddr, "0x56BC75E2D63100000"]);
      const biddingSigner = await ethers.getImpersonatedSigner(biddingAddr);
      await taskContract.connect(biddingSigner).assignAgent(0, agent.address);

      // Submit work
      await taskContract.connect(agent).submitWork(0, "QmOutput");
    });

    it("should pay the agent and mark verified", async function () {
      const verAddr = await verificationContract.getAddress();
      await ethers.provider.send("hardhat_setBalance", [verAddr, "0x56BC75E2D63100000"]);
      const verSigner = await ethers.getImpersonatedSigner(verAddr);

      const balBefore = await usdc.balanceOf(agent.address);
      await taskContract.connect(verSigner).markVerified(0);
      const balAfter = await usdc.balanceOf(agent.address);

      expect(balAfter - balBefore).to.equal(toUSDC(30));

      const task = await taskContract.getTask(0);
      expect(task.status).to.equal(3); // VERIFIED
      expect(task.budget).to.equal(0);
    });

    it("should only be callable by VerificationContract", async function () {
      await expect(
        taskContract.connect(owner).markVerified(0)
      ).to.be.revertedWith("Only VerificationContract");
    });
  });

  describe("markFailed", function () {
    beforeEach(async function () {
      const deadline = (await time.latest()) + 3600;
      await taskContract.createTask(0, "Task", "QmR", toUSDC(30), deadline);

      const biddingAddr = await biddingContract.getAddress();
      await ethers.provider.send("hardhat_setBalance", [biddingAddr, "0x56BC75E2D63100000"]);
      const biddingSigner = await ethers.getImpersonatedSigner(biddingAddr);
      await taskContract.connect(biddingSigner).assignAgent(0, agent.address);

      await taskContract.connect(agent).submitWork(0, "QmBadOutput");
    });

    it("should reset task to OPEN with bonus budget", async function () {
      const verAddr = await verificationContract.getAddress();
      await ethers.provider.send("hardhat_setBalance", [verAddr, "0x56BC75E2D63100000"]);
      const verSigner = await ethers.getImpersonatedSigner(verAddr);

      // The bonus is 5% of 30 USDC = 1.5 USDC. JobManager must have remaining budget.
      await taskContract.connect(verSigner).markFailed(0);

      const task = await taskContract.getTask(0);
      expect(task.status).to.equal(0); // OPEN again
      expect(task.retryCount).to.equal(1);
      expect(task.assignedAgent).to.equal(ethers.ZeroAddress);
      expect(task.outputCID).to.equal("");
      // Budget should be original + 5% bonus
      expect(task.budget).to.equal(toUSDC(30) + (toUSDC(30) * 500n) / 10000n);
    });

    it("should only be callable by VerificationContract", async function () {
      await expect(
        taskContract.connect(owner).markFailed(0)
      ).to.be.revertedWith("Only VerificationContract");
    });
  });
});
