import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("----------------------------------------------------");
  console.log("Deploying AcademicDocumentRegistry with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const Factory = await ethers.getContractFactory("AcademicDocumentRegistry");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("AcademicDocumentRegistry deployed to:", contractAddress);
  console.log("Transaction Hash:", contract.deploymentTransaction()?.hash);
  console.log("----------------------------------------------------");

  // Load ABI from artifacts
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/AcademicDocumentRegistry.sol/AcademicDocumentRegistry.json"
  );
  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    abi = artifact.abi;
  }

  const deploymentData = {
    address: contractAddress,
    network: "localhost",
    chainId: 31337,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    abi,
  };

  // 1. Save in blockchain directory
  const localOutput = path.join(__dirname, "../deployed-contract.json");
  fs.writeFileSync(localOutput, JSON.stringify(deploymentData, null, 2));
  console.log("Saved deployment metadata to:", localOutput);

  // 2. Export to api project if dir exists
  const apiDir = path.join(__dirname, "../../api/src/config");
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(apiDir, "contract-deployment.json"),
    JSON.stringify(deploymentData, null, 2)
  );
  console.log("Exported contract configuration to api/src/config/contract-deployment.json");

  // 3. Export to web project if dir exists
  const webDir = path.join(__dirname, "../../web/src/config");
  if (!fs.existsSync(webDir)) {
    fs.mkdirSync(webDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(webDir, "contract-deployment.json"),
    JSON.stringify(deploymentData, null, 2)
  );
  console.log("Exported contract configuration to web/src/config/contract-deployment.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
