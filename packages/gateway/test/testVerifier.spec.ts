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

const localGatewayUrl = "http://localhost:8081";

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
  let provider: BrowserProvider;
  let l2Provider: JsonRpcProvider;
  let l2ResolverContract: string;
  let l1RollupContract: string;
  let signer: Signer;
  let verifier: Contract;
  let target: Contract;

  before(async () => {
    if (!process.env.L1_PROVIDER_URL) {
      throw "No L1_PROVIDER_URL found in env file";
    }
    if (!process.env.L2_PROVIDER_URL) {
      throw "No L2_PROVIDER_URL found in env file";
    }
    if (!process.env.L2_RESOLVER_ADDRESS) {
      throw "No L2_RESOLVER_ADDRESS found in env file";
    }
    if (!process.env.L1_ROLLUP_ADDRESS) {
      throw "No L1_ROLLUP_ADDRESS found in env file";
    }
    // Hack to get a 'real' ethers provider from hardhat. The default `HardhatProvider`
    // doesn't support CCIP-read.
    // @ts-ignore
    provider = new ethers.JsonRpcProvider(process.env.L1_PROVIDER_URL);
    l2Provider = new ethers.JsonRpcProvider(process.env.L2_PROVIDER_URL);
    l2ResolverContract = process.env.L2_RESOLVER_ADDRESS;
    l1RollupContract = process.env.L1_ROLLUP_ADDRESS;
    // provider.on("debug", (x: any) => console.log(JSON.stringify(x, undefined, 2)));
    signer = await provider.getSigner(0);
    const gateway = makeL2Gateway(
      (provider as unknown) as JsonRpcProvider,
      l2Provider,
      l2ResolverContract
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

    const l1VerifierFactory = await ethers.getContractFactory("LineaVerifier", {
      libraries: {
        SparseMerkleProof: await sparseMerkleProof.getAddress(),
      },
      signer,
    });

    // verifier = await l1VerifierFactory.deploy(["test:"], l1RollupContract);
    verifier = await l1VerifierFactory.deploy(
      [localGatewayUrl],
      l1RollupContract
    );

    const testL1Factory = await ethers.getContractFactory("TestL1", signer);
    target = await testL1Factory.deploy(
      await verifier.getAddress(),
      l2ResolverContract
    );
    // Mine an empty block so we have something to prove against
    await provider.send("evm_mine", []);
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
    try {
      await target.getZero({ enableCcipRead: true });
    } catch (ex) {
      expect(ex.shortMessage).to.equal(
        'error encountered during CCIP fetch: "Internal server error: Storage not initialized"'
      );
    }
  });

  it("treats uninitialized dynamic values as empty strings", async () => {
    try {
      await target.getNickname("Santa", { enableCcipRead: true });
    } catch (ex) {
      expect(ex.shortMessage).to.equal(
        'error encountered during CCIP fetch: "Internal server error: Storage not initialized"'
      );
    }
  });

  it("will index on uninitialized values", async () => {
    try {
      await target.getZeroIndex({ enableCcipRead: true });
    } catch (ex) {
      expect(ex.shortMessage).to.equal(
        'error encountered during CCIP fetch: "Internal server error: Storage not initialized"'
      );
    }
  });
});
