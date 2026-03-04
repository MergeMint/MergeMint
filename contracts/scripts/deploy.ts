import { config as loadEnv } from "dotenv";
import { ethers } from "hardhat";

loadEnv();

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing env: ${name}`);
  }
  return value.trim();
}

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  const usdc = requiredEnv("USDC_ADDRESS");
  const owner = (process.env.OWNER_ADDRESS || deployer.address).trim();

  if (!ethers.isAddress(usdc)) {
    throw new Error(`Invalid USDC_ADDRESS: ${usdc}`);
  }
  if (!ethers.isAddress(owner)) {
    throw new Error(`Invalid OWNER_ADDRESS: ${owner}`);
  }

  const factory = await ethers.getContractFactory("PrBountyDistributor");
  const contract = await factory.deploy(usdc, owner);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("PrBountyDistributor deployed");
  console.log(`network=${(await ethers.provider.getNetwork()).name}`);
  console.log(`deployer=${deployer.address}`);
  console.log(`owner=${owner}`);
  console.log(`usdc=${usdc}`);
  console.log(`contract=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
