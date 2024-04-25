import { Server } from "@chainlink/ccip-read-server";
import { makeL2Gateway } from "../src";
import { HardhatEthersProvider } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";
import { HardhatEthersHelpers } from "@nomicfoundation/hardhat-ethers/types";
import { expect } from "chai";
import {
  BrowserProvider,
  Contract,
  FetchRequest,
  JsonRpcProvider,
  Signer,
  ethers as ethersT,
} from "ethers";
import { ethers } from "hardhat";
import { EthereumProvider } from "hardhat/types";
import request from "supertest";

type ethersObj = typeof ethersT &
  Omit<HardhatEthersHelpers, "provider"> & {
    provider: Omit<HardhatEthersProvider, "_hardhatProvider"> & {
      _hardhatProvider: EthereumProvider;
    };
  };

declare module "hardhat/types/runtime" {
  const ethers: ethersObj;
  interface HardhatRuntimeEnvironment {
    // @ts-ignore
    ethers: ethersObj;
  }
}

describe("L1Verifier", () => {
  let l1Provider: BrowserProvider;
  let l2Provider: JsonRpcProvider;
  let l2TestContract: string;
  let signer: Signer;
  let target: Contract;

  before(async () => {
    if (!process.env.L2_PROVIDER_URL) {
      throw "No L2_PROVIDER_URL found in env file";
    }
    if (!process.env.L2_CONTRACT_TEST_ADDRESS) {
      throw "No L2_CONTRACT_TEST_ADDRESS found in env file";
    }

    // Hack to get a 'real' ethers provider from hardhat. The default `HardhatProvider`
    // doesn't support CCIP-read.
    // @ts-ignore
    l1Provider = new ethers.BrowserProvider(ethers.provider._hardhatProvider);
    l2Provider = new ethers.JsonRpcProvider(
      process.env.L2_PROVIDER_URL,
      59140,
      {
        staticNetwork: true,
      }
    );
    l2TestContract = process.env.L2_CONTRACT_TEST_ADDRESS;
    signer = await l1Provider.getSigner(0);

    const Rollup = await ethers.getContractFactory("RollupMock", signer);
    const rollup = await Rollup.deploy();

    const gateway = makeL2Gateway(
      l1Provider as unknown as JsonRpcProvider,
      l2Provider,
      await rollup.getAddress()
    );
    const server = new Server();
    gateway.add(server);
    const app = server.makeApp("/");
    const getUrl = FetchRequest.createGetUrlFunc();
    ethers.FetchRequest.registerGetUrl(async (req: FetchRequest) => {
      if (req.url != "test:") return getUrl(req);

      const r = request(app).post("/");
      if (req.hasBody()) {
        r.set("Content-Type", "application/json").send(
          ethers.toUtf8String(req.body)
        );
      }
      const response = await r;
      return {
        statusCode: response.statusCode,
        statusMessage: response.ok ? "OK" : response.statusCode.toString(),
        body: ethers.toUtf8Bytes(JSON.stringify(response.body)),
        headers: {
          "Content-Type": "application/json",
        },
      };
    });

    const Mimc = await ethers.getContractFactory("Mimc", signer);
    const mimc = await Mimc.deploy();

    const SparseMerkleProof = await ethers.getContractFactory(
      "SparseMerkleProof",
      { libraries: { Mimc: await mimc.getAddress() }, signer }
    );
    const sparseMerkleProof = await SparseMerkleProof.deploy();

    const LineaSparseProofVerifier = await ethers.getContractFactory(
      "LineaSparseProofVerifier",
      {
        libraries: {
          SparseMerkleProof: await sparseMerkleProof.getAddress(),
        },
        signer,
      }
    );

    const lineaSparseProofVerifier = await LineaSparseProofVerifier.deploy(
      ["test:"],
      await rollup.getAddress()
    );

    const TestL1 = await ethers.getContractFactory("TestL1", signer);
    target = await TestL1.deploy(
      await lineaSparseProofVerifier.getAddress(),
      l2TestContract
    );
    // Mine an empty block so we have something to prove against
    await l1Provider.send("evm_mine", []);
  });

  it("simple proofs for fixed values", async () => {
    const result = await target.getLatest({ enableCcipRead: true });
    expect(Number(result)).to.equal(42);
  });

  it("simple proofs for dynamic values", async () => {
    const result = await target.getName({ enableCcipRead: true });
    expect(result).to.equal("Satoshi");
  });

  it("nested proofs for dynamic values", async () => {
    const result = await target.getHighscorer(42, { enableCcipRead: true });
    expect(result).to.equal("Hal Finney");
  });

  it("nested proofs for long dynamic values", async () => {
    const result = await target.getHighscorer(1, { enableCcipRead: true });
    expect(result).to.equal(
      "Hubert Blaine Wolfeschlegelsteinhausenbergerdorff Sr."
    );
  });

  it("nested proofs with lookbehind", async () => {
    const result = await target.getLatestHighscore({ enableCcipRead: true });
    expect(Number(result)).to.equal(12345);
  });

  it("nested proofs with lookbehind for dynamic values", async () => {
    const result = await target.getLatestHighscorer({ enableCcipRead: true });
    expect(result).to.equal("Hal Finney");
  });

  it("mappings with variable-length keys", async () => {
    const result = await target.getNickname("Money Skeleton", {
      enableCcipRead: true,
    });
    expect(result).to.equal("Vitalik Buterin");
  });

  it("nested proofs of mappings with variable-length keys", async () => {
    const result = await target.getPrimaryNickname({ enableCcipRead: true });
    expect(result).to.equal("Hal Finney");
  });

  it("treats uninitialized storage elements as zeroes", async () => {
    const result = await target.getZero({ enableCcipRead: true });
    expect(Number(result)).to.equal(0);
  });

  it("treats uninitialized dynamic values as empty strings", async () => {
    const result = await target.getNickname("Santa", { enableCcipRead: true });
    expect(result).to.equal("");
  });
});
