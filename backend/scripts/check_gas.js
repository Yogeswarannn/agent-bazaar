import pkg from 'hardhat';
const { ethers } = pkg;

/**
 * @notice Gas Fee Calculation Script
 * Reports the deployment cost of each contract in ETH.
 * Assumes a Standard Gas Price of 20 Gwei (Mainnet average).
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const GAS_PRICE_GWEI = 20n; // 20 Gwei
  const gasPrice = ethers.parseUnits(GAS_PRICE_GWEI.toString(), "gwei");

  console.log("-------------------------------------------------------------------");
  console.log("📊 Gas Fee Estimation (at 20 Gwei)...");
  console.log("-------------------------------------------------------------------");

  const DUMMY_ADDR = "0x0000000000000000000000000000000000000001";
  const contracts = [
    { name: "MockUSDC", args: [] },
    { name: "JobManager", args: [DUMMY_ADDR, DUMMY_ADDR, 200] },
    { name: "TaskContract", args: [DUMMY_ADDR, DUMMY_ADDR] },
    { name: "BiddingContract", args: [DUMMY_ADDR, DUMMY_ADDR, DUMMY_ADDR, 1000000] },
    { name: "VerificationContract", args: [DUMMY_ADDR, DUMMY_ADDR] }
  ];

  let totalGas = 0n;
  let totalEth = 0n;

  console.log(`| Contract | Gas Used | ETH Cost |`);
  console.log(`| :--- | :--- | :--- |`);

  for (const contractInfo of contracts) {
    try {
      const Factory = await ethers.getContractFactory(contractInfo.name);
      
      // Perform deployment estimation
      const deployTx = await Factory.getDeployTransaction(...contractInfo.args);
      const estimate = await ethers.provider.estimateGas(deployTx);
      
      const ethCost = estimate * gasPrice;
      const ethCostFormatted = ethers.formatEther(ethCost);

      console.log(`| ${contractInfo.name} | ${estimate} | ${ethCostFormatted} ETH |`);
      
      totalGas += estimate;
      totalEth += ethCost;
    } catch (e) {
      console.log(`| ${contractInfo.name} | ERROR: Execution Reverted/Arg Typo | - |`);
    }
  }

  console.log("-------------------------------------------------------------------");
  console.log(`🏆 TOTAL ESTIMATE: ${ethers.formatEther(totalEth)} ETH`);
  console.log("-------------------------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
