import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";

describe("JobManager", function () {
  let usdc, jobManager, taskContract;
  let owner, client, treasury, other;

  const USDC_DECIMALS = 6;
  const toUSDC = (n) => ethers.parseUnits(n.toString(), USDC_DECIMALS);
  const FEE_BPS = 200n; // 2%

  beforeEach(async function () {
    [owner, client, treasury, other] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    const JobManager = await ethers.getContractFactory("JobManager");
    jobManager = await JobManager.deploy(
      await usdc.getAddress(),
      treasury.address,
      FEE_BPS
    );

    // Deploy a real TaskContract to wire up
    const TaskContract = await ethers.getContractFactory("TaskContract");
    taskContract = await TaskContract.deploy(
      await usdc.getAddress(),
      await jobManager.getAddress()
    );

    await jobManager.setTaskContract(await taskContract.getAddress());

    // Mint USDC to client
    await usdc.mint(client.address, toUSDC(1000));
    await usdc.connect(client).approve(await jobManager.getAddress(), toUSDC(1000));
  });

  describe("Deployment", function () {
    it("should set USDC address correctly", async function () {
      expect(await jobManager.usdc()).to.equal(await usdc.getAddress());
    });

    it("should set fee treasury", async function () {
      expect(await jobManager.feeTreasury()).to.equal(treasury.address);
    });

    it("should set platform fee BPS", async function () {
      expect(await jobManager.platformFeeBps()).to.equal(FEE_BPS);
    });

    it("should reject zero USDC address in constructor", async function () {
      const JobManager = await ethers.getContractFactory("JobManager");
      await expect(
        JobManager.deploy(ethers.ZeroAddress, treasury.address, FEE_BPS)
      ).to.be.revertedWith("Bad USDC address");
    });
  });

  describe("postJob", function () {
    it("should create a job and lock funds", async function () {
      const budget = toUSDC(100);
      const fee = (budget * FEE_BPS) / 10000n;
      const netBudget = budget - fee;

      await expect(
        jobManager.connect(client).postJob("QmTestCID123", budget)
      )
        .to.emit(jobManager, "JobPosted")
        .withArgs(0, client.address, "QmTestCID123", netBudget);

      const job = await jobManager.getJob(0);
      expect(job.client).to.equal(client.address);
      expect(job.totalBudget).to.equal(netBudget);
      expect(job.remainingBudget).to.equal(netBudget);
      expect(job.status).to.equal(0); // OPEN
    });

    it("should send fee to treasury", async function () {
      const budget = toUSDC(100);
      const fee = (budget * FEE_BPS) / 10000n;

      const balBefore = await usdc.balanceOf(treasury.address);
      await jobManager.connect(client).postJob("QmTestCID", budget);
      const balAfter = await usdc.balanceOf(treasury.address);

      expect(balAfter - balBefore).to.equal(fee);
    });

    it("should reject zero budget", async function () {
      await expect(
        jobManager.connect(client).postJob("QmTestCID", 0)
      ).to.be.revertedWith("Budget must be > 0");
    });

    it("should reject empty CID", async function () {
      await expect(
        jobManager.connect(client).postJob("", toUSDC(10))
      ).to.be.revertedWith("No CID provided");
    });

    it("should increment job IDs", async function () {
      await jobManager.connect(client).postJob("QmCID1", toUSDC(10));
      await jobManager.connect(client).postJob("QmCID2", toUSDC(10));
      
      const job0 = await jobManager.getJob(0);
      const job1 = await jobManager.getJob(1);
      expect(job0.id).to.equal(0);
      expect(job1.id).to.equal(1);
    });
  });

  describe("cancelJob", function () {
    beforeEach(async function () {
      await jobManager.connect(client).postJob("QmTestCID", toUSDC(100));
    });

    it("should refund the client on cancel", async function () {
      const job = await jobManager.getJob(0);
      const balBefore = await usdc.balanceOf(client.address);

      await jobManager.connect(client).cancelJob(0);

      const balAfter = await usdc.balanceOf(client.address);
      expect(balAfter - balBefore).to.equal(job.remainingBudget);

      const cancelled = await jobManager.getJob(0);
      expect(cancelled.status).to.equal(3); // CANCELLED
      expect(cancelled.remainingBudget).to.equal(0);
    });

    it("should reject cancel from non-client", async function () {
      await expect(
        jobManager.connect(other).cancelJob(0)
      ).to.be.revertedWith("Not your job");
    });

    it("should reject cancel if not OPEN", async function () {
      await jobManager.connect(client).cancelJob(0);
      await expect(
        jobManager.connect(client).cancelJob(0)
      ).to.be.revertedWith("Cannot cancel at this stage");
    });
  });

  describe("allocateBudget", function () {
    beforeEach(async function () {
      await jobManager.connect(client).postJob("QmTestCID", toUSDC(100));
    });

    it("should only be callable by TaskContract", async function () {
      await expect(
        jobManager.connect(other).allocateBudget(0, toUSDC(10))
      ).to.be.revertedWith("Only TaskContract");
    });

    it("should reject over-allocation", async function () {
      // TaskContract calls allocateBudget via createTask
      // Test by trying to create a task with more budget than available
      const job = await jobManager.getJob(0);
      const overBudget = job.remainingBudget + 1n;
      
      await expect(
        taskContract.createTask(0, "Too expensive", "QmRubric", overBudget, (await time.latest()) + 3600)
      ).to.be.revertedWith("Insufficient budget");
    });
  });

  describe("Admin", function () {
    it("should allow owner to set fee BPS", async function () {
      await jobManager.setFeeBps(500);
      expect(await jobManager.platformFeeBps()).to.equal(500);
    });

    it("should reject fee BPS > 1000 (10%)", async function () {
      await expect(jobManager.setFeeBps(1001)).to.be.revertedWith("Max 10%");
    });

    it("should reject zero address for task contract", async function () {
      await expect(
        jobManager.setTaskContract(ethers.ZeroAddress)
      ).to.be.revertedWith("Zero address");
    });

    it("should reject zero address for fee treasury", async function () {
      await expect(
        jobManager.setFeeTreasury(ethers.ZeroAddress)
      ).to.be.revertedWith("Zero address");
    });

    it("should reject non-owner admin calls", async function () {
      await expect(
        jobManager.connect(other).setFeeBps(100)
      ).to.be.reverted;
    });
  });
});
