import pkg from 'hardhat';
const { ethers } = pkg;

/**
 * @notice Automated Local Deployment & Wiring Script
 * This script deploys a Mock USDC first, then the system contracts,
 * performs the "Wiring Handshake," and mints tokens to test accounts.
 */
async function main() {
  const [deployer, client, agent] = await ethers.getSigners();
  console.log("-------------------------------------------------------------------");
  console.log("🚀 Initializing Local Testing Environment...");
  console.log("📍 Deployer (Admin/Treasury):", deployer.address);
  console.log("📍 Client (Role):           ", client.address);
  console.log("📍 Agent (Role):            ", agent.address);
  console.log("-------------------------------------------------------------------");

  // 1. Deploy Mock USDC
  console.log("\n📦 0/5 Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddr = await usdc.getAddress();
  console.log("✅ MockUSDC deployed at:", usdcAddr);

  // 2. Deployment Sequence
  console.log("\n📦 1/5 Deploying JobManager...");
  const JobManager = await ethers.getContractFactory("JobManager");
  const jobManager = await JobManager.deploy(usdcAddr, deployer.address, 200); // 2% fee
  await jobManager.waitForDeployment();
  const jobManagerAddr = await jobManager.getAddress();
  console.log("✅ JobManager deployed at:", jobManagerAddr);

  console.log("\n📦 2/5 Deploying TaskContract...");
  const TaskContract = await ethers.getContractFactory("TaskContract");
  const taskContract = await TaskContract.deploy(usdcAddr, jobManagerAddr);
  await taskContract.waitForDeployment();
  const taskContractAddr = await taskContract.getAddress();
  console.log("✅ TaskContract deployed at:", taskContractAddr);

  console.log("\n📦 3/5 Deploying BiddingContract...");
  const BiddingContract = await ethers.getContractFactory("BiddingContract");
  const biddingContract = await BiddingContract.deploy(usdcAddr, taskContractAddr, deployer.address, 1000000);
  await biddingContract.waitForDeployment();
  const biddingContractAddr = await biddingContract.getAddress();
  console.log("✅ BiddingContract deployed at:", biddingContractAddr);

  console.log("\n📦 4/5 Deploying VerificationContract...");
  const VerificationContract = await ethers.getContractFactory("VerificationContract");
  const verificationContract = await VerificationContract.deploy(taskContractAddr, biddingContractAddr);
  await verificationContract.waitForDeployment();
  const verificationContractAddr = await verificationContract.getAddress();
  console.log("✅ VerificationContract deployed at:", verificationContractAddr);

  // 3. Wiring (Handshake)
  console.log("\n🔗 -----------------------------------------------------------------");
  console.log("🛠️ Starting Automated Wiring (The Handshake)...");

  await (await jobManager.setTaskContract(taskContractAddr)).wait();
  await (await taskContract.setBiddingContract(biddingContractAddr)).wait();
  await (await taskContract.setVerificationContract(verificationContractAddr)).wait();
  await (await biddingContract.setTaskContract(taskContractAddr)).wait();
  await (await verificationContract.setTaskContract(taskContractAddr)).wait();
  await (await verificationContract.setBiddingContract(biddingContractAddr)).wait();

  console.log("✅ Wiring Phase Completed.");
  console.log("🔗 -----------------------------------------------------------------");

  // 4. Seeding Test Tokens
  console.log("\n💰 Seeding Test Tokens (Mock USDC)...");
  const seedAmount = ethers.parseUnits("1000", 6); // 1,000 USDC
  await (await usdc.mint(deployer.address, seedAmount)).wait();
  await (await usdc.mint(client.address, seedAmount)).wait();
  await (await usdc.mint(agent.address, seedAmount)).wait();

  console.log("✅ Minted 1,000 mUSDC to Deployer, Client, and Agent.");

  console.log("\n🎉 LOCAL ENVIRONMENT INITIALIZED!");
  console.log("------------------------------------------");
  console.log("MockUSDC:           ", usdcAddr);
  console.log("JobManager:         ", jobManagerAddr);
  console.log("TaskContract:       ", taskContractAddr);
  console.log("BiddingContract:    ", biddingContractAddr);
  console.log("VerificationContract:", verificationContractAddr);
  console.log("------------------------------------------");
  console.log("🚀 Run 'npx hardhat run scripts/deploy_local.js' anytime to reset.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
