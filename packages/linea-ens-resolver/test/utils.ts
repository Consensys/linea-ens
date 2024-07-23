import {
  BigNumberish,
  Contract,
  FeeData,
  TransactionRequest,
  Wallet,
} from "ethers";
import { ethers } from "hardhat";
import { setTimeout } from "timers/promises";

export function sendTransactionsWithInterval(
  signer: Wallet,
  transactionRequest: TransactionRequest,
  pollingInterval: number
) {
  return setInterval(async function () {
    const tx = await signer.sendTransaction(transactionRequest);
    await tx.wait();
  }, pollingInterval);
}

export function getAndIncreaseFeeData(
  feeData: FeeData
): [BigNumberish, BigNumberish, BigNumberish] {
  const maxPriorityFeePerGas = BigInt(
    (parseFloat(feeData.maxPriorityFeePerGas!.toString()) * 1.1).toFixed(0)
  );
  const maxFeePerGas = BigInt(
    (parseFloat(feeData.maxFeePerGas!.toString()) * 1.1).toFixed(0)
  );
  const gasPrice = BigInt(
    (parseFloat(feeData.gasPrice!.toString()) * 1.1).toFixed(0)
  );
  return [maxPriorityFeePerGas, maxFeePerGas, gasPrice];
}

export async function waitForL2BlockNumberFinalized(
  rollup: Contract,
  afterBlockNo: number,
  pollingInterval: number
) {
  let currentL2BlockNumberFinalized;
  do {
    currentL2BlockNumberFinalized = await rollup.currentL2BlockNumber({
      blockTag: "finalized",
    });
    await setTimeout(pollingInterval);
  } while (currentL2BlockNumberFinalized < afterBlockNo);
}

export async function waitForLatestL2BlockNumberFinalizedToChange(
  rollup: Contract,
  pollingInterval: number
) {
  const currentL2BlockNumber = await rollup.currentL2BlockNumber();
  let newL2BlockNumber;
  do {
    newL2BlockNumber = await rollup.currentL2BlockNumber();
    await setTimeout(pollingInterval);
  } while (currentL2BlockNumber === newL2BlockNumber);
}

export const deployContract = async (
  name: string,
  provider: Wallet,
  ...args: any[]
) => {
  const factory = await ethers.getContractFactory(name, provider);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  return contract;
};
