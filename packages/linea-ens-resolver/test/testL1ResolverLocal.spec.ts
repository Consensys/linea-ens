import { makeL2Gateway } from "linea-ccip-gateway";
import { Server } from "@chainlink/ccip-read-server";
import { expect } from "chai";
import { Contract, JsonRpcProvider, ethers as ethersT } from "ethers";
import { FetchRequest } from "ethers";
import { ethers } from "hardhat";
import request from "supertest";
import packet from "dns-packet";
import { HardhatEthersProvider } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";
import { HardhatEthersHelpers } from "@nomicfoundation/hardhat-ethers/types";
import { EthereumProvider } from "hardhat/types";
import {
  changeBlockNumberInCCIPResponse,
  deployContract,
  execDockerCommand,
  fetchCCIPGateway,
  getAndIncreaseFeeData,
  getExtraData,
  sendTransactionsWithInterval,
  waitForL2BlockNumberFinalized,
  waitForLatestL2BlockNumberFinalizedToChange,
} from "./utils";
import { setTimeout } from "timers/promises";

const labelhash = (label) => ethers.keccak256(ethers.toUtf8Bytes(label));
const encodeName = (name) => "0x" + packet.name.encode(name).toString("hex");
const domainName = "linea-test";
const baseDomain = `${domainName}.eth`;
const node = ethers.namehash(baseDomain);
const encodedname = encodeName(baseDomain);
const contenthash =
  "0xe3010170122029f2d17be6139079dc48696d1f582a8530eb9805b561eda517e22a892c7e3f1f";
const testAddr = "0x76a91462e907b15cbf27d5425399ebf6f0fb50ebb88f1888ac";
const coinType = 0;

// Account 1 on L1 "FOR LOCAL DEV ONLY - DO NOT REUSE THESE KEYS ELSEWHERE"
const SIGNER_L1_PK =
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a";
// Account 1 on L2 "FOR LOCAL DEV ONLY - DO NOT REUSE THESE KEYS ELSEWHERE"
const SIGNER_L2_PK =
  "8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63";

const REGISTRANT_ADDR = "0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73";

const SUB_DOMAIN = "testpoh.linea-test.eth";
const subDomainNode = ethers.namehash(SUB_DOMAIN);
const encodedSubDomain = encodeName(SUB_DOMAIN);

const SUB_SUB_DOMAIN = "foo.testpoh.linea-test.eth";
const subSubNode = ethers.namehash(SUB_SUB_DOMAIN);
const encodedSubSubDomain = encodeName(SUB_SUB_DOMAIN);

const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
const EMPTY_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const ROLLUP_CONTRACT_ADDR = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

const L1_NODE_URL = "http://localhost:8445/";
const L1_CHAIN_ID = 31648428;
const L2_NODE_URL = "http://localhost:8845/";
const L2_CHAIN_ID = 1337;
const SHOMEI_NODE_URL = "http://localhost:8889/";

type ethersObj = typeof ethersT &
  Omit<HardhatEthersHelpers, "provider"> & {
    provider: Omit<HardhatEthersProvider, "_hardhatProvider"> & {
      _hardhatProvider: EthereumProvider;
    };
  };

declare module "hardhat/types/runtime" {
  //@ts-ignore
  const ethers: ethersObj;
  interface HardhatRuntimeEnvironment {
    ethers: ethersObj;
  }
}

/**
 * Requirements to run those test:
 * - In the zkevm-monorepo: Change the config aggregation-proofs-limit in config/coordinator/coordinator-docker.config.toml
 * to aggregation-proofs-limit=15
 * - Then run make fresh-start-all
 * - In the linea-ens monorepo: Run cd packages/linea-ens-resolver/
 * - Then run pnpm i
 * - pnpm test:local
 */
describe("Crosschain Resolver Local", () => {
  let l1Provider: JsonRpcProvider;
  let l2Provider: JsonRpcProvider;
  let verifier: Contract;
  let target: Contract;
  let l2Resolver: Contract;
  let wrapper: Contract;
  let baseRegistrar: Contract;
  let rollup: Contract;
  let l2factoryContract: Contract;
  let signerL1,
    signerL2,
    signerL1Address,
    signerL2Address,
    l2ResolverAddress,
    wrapperAddress;
  let lastSetupTxBlockNumber = BigInt(0);
  let sendTransactionsPromise: NodeJS.Timeout;

  before(async () => {
    // Setup providers and signers
    l1Provider = new ethers.JsonRpcProvider(L1_NODE_URL, L1_CHAIN_ID, {
      staticNetwork: true,
    });
    l2Provider = new ethers.JsonRpcProvider(L2_NODE_URL, L2_CHAIN_ID, {
      staticNetwork: true,
    });
    signerL1 = new ethers.Wallet(SIGNER_L1_PK, l1Provider);
    signerL1Address = await signerL1.getAddress();
    signerL2 = new ethers.Wallet(SIGNER_L2_PK, l2Provider);
    signerL2Address = await signerL2.getAddress();
    rollup = await ethers.getContractAt(
      "RollupMock",
      ROLLUP_CONTRACT_ADDR,
      signerL1
    );

    // Setup CCIP Gateway
    const shomeiNode = new ethers.JsonRpcProvider(
      SHOMEI_NODE_URL,
      L2_CHAIN_ID,
      {
        staticNetwork: true,
      }
    );
    const gateway = makeL2Gateway(
      l1Provider as unknown as JsonRpcProvider,
      l2Provider,
      await rollup.getAddress(),
      shomeiNode
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

    // Deploy and configure contracts
    const ens = await deployContract("ENSRegistry", signerL1);
    baseRegistrar = await deployContract(
      "BaseRegistrarImplementation",
      signerL1,
      await ens.getAddress(),
      ethers.namehash("eth")
    );
    const baseRegistrarAddress = await baseRegistrar.getAddress();
    await baseRegistrar.addController(signerL1Address).then((tx) => tx.wait());
    const metaDataservice = await deployContract(
      "StaticMetadataService",
      signerL1,
      ""
    );
    const reverseRegistrar = await deployContract(
      "ReverseRegistrar",
      signerL1,
      await ens.getAddress()
    );
    const reverseRegistrarAddress = await reverseRegistrar.getAddress();

    await ens
      .setSubnodeOwner(EMPTY_BYTES32, labelhash("reverse"), signerL1)
      .then((tx) => tx.wait());
    await ens
      .setSubnodeOwner(
        ethers.namehash("reverse"),
        labelhash("addr"),
        reverseRegistrarAddress
      )
      .then((tx) => tx.wait());
    await ens
      .setSubnodeOwner(EMPTY_BYTES32, labelhash("eth"), baseRegistrarAddress)
      .then((tx) => tx.wait());
    await baseRegistrar
      .register(labelhash(domainName), signerL1Address, 100000000)
      .then((tx) => tx.wait());

    const publicResolver = await deployContract(
      "PublicResolver",
      signerL1,
      await ens.getAddress(),
      EMPTY_ADDRESS,
      EMPTY_ADDRESS,
      await reverseRegistrar.getAddress()
    );
    const publicResolverAddress = await publicResolver.getAddress();
    await reverseRegistrar
      .setDefaultResolver(publicResolverAddress)
      .then((tx) => tx.wait());

    wrapper = await deployContract(
      "NameWrapper",
      signerL1,
      await ens.getAddress(),
      await baseRegistrar.getAddress(),
      await metaDataservice.getAddress()
    );
    wrapperAddress = await wrapper.getAddress();

    const mimc = await deployContract("Mimc", signerL1);
    const SparseMerkleProof = await ethers.getContractFactory(
      "SparseMerkleProof",
      { libraries: { Mimc: await mimc.getAddress() }, signer: signerL1 }
    );
    const sparseMerkleProof = await SparseMerkleProof.deploy();
    await sparseMerkleProof.waitForDeployment();
    const verifierFactory = await ethers.getContractFactory(
      "LineaSparseProofVerifier",
      {
        libraries: {
          SparseMerkleProof: await sparseMerkleProof.getAddress(),
        },
        signer: signerL1,
      }
    );
    verifier = await verifierFactory.deploy(
      ["test:"],
      await rollup.getAddress()
    );
    await verifier.waitForDeployment();

    const implContract = await deployContract("DelegatableResolver", signerL2);
    l2factoryContract = await deployContract(
      "DelegatableResolverFactory",
      signerL2,
      await implContract.getAddress()
    );
    await l2factoryContract
      .create(await signerL2.getAddress())
      .then((tx) => tx.wait());
    const logs = await l2factoryContract.queryFilter("NewDelegatableResolver");
    //@ts-ignore
    l2ResolverAddress = logs[0].args[0];

    target = await deployContract(
      "L1Resolver",
      signerL1,
      await verifier.getAddress(),
      await ens.getAddress(),
      wrapperAddress,
      "",
      L2_CHAIN_ID
    );

    const delegatableResolverImpl = await ethers.getContractFactory(
      "DelegatableResolver",
      signerL2
    );
    l2Resolver = delegatableResolverImpl.attach(l2ResolverAddress);
    await l2Resolver["setAddr(bytes32,address)"](
      subDomainNode,
      REGISTRANT_ADDR
    ).then((tx) => tx.wait());

    await l2Resolver["setAddr(bytes32,uint256,bytes)"](
      subDomainNode,
      coinType,
      testAddr
    ).then((tx) => tx.wait());

    await l2Resolver
      .setText(subDomainNode, "name", "test.eth")
      .then((tx) => tx.wait());

    await l2Resolver
      .setContenthash(subDomainNode, contenthash)
      .then((tx) => tx.wait());

    const tx = await l2Resolver["setAddr(bytes32,address)"](
      subSubNode,
      REGISTRANT_ADDR
    );
    const txReceipt = await tx.wait();
    // Kepp track of the last block tx's setup block number
    lastSetupTxBlockNumber = BigInt(txReceipt.blockNumber);

    // Generate activity on Linea to make finalization events happen
    const [maxPriorityFeePerGas, maxFeePerGas] = getAndIncreaseFeeData(
      await l2Provider.getFeeData()
    );
    sendTransactionsPromise = sendTransactionsWithInterval(
      signerL2,
      {
        to: signerL2Address,
        value: ethers.parseEther("0.0001"),
        maxPriorityFeePerGas,
        maxFeePerGas,
      },
      1_000
    );
  });

  it("should revert when querying L1Resolver and the currentL2BlockNumber is older than the L2 block number we are fetching the data from", async () => {
    await waitForL2BlockNumberFinalized(rollup, BigInt(1), 2000);
    await target
      .setTarget(encodedname, l2ResolverAddress)
      .then((tx) => tx.wait());
    const result = await l2Resolver["addr(bytes32)"](subDomainNode);
    expect(ethers.getAddress(result)).to.equal(REGISTRANT_ADDR);

    const i = new ethers.Interface(["function addr(bytes32) returns(address)"]);
    const calldata = i.encodeFunctionData("addr", [subDomainNode]);
    try {
      await target.resolve(encodedSubDomain, calldata, {
        enableCcipRead: true,
      });
      throw "Should have reverted";
    } catch (e) {
      expect(e.shortMessage).equal(
        `error encountered during CCIP fetch: "Internal server error: ccip-gateway error calling getStorageSlots"`
      );
    }
  });

  it("should not allow non owner to set target", async () => {
    const incorrectname = encodeName("notowned.eth");
    try {
      await target
        .setTarget(incorrectname, l2ResolverAddress)
        .then((tx) => tx.wait());
      throw "Should have reverted";
    } catch (e) {
      expect(e.reason).equal("Not authorized to set target for this node");
    }

    const result = await target.getTarget(incorrectname);
    expect(result[1]).to.equal(EMPTY_ADDRESS);
  });

  it("should allow owner to set target", async () => {
    await target
      .setTarget(encodedname, signerL1Address)
      .then((tx) => tx.wait());
    const result = await target.getTarget(encodeName(baseDomain));
    expect(result[1]).to.equal(signerL1Address);
  });

  it("subname should get target of its parent", async () => {
    await target
      .setTarget(encodedname, signerL1Address)
      .then((tx) => tx.wait());
    const result = await target.getTarget(encodedSubDomain);
    expect(result[0]).to.equal(subDomainNode);
    expect(result[1]).to.equal(signerL1Address);
  });

  it("should allow wrapped owner to set target", async () => {
    const label = "wrapped";
    const tokenId = labelhash(label);
    await baseRegistrar
      .setApprovalForAll(wrapperAddress, true)
      .then((tx) => tx.wait());
    await baseRegistrar
      .register(tokenId, signerL1Address, 100000000)
      .then((tx) => tx.wait());
    await wrapper
      .wrapETH2LD(
        label,
        signerL1Address,
        0, // CAN_DO_EVERYTHING
        EMPTY_ADDRESS
      )
      .then((tx) => tx.wait());
    const wrappedtname = encodeName(`${label}.eth`);
    await target
      .setTarget(wrappedtname, l2ResolverAddress)
      .then((tx) => tx.wait());
    const encodedname = encodeName(`${label}.eth`);
    const result = await target.getTarget(encodedname);
    expect(result[1]).to.equal(l2ResolverAddress);
  });

  it("should resolve empty ETH Address", async () => {
    // Wait for the latest L2 finalized block to more recent than the L2 block number we are fetching the data from
    await waitForL2BlockNumberFinalized(rollup, lastSetupTxBlockNumber, 5000);

    await target
      .setTarget(encodedname, l2ResolverAddress)
      .then((tx) => tx.wait());

    const i = new ethers.Interface(["function addr(bytes32) returns(address)"]);
    const calldata = i.encodeFunctionData("addr", [node]);
    const result = await target.resolve(encodedname, calldata, {
      enableCcipRead: true,
    });
    const decoded = i.decodeFunctionResult("addr", result);
    expect(decoded[0]).to.equal(EMPTY_ADDRESS);
  });

  it("should resolve ETH Address", async () => {
    const i = new ethers.Interface(["function addr(bytes32) returns(address)"]);
    const calldata = i.encodeFunctionData("addr", [subDomainNode]);
    const result = await target.resolve(encodedSubDomain, calldata, {
      enableCcipRead: true,
    });
    const decoded = i.decodeFunctionResult("addr", result);
    expect(ethers.getAddress(decoded[0])).to.equal(
      ethers.getAddress(REGISTRANT_ADDR)
    );
  });

  it("should resolve non ETH Address", async () => {
    const i = new ethers.Interface([
      "function addr(bytes32,uint256) returns(bytes)",
    ]);
    const calldata = i.encodeFunctionData("addr", [subDomainNode, coinType]);
    const result = await target.resolve(encodedSubDomain, calldata, {
      enableCcipRead: true,
    });
    const decoded = i.decodeFunctionResult("addr", result);
    expect(decoded[0]).to.equal(testAddr);
  });

  it("should resolve text record", async () => {
    const i = new ethers.Interface([
      "function text(bytes32,string) returns(string)",
    ]);
    const calldata = i.encodeFunctionData("text", [subDomainNode, "name"]);
    const result = await target.resolve(encodedSubDomain, calldata, {
      enableCcipRead: true,
    });
    const decoded = i.decodeFunctionResult("text", result);
    expect(decoded[0]).to.equal("test.eth");
  });

  it("should resolve ETH Address for sub sub domain", async () => {
    const i = new ethers.Interface(["function addr(bytes32) returns(address)"]);
    const calldata = i.encodeFunctionData("addr", [subSubNode]);

    const result = await target.resolve(encodedSubSubDomain, calldata, {
      enableCcipRead: true,
    });
    const decoded = i.decodeFunctionResult("addr", result);
    expect(decoded[0]).to.equal(REGISTRANT_ADDR);
  });

  it("should resolve contenthash", async () => {
    const i = new ethers.Interface([
      "function contenthash(bytes32) returns(bytes)",
    ]);
    const calldata = i.encodeFunctionData("contenthash", [subDomainNode]);
    const result = await target.resolve(encodedSubDomain, calldata, {
      enableCcipRead: true,
    });
    const decoded = i.decodeFunctionResult("contenthash", result);
    expect(decoded[0]).to.equal(contenthash);
  });

  it("should revert when the functions's selector is invalid", async () => {
    const i = new ethers.Interface([
      "function unknown(bytes32) returns(address)",
    ]);
    const calldata = i.encodeFunctionData("unknown", [node]);
    try {
      await target.resolve(encodedname, calldata, {
        enableCcipRead: true,
      });
      throw "Should have reverted";
    } catch (error) {
      expect(error.reason).to.equal("invalid selector");
    }
  });

  it("should revert if the calldata is too short", async () => {
    const i = new ethers.Interface(["function addr(bytes32) returns(address)"]);
    const calldata = "0x";
    try {
      await target.resolve(encodedname, calldata, {
        enableCcipRead: true,
      });
      throw "Should have reverted";
    } catch (error) {
      expect(error.reason).to.equal("param data too short");
    }
  });

  it("should not revert when querying L1Resolver right after a finalization has occured(based on latest L1 block)", async () => {
    await waitForLatestL2BlockNumberFinalizedToChange(rollup, 2000);

    const i = new ethers.Interface(["function addr(bytes32) returns(address)"]);
    const calldata = i.encodeFunctionData("addr", [subDomainNode]);
    const result = await target.resolve(encodedSubDomain, calldata, {
      enableCcipRead: true,
    });
    const decoded = i.decodeFunctionResult("addr", result);
    expect(ethers.getAddress(decoded[0])).to.equal(
      ethers.getAddress(REGISTRANT_ADDR)
    );
  });

  it("should not revert when querying L1Resolver right after a finalization has occured(based on lastest L1 finalized block)", async () => {
    await waitForLatestL2BlockNumberFinalizedToChange(
      rollup,
      2000,
      "finalized"
    );

    const i = new ethers.Interface(["function addr(bytes32) returns(address)"]);
    const calldata = i.encodeFunctionData("addr", [subDomainNode]);
    const result = await target.resolve(encodedSubDomain, calldata, {
      enableCcipRead: true,
    });
    const decoded = i.decodeFunctionResult("addr", result);
    expect(ethers.getAddress(decoded[0])).to.equal(
      ethers.getAddress(REGISTRANT_ADDR)
    );
  });

  it("should revert when block sent by the gateway > currentL2BlockNumber", async () => {
    const i = new ethers.Interface(["function addr(bytes32) returns(address)"]);
    const calldata = i.encodeFunctionData("addr", [subDomainNode]);
    try {
      await target.resolve(encodedSubDomain, calldata);
    } catch (e) {
      const extraData: string = getExtraData(e);
      const resultData: string = await fetchCCIPGateway(e);

      const currentL2BlockNumberFinalized = await rollup.currentL2BlockNumber({
        blockTag: "finalized",
      });
      const wrongL2BlockNumber = currentL2BlockNumberFinalized + BigInt(10);

      const resultDataModified = changeBlockNumberInCCIPResponse(
        resultData,
        wrongL2BlockNumber
      );

      try {
        await target.getStorageSlotsCallback(resultDataModified, extraData);
        throw "Should have reverted";
      } catch (error) {
        expect(error.reason).to.equal(
          "LineaSparseProofVerifier: invalid state root"
        );
      }
    }
  });

  it("should revert when block number has been altered and does not match the state root hash used by the gateway", async () => {
    const previousL2BlockNumber = await rollup.currentL2BlockNumber({
      blockTag: "finalized",
    });
    await waitForLatestL2BlockNumberFinalizedToChange(
      rollup,
      2000,
      "finalized"
    );
    const currentL2BlockNumber = await rollup.currentL2BlockNumber({
      blockTag: "finalized",
    });

    expect(currentL2BlockNumber).to.be.greaterThan(previousL2BlockNumber);

    const i = new ethers.Interface(["function addr(bytes32) returns(address)"]);
    const calldata = i.encodeFunctionData("addr", [subDomainNode]);
    try {
      await target.resolve(encodedSubDomain, calldata);
    } catch (e) {
      const extraData: string = getExtraData(e);
      const resultData: string = await fetchCCIPGateway(e);
      // Construct the new data string
      const resultDataModified = changeBlockNumberInCCIPResponse(
        resultData,
        previousL2BlockNumber
      );

      try {
        await target.getStorageSlotsCallback(resultDataModified, extraData);
        throw "Should have reverted";
      } catch (error) {
        expect(error.reason).to.equal(
          "LineaProofHelper: invalid account proof"
        );
      }
    }
  });

  it("should revert if shomei-frontend is down and ccip-gateway should keep responding after shomei-frontend starts back up", async () => {
    await execDockerCommand("stop", "shomei-frontend");

    const i = new ethers.Interface(["function addr(bytes32) returns(address)"]);
    const calldata = i.encodeFunctionData("addr", [subDomainNode]);

    try {
      await target.resolve(encodedSubDomain, calldata, {
        enableCcipRead: true,
      });
      throw "Should have reverted";
    } catch (error) {
      expect(error.shortMessage).to.equal(
        `error encountered during CCIP fetch: "Internal server error: ccip-gateway error calling getStorageSlots"`
      );
    }

    await execDockerCommand("start", "shomei-frontend");
    await setTimeout(5_000);

    try {
      await target.resolve(encodedSubDomain, calldata, {
        enableCcipRead: true,
      });
      throw "Should have reverted";
    } catch (error) {
      expect(error.shortMessage).to.equal(
        `error encountered during CCIP fetch: "Internal server error: ccip-gateway error calling getStorageSlots"`
      );
    }
  });

  it("should revert if l2 node is down and ccip-gateway should keep responding after l2-node starts back up", async () => {
    await execDockerCommand("stop", "l2-node");

    const i = new ethers.Interface(["function addr(bytes32) returns(address)"]);
    const calldata = i.encodeFunctionData("addr", [subDomainNode]);

    try {
      await target.resolve(encodedSubDomain, calldata, {
        enableCcipRead: true,
      });
      throw "Should have reverted";
    } catch (error) {
      expect(error.shortMessage).to.equal(
        `error encountered during CCIP fetch: "Internal server error: ccip-gateway error calling getStorageSlots"`
      );
    }

    await execDockerCommand("start", "l2-node");
    await setTimeout(5_000);

    try {
      await target.resolve(encodedSubDomain, calldata, {
        enableCcipRead: true,
      });
      throw "Should have reverted";
    } catch (error) {
      expect(error.shortMessage).to.equal(
        `error encountered during CCIP fetch: "Internal server error: ccip-gateway error calling getStorageSlots"`
      );
    }
  });

  after(async () => {
    clearInterval(sendTransactionsPromise);
  });
});
