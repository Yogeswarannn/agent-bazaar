import pkg from "hardhat";
const { ethers } = pkg;
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const usdcAddress = process.env.USDC_ADDRESS;
  const feeTreasury = process.env.FEE_TREASURY || deployer.address;
  const platformFeeBps = 200; // 2%

  if (!usdcAddress) {
    throw new Error("Please set USDC_ADDRESS in your .env file");
  }

  console.log("Using USDC at:", usdcAddress);
  console.log("Fee Treasury:", feeTreasury);

  // 1. Deploy JobManager
  console.log("Deploying JobManager...");
  const JobManager = await ethers.getContractFactory("JobManager");
  const jobManager = await JobManager.deploy(usdcAddress, feeTreasury, platformFeeBps);
  await jobManager.waitForDeployment();
  const jobManagerAddress = await jobManager.getAddress();
  console.log("JobManager deployed to:", jobManagerAddress);

  // 2. Deploy TaskContract
  console.log("Deploying TaskContract...");
  const TaskContract = await ethers.getContractFactory("TaskContract");
  const taskContract = await TaskContract.deploy(jobManagerAddress);
  await taskContract.waitForDeployment();
  const taskContractAddress = await taskContract.getAddress();
  console.log("TaskContract deployed to:", taskContractAddress);

  // 3. Deploy BiddingContract
  console.log("Deploying BiddingContract...");
  const BiddingContract = await ethers.getContractFactory("BiddingContract");
  const biddingContract = await BiddingContract.deploy(taskContractAddress, usdcAddress);
  await biddingContract.waitForDeployment();
  const biddingContractAddress = await biddingContract.getAddress();
  console.log("BiddingContract deployed to:", biddingContractAddress);

  // 4. Deploy VerificationContract
  console.log("Deploying VerificationContract...");
  const VerificationContract = await ethers.getContractFactory("VerificationContract");
  const verificationContract = await VerificationContract.deploy(taskContractAddress, biddingContractAddress);
  await verificationContract.waitForDeployment();
  const verificationContractAddress = await verificationContract.getAddress();
  console.log("VerificationContract deployed to:", verificationContractAddress);

  // --- Linking Contracts ---

  console.log("Linking contracts...");

  // JobManager needs to know about TaskContract
  console.log("Setting TaskContract in JobManager...");
  await (await jobManager.setTaskContract(taskContractAddress)).wait();

  // TaskContract needs to know about BiddingContract and VerificationContract
  console.log("Setting BiddingContract and VerificationContract in TaskContract...");
  await (await taskContract.setBiddingContract(biddingContractAddress)).wait();
  await (await taskContract.setVerificationContract(verificationContractAddress)).wait();

  console.log("--- Deployment Summary ---");
  console.log("JobManager:         ", jobManagerAddress);
  console.log("TaskContract:       ", taskContractAddress);
  console.log("BiddingContract:    ", biddingContractAddress);
  console.log("VerificationContract:", verificationContractAddress);
  console.log("USDC (Sepolia):     ", usdcAddress);
  console.log("--------------------------");

  console.log("Deployment and linking complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
