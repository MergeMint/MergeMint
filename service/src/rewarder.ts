import { ethers } from "ethers";

const distributorAbi = [
  "function reward(address to, uint256 amount, bytes32 eventId) external",
  "function owner() view returns (address)",
  "function paused() view returns (bool)",
  "function usdc() view returns (address)",
  "function setPaused(bool isPaused) external",
] as const;

export class Rewarder {
  private readonly contract?: ethers.Contract;
  private readonly provider?: ethers.JsonRpcProvider;
  private readonly signerAddress: string;
  private readonly mockMode: boolean;

  constructor(rpcUrl: string, privateKey: string, contractAddress: string, mockMode = false) {
    this.mockMode = mockMode;
    if (mockMode) {
      this.signerAddress = "0x000000000000000000000000000000000000dEaD";
      return;
    }
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);
    this.provider = provider;
    this.signerAddress = signer.address;
    this.contract = new ethers.Contract(contractAddress, distributorAbi, signer);
  }

  get botAddress(): string {
    return this.signerAddress;
  }

  async reward(to: string, amountInUsdc: number, eventIdText: string): Promise<string> {
    if (this.mockMode) {
      return `mock-tx-${ethers.id(`${to}:${amountInUsdc}:${eventIdText}`).slice(2, 18)}`;
    }
    const amount = ethers.parseUnits(amountInUsdc.toString(), 6);
    const eventId = ethers.id(eventIdText);
    const tx = await this.contract!.reward(to, amount, eventId);
    const receipt = await tx.wait();
    return receipt?.hash || tx.hash;
  }

  async getAdminStatus(): Promise<{
    mockMode: boolean;
    botAddress: string;
    owner: string;
    paused: boolean;
    usdcAddress: string;
    botUsdcBalance: string;
    contractUsdcBalance: string;
  }> {
    if (this.mockMode) {
      return {
        mockMode: true,
        botAddress: this.signerAddress,
        owner: this.signerAddress,
        paused: false,
        usdcAddress: "mock-usdc",
        botUsdcBalance: "0",
        contractUsdcBalance: "0",
      };
    }

    const owner = (await this.contract!.owner()) as string;
    const paused = (await this.contract!.paused()) as boolean;
    const usdcAddress = (await this.contract!.usdc()) as string;
    const erc20 = new ethers.Contract(
      usdcAddress,
      ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"] as const,
      this.provider!,
    );
    const decimals = Number(await erc20.decimals());
    const [botBalRaw, contractBalRaw] = await Promise.all([
      erc20.balanceOf(this.signerAddress),
      erc20.balanceOf(this.contract!.target as string),
    ]);

    return {
      mockMode: false,
      botAddress: this.signerAddress,
      owner,
      paused,
      usdcAddress,
      botUsdcBalance: ethers.formatUnits(botBalRaw, decimals),
      contractUsdcBalance: ethers.formatUnits(contractBalRaw, decimals),
    };
  }

  async setPaused(isPaused: boolean): Promise<string> {
    if (this.mockMode) {
      return `mock-tx-pause-${isPaused ? "on" : "off"}`;
    }
    const tx = await this.contract!.setPaused(isPaused);
    const receipt = await tx.wait();
    return receipt?.hash || tx.hash;
  }
}
