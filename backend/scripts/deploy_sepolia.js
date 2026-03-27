import pkg from 'hardhat';
const { ethers } = pkg;
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * @notice Automated Sepolia Deployment & Wiring Script
 * This script deploys JobManager, TaskContract, BiddingContract, and VerificationContract,
 * then performs the mandatory addresses "Wiring" so they can interact on-chain.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("-------------------------------------------------------------------");
  console.log("🚀 Deploying AI Gig System with account:", deployer.address);
  console.log("💰 Wallet Balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  console.log("-------------------------------------------------------------------");

  // 1. Config / Addresses
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x1c7D4B196Cb0C9BD997cF530D0F65B1b29A2994B";
  const FEE_TREASURY = deployer.address;
  const REPUTATION_ORACLE = deployer.address;
  const PLATFORM_FEE_BPS = 200; // 2%
  const BOND_AMOUNT = 1000000; // 1 USDC (6 decimals)

  console.log("📍 USDC Address:", USDC_ADDRESS);

  // 2. Deployment Sequence
  console.log("\n📦 1/4 Deploying JobManager...");
  const JobManager = await ethers.getContractFactory("JobManager");
  const jobManager = await JobManager.deploy(USDC_ADDRESS, FEE_TREASURY, PLATFORM_FEE_BPS);
  await jobManager.waitForDeployment();
  const jobManagerAddr = await jobManager.getAddress();
  console.log("✅ JobManager deployed at:", jobManagerAddr);

  console.log("\n📦 2/4 Deploying TaskContract...");
  const TaskContract = await ethers.getContractFactory("TaskContract");
  const taskContract = await TaskContract.deploy(USDC_ADDRESS, jobManagerAddr);
  await taskContract.waitForDeployment();
  const taskContractAddr = await taskContract.getAddress();
  console.log("✅ TaskContract deployed at:", taskContractAddr);

  console.log("\n📦 3/4 Deploying BiddingContract...");
  const BiddingContract = await ethers.getContractFactory("BiddingContract");
  const biddingContract = await BiddingContract.deploy(USDC_ADDRESS, taskContractAddr, REPUTATION_ORACLE, BOND_AMOUNT);
  await biddingContract.waitForDeployment();
  const biddingContractAddr = await biddingContract.getAddress();
  console.log("✅ BiddingContract deployed at:", biddingContractAddr);

  console.log("\n📦 4/4 Deploying VerificationContract...");
  const VerificationContract = await ethers.getContractFactory("VerificationContract");
  const verificationContract = await VerificationContract.deploy(taskContractAddr, biddingContractAddr);
  await verificationContract.waitForDeployment();
  const verificationContractAddr = await verificationContract.getAddress();
  console.log("✅ VerificationContract deployed at:", verificationContractAddr);

  // 3. Wiring (Handshake)
  console.log("\n🔗 -----------------------------------------------------------------");
  console.log("🛠️ Starting Automated Wiring (The Handshake)...");

  // a. JobManager -> TaskContract
  console.log("👉 jobManager.setTaskContract(...)");
  await (await jobManager.setTaskContract(taskContractAddr)).wait();

  // b. TaskContract -> BiddingContract
  console.log("👉 taskContract.setBiddingContract(...)");
  await (await taskContract.setBiddingContract(biddingContractAddr)).wait();

  // c. TaskContract -> VerificationContract
  console.log("👉 taskContract.setVerificationContract(...)");
  await (await taskContract.setVerificationContract(verificationContractAddr)).wait();

  // d. BiddingContract -> TaskContract
  console.log("👉 biddingContract.setTaskContract(...)");
  await (await biddingContract.setTaskContract(taskContractAddr)).wait();

  // e. VerificationContract -> TaskContract
  console.log("👉 verificationContract.setTaskContract(...)");
  await (await verificationContract.setTaskContract(taskContractAddr)).wait();

  // f. VerificationContract -> BiddingContract
  console.log("👉 verificationContract.setBiddingContract(...)");
  await (await verificationContract.setBiddingContract(biddingContractAddr)).wait();

  console.log("✅ Wiring Phase Completed Successfully.");
  console.log("🔗 -----------------------------------------------------------------");

  console.log("\n🎉 ALL CONTRACTS DEPLOYED AND CONNECTED!");
  console.log("------------------------------------------");
  console.log("JobManager:          ", jobManagerAddr);
  console.log("TaskContract:        ", taskContractAddr);
  console.log("BiddingContract:     ", biddingContractAddr);
  console.log("VerificationContract:", verificationContractAddr);
  console.log("------------------------------------------");
  console.log("🚀 The system is now fully live and autonomous on Sepolia.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
