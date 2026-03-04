import { expect } from "chai";
import { ethers } from "hardhat";

describe("PrBountyDistributor", () => {
  it("rewards once per event id and blocks duplicates", async () => {
    const [owner, recipient] = await ethers.getSigners();

    const usdcFactory = await ethers.getContractFactory("MockUSDC");
    const usdc = await usdcFactory.deploy();
    await usdc.waitForDeployment();

    const distributorFactory = await ethers.getContractFactory("PrBountyDistributor");
    const distributor = await distributorFactory.deploy(await usdc.getAddress(), owner.address);
    await distributor.waitForDeployment();

    await usdc.mint(await distributor.getAddress(), 100n * 10n ** 6n);

    const eventIdText = "acme/payroll#42:opened";
    const eventId = ethers.id(eventIdText);
    await distributor.reward(recipient.address, 1n * 10n ** 6n, eventId);

    expect(await usdc.balanceOf(recipient.address)).to.equal(1n * 10n ** 6n);
    await expect(
      distributor.reward(recipient.address, 1n * 10n ** 6n, eventId),
    ).to.be.revertedWith("already processed");
  });

  it("only owner can reward", async () => {
    const [owner, attacker, recipient] = await ethers.getSigners();

    const usdcFactory = await ethers.getContractFactory("MockUSDC");
    const usdc = await usdcFactory.deploy();
    await usdc.waitForDeployment();

    const distributorFactory = await ethers.getContractFactory("PrBountyDistributor");
    const distributor = await distributorFactory.deploy(await usdc.getAddress(), owner.address);
    await distributor.waitForDeployment();

    await usdc.mint(await distributor.getAddress(), 100n * 10n ** 6n);

    await expect(
      distributor.connect(attacker).reward(recipient.address, 1n * 10n ** 6n, ethers.id("x")),
    ).to.be.revertedWith("not owner");
  });
});
