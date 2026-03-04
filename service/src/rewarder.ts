import { ethers } from "ethers";

const distributorAbi = [
  "function reward(address to, uint256 amount, bytes32 eventId) external",
] as const;

export class Rewarder {
  private readonly contract?: ethers.Contract;
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
}
