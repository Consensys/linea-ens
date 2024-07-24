import { exec } from "child_process";
import {
  BigNumberish,
  Contract,
  FeeData,
  TransactionRequest,
  Wallet,
  BlockTag,
  FetchRequest,
  AbiCoder,
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
  afterBlockNo: bigint,
  pollingInterval: number
) {
  let currentL2BlockNumberFinalized;
  do {
    currentL2BlockNumberFinalized =
      (await rollup.currentL2BlockNumber({
        blockTag: "finalized",
      })) || BigInt(0);
    await setTimeout(pollingInterval);
  } while (currentL2BlockNumberFinalized < afterBlockNo);
}

export async function waitForLatestL2BlockNumberFinalizedToChange(
  rollup: Contract,
  pollingInterval: number,
  blockTag: BlockTag = "latest"
) {
  const currentL2BlockNumber =
    (await rollup.currentL2BlockNumber({
      blockTag,
    })) || BigInt(0);
  let newL2BlockNumber;
  do {
    newL2BlockNumber =
      (await rollup.currentL2BlockNumber({
        blockTag,
      })) || BigInt(0);
    await setTimeout(pollingInterval);
  } while (currentL2BlockNumber >= newL2BlockNumber);
}

export async function deployContract(
  name: string,
  provider: Wallet,
  ...args: any[]
) {
  const factory = await ethers.getContractFactory(name, provider);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

export async function fetchCCIPGateway(ccipCustomException) {
  const sender = ccipCustomException.revert.args[0];
  const url = ccipCustomException.revert.args[1];
  const data = ccipCustomException.revert.args[2];
  const request = new FetchRequest(url);
  request.body = { data, sender };

  const resp = await request.send();
  return resp.bodyJson.data;
}

export function getExtraData(ccipCustomException) {
  return ccipCustomException.revert.args[4];
}

export function changeBlockNumberInCCIPResponse(
  ccipRespData: string,
  newBlockNumber: bigint
) {
  const prefix = ccipRespData.slice(0, 2 + 64 * 2);
  const suffix = ccipRespData.slice(2 + 64 * 3);

  const blockNoTestHex = AbiCoder.defaultAbiCoder()
    .encode(["uint256"], [newBlockNumber])
    .slice(2);

  return prefix + blockNoTestHex + suffix;
}

export async function execDockerCommand(
  command: string,
  containerName: string
): Promise<string> {
  const dockerCommand = `docker ${command} ${containerName}`;
  console.log(`Executing: ${dockerCommand}...`);
  return new Promise((resolve, reject) => {
    exec(dockerCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing (${dockerCommand}): ${stderr}`);
        reject(error);
      }
      console.log(`Execution success (${dockerCommand}): ${stdout}`);
      resolve(stdout);
    });
  });
}
