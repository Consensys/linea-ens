import { makeL2Gateway } from "linea-ccip-gateway";
import { Server } from "@chainlink/ccip-read-server";
import { expect } from "chai";
import { AbiCoder, Contract, JsonRpcProvider, ethers as ethersT } from "ethers";
import { FetchRequest } from "ethers";
import { ethers } from "hardhat";
import request from "supertest";
import packet from "dns-packet";
import {
  blockNo,
  commands2Test,
  constantsTest,
  proofTest,
  extraDataTest,
  stateRoot,
  wrongExtraData,
  extraDataWithLongCallBackData,
  extraDataWithShortCallBackData,
  retValueTest,
  retValueLongTest,
} from "./testData";
import { HardhatEthersProvider } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";
import { HardhatEthersHelpers } from "@nomicfoundation/hardhat-ethers/types";
import { EthereumProvider } from "hardhat/types";

const labelhash = (label) => ethers.keccak256(ethers.toUtf8Bytes(label));
const encodeName = (name) => "0x" + packet.name.encode(name).toString("hex");
const domainName = "linea-test";
const baseDomain = `${domainName}.eth`;
const node = ethers.namehash(baseDomain);
const encodedname = encodeName(baseDomain);

// Account 1 on L1 "FOR LOCAL DEV ONLY - DO NOT REUSE THESE KEYS ELSEWHERE"
const SIGNER_L1_PK =
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a";
// Account 1 on L1 "FOR LOCAL DEV ONLY - DO NOT REUSE THESE KEYS ELSEWHERE"
const SIGNER_L2_PK =
  "8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63";

const REGISTRANT_ADDR = "0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73";

const SUB_DOMAIN = "testpoh.linea-test.eth";
const subDomainNode = ethers.namehash(SUB_DOMAIN);
const encodedSubDomain = encodeName(SUB_DOMAIN);

const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
const EMPTY_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const PROOF_ENCODING_PADDING =
  "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000044e0";

const ACCEPTED_L2_BLOCK_RANGE_LENGTH = 86400;

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

describe("Crosschain Resolver", () => {
  let l1Provider: JsonRpcProvider;
  let l2Provider: JsonRpcProvider;
  let verifier: Contract;
  let target: Contract;
  let l2Resolver: Contract;
  let ens: Contract;
  let wrapper: Contract;
  let baseRegistrar: Contract;
  let rollup: Contract;
  let signerL1,
    signerL2,
    signerL1Address,
    signerL2Address,
    l2ResolverAddress,
    wrapperAddress;

  before(async () => {
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

    const shomeiNode = new ethers.JsonRpcProvider(
      SHOMEI_NODE_URL,
      L1_CHAIN_ID,
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

    const ensFactory = await ethers.getContractFactory("ENSRegistry", signerL1);
    ens = await ensFactory.deploy();
    await ens.waitForDeployment();

    const ensAddress = await ens.getAddress();
    const baseRegistrarFactory = await ethers.getContractFactory(
      "BaseRegistrarImplementation",
      signerL1
    );
    baseRegistrar = await baseRegistrarFactory.deploy(
      ensAddress,
      ethers.namehash("eth")
    );
    await baseRegistrar.waitForDeployment();

    const baseRegistrarAddress = await baseRegistrar.getAddress();
    let tx = await baseRegistrar.addController(signerL1Address);
    await tx.wait();

    const metaDataserviceFactory = await ethers.getContractFactory(
      "StaticMetadataService",
      signerL1
    );
    const metaDataservice = await metaDataserviceFactory.deploy(
      "https://ens.domains"
    );
    await metaDataservice.waitForDeployment();

    const metaDataserviceAddress = await metaDataservice.getAddress();
    const reverseRegistrarFactory = await ethers.getContractFactory(
      "ReverseRegistrar",
      signerL1
    );
    const reverseRegistrar = await reverseRegistrarFactory.deploy(ensAddress);
    await reverseRegistrar.waitForDeployment();

    const reverseRegistrarAddress = await reverseRegistrar.getAddress();
    tx = await ens.setSubnodeOwner(
      EMPTY_BYTES32,
      labelhash("reverse"),
      signerL1
    );
    await tx.wait();

    tx = await ens.setSubnodeOwner(
      ethers.namehash("reverse"),
      labelhash("addr"),
      reverseRegistrarAddress
    );
    await tx.wait();

    tx = await ens.setSubnodeOwner(
      EMPTY_BYTES32,
      labelhash("eth"),
      baseRegistrarAddress
    );
    await tx.wait();

    tx = await baseRegistrar.register(
      labelhash(domainName),
      signerL1Address,
      100000000
    );
    await tx.wait();

    const publicResolverFactory = await ethers.getContractFactory(
      "PublicResolver",
      signerL1
    );
    const publicResolver = await publicResolverFactory.deploy(
      ensAddress,
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      reverseRegistrarAddress
    );
    await publicResolver.waitForDeployment();

    const publicResolverAddress = await publicResolver.getAddress();
    tx = await reverseRegistrar.setDefaultResolver(publicResolverAddress);
    await tx.wait();

    const wrapperFactory = await ethers.getContractFactory(
      "NameWrapper",
      signerL1
    );
    wrapper = await wrapperFactory.deploy(
      ensAddress,
      baseRegistrarAddress,
      metaDataserviceAddress
    );
    await wrapper.waitForDeployment();

    wrapperAddress = await wrapper.getAddress();

    const Mimc = await ethers.getContractFactory("Mimc", signerL1);
    const mimc = await Mimc.deploy();
    await mimc.waitForDeployment();

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

    const impl = await ethers.getContractFactory(
      "DelegatableResolver",
      signerL2
    );
    const implContract = await impl.deploy();
    await implContract.waitForDeployment();

    const testL2Factory = await ethers.getContractFactory(
      "DelegatableResolverFactory",
      signerL2
    );
    const l2factoryContract = await testL2Factory.deploy(
      await implContract.getAddress()
    );
    await l2factoryContract.waitForDeployment();

    tx = await l2factoryContract.create(await signerL2.getAddress());
    await tx.wait();

    const logs = await l2factoryContract.queryFilter("NewDelegatableResolver");
    //@ts-ignore
    const [resolver] = logs[0].args;
    l2ResolverAddress = resolver;

    const l1ResolverFactory = await ethers.getContractFactory(
      "L1Resolver",
      signerL1
    );
    const verifierAddress = await verifier.getAddress();
    target = await l1ResolverFactory.deploy(
      verifierAddress,
      ensAddress,
      wrapperAddress,
      "https://api.studio.thegraph.com/query/69290/ens-linea-sepolia/version/latest",
      59141
    );
    await target.waitForDeployment();

    l2Resolver = impl.attach(l2ResolverAddress);
    tx = await l2Resolver["setAddr(bytes32,address)"](
      subDomainNode,
      REGISTRANT_ADDR
    );
    await tx.wait();
  });

  it("should not allow non owner to set target", async () => {
    const incorrectname = encodeName("notowned.eth");
    try {
      const tx = await target.setTarget(incorrectname, l2ResolverAddress);
      await tx.wait();
      throw "Should have reverted";
    } catch (e) {
      expect(e.reason).equal("Not authorized to set target for this node");
    }

    const result = await target.getTarget(incorrectname);
    expect(result[1]).to.equal(EMPTY_ADDRESS);
  });

  it("should allow owner to set target", async () => {
    const tx = await target.setTarget(encodedname, signerL1Address);
    await tx.wait();
    const result = await target.getTarget(encodeName(baseDomain));
    expect(result[1]).to.equal(signerL1Address);
  });

  it("subname should get target of its parent", async () => {
    const tx = await target.setTarget(encodedname, signerL1Address);
    await tx.wait();
    const result = await target.getTarget(encodedSubDomain);
    expect(result[0]).to.equal(subDomainNode);
    expect(result[1]).to.equal(signerL1Address);
  });

  it("should allow wrapped owner to set target", async () => {
    const label = "wrapped";
    const tokenId = labelhash(label);
    let tx = await baseRegistrar.setApprovalForAll(wrapperAddress, true);
    await tx.wait();
    tx = await baseRegistrar.register(tokenId, signerL1Address, 100000000);
    await tx.wait();
    tx = await wrapper.wrapETH2LD(
      label,
      signerL1Address,
      0, // CAN_DO_EVERYTHING
      EMPTY_ADDRESS
    );
    await tx.wait();
    const wrappedtname = encodeName(`${label}.eth`);
    tx = await target.setTarget(wrappedtname, l2ResolverAddress);
    await tx.wait();
    const encodedname = encodeName(`${label}.eth`);
    const result = await target.getTarget(encodedname);
    expect(result[1]).to.equal(l2ResolverAddress);
  });

  it("should resolve empty ETH Address", async () => {
    let tx = await target.setTarget(encodedname, l2ResolverAddress);
    await tx.wait();
    const addr = "0x0000000000000000000000000000000000000000";
    const result = await l2Resolver["addr(bytes32)"](node);
    expect(result).to.equal(addr);

    const i = new ethers.Interface(["function addr(bytes32) returns(address)"]);
    const calldata = i.encodeFunctionData("addr", [node]);
    const result2 = await target.resolve(encodedname, calldata, {
      enableCcipRead: true,
    });
    const decoded = i.decodeFunctionResult("addr", result2);
    expect(decoded[0]).to.equal(addr);
  });

  it("should resolve ETH Address", async () => {
    await target.setTarget(encodedname, l2ResolverAddress);
    const result = await l2Resolver["addr(bytes32)"](subDomainNode);
    expect(ethers.getAddress(result)).to.equal(REGISTRANT_ADDR);
    await l1Provider.send("evm_mine", []);

    const i = new ethers.Interface(["function addr(bytes32) returns(address)"]);
    const calldata = i.encodeFunctionData("addr", [subDomainNode]);
    const result2 = await target.resolve(encodedSubDomain, calldata, {
      enableCcipRead: true,
    });
    const decoded = i.decodeFunctionResult("addr", result2);
    expect(ethers.getAddress(decoded[0])).to.equal(
      ethers.getAddress(REGISTRANT_ADDR)
    );
  });

  it("should resolve non ETH Address", async () => {
    await target.setTarget(encodedname, l2ResolverAddress);
    const addr = "0x76a91462e907b15cbf27d5425399ebf6f0fb50ebb88f1888ac";
    const coinType = 0; // BTC
    await l1Provider.send("evm_mine", []);
    const i = new ethers.Interface([
      "function addr(bytes32,uint256) returns(bytes)",
    ]);
    const calldata = i.encodeFunctionData("addr", [subDomainNode, coinType]);
    const result2 = await target.resolve(encodedSubDomain, calldata, {
      enableCcipRead: true,
    });
    const decoded = i.decodeFunctionResult("addr", result2);
    expect(decoded[0]).to.equal(addr);
  });

  it("should resolve text record", async () => {
    await target.setTarget(encodedname, l2ResolverAddress);
    const key = "name";
    const value = "test.eth";
    await l1Provider.send("evm_mine", []);

    const i = new ethers.Interface([
      "function text(bytes32,string) returns(string)",
    ]);
    const calldata = i.encodeFunctionData("text", [subDomainNode, key]);
    const result2 = await target.resolve(encodedSubDomain, calldata, {
      enableCcipRead: true,
    });
    const decoded = i.decodeFunctionResult("text", result2);
    expect(decoded[0]).to.equal(value);
  });

  it("should resolve contenthash", async () => {
    await target.setTarget(encodedname, l2ResolverAddress);
    const contenthash =
      "0xe3010170122029f2d17be6139079dc48696d1f582a8530eb9805b561eda517e22a892c7e3f1f";
    await l1Provider.send("evm_mine", []);

    const i = new ethers.Interface([
      "function contenthash(bytes32) returns(bytes)",
    ]);
    const calldata = i.encodeFunctionData("contenthash", [subDomainNode]);
    const result2 = await target.resolve(encodedSubDomain, calldata, {
      enableCcipRead: true,
    });
    const decoded = i.decodeFunctionResult("contenthash", result2);
    expect(decoded[0]).to.equal(contenthash);
  });

  it("should revert when the functions's selector is invalid", async () => {
    await target.setTarget(encodedname, l2ResolverAddress);
    const addr = "0x0000000000000000000000000000000000000000";
    const result = await l2Resolver["addr(bytes32)"](node);
    expect(result).to.equal(addr);
    await l1Provider.send("evm_mine", []);
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
    await target.setTarget(encodedname, l2ResolverAddress);
    const addr = "0x0000000000000000000000000000000000000000";
    const result = await l2Resolver["addr(bytes32)"](node);
    expect(result).to.equal(addr);
    await l1Provider.send("evm_mine", []);
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

  it("should revert if the number of commands is bigger than the number of storage proofs returned by the gateway", async () => {
    await rollup.setCurrentStateRoot(blockNo, stateRoot);
    let proofsEncoded = AbiCoder.defaultAbiCoder().encode(
      [
        "uint256",
        "tuple(bytes key, uint256 leafIndex, tuple(bytes value, bytes[] proofRelatedNodes) proof)",
        "tuple(bytes32 key, uint256 leafIndex, tuple(bytes32 value, bytes[] proofRelatedNodes) proof, bool initialized)[]",
      ],
      [blockNo, proofTest.accountProof, proofTest.storageProofs]
    );
    try {
      await verifier.getStorageValues(
        l2ResolverAddress,
        commands2Test,
        constantsTest,
        proofsEncoded,
        ACCEPTED_L2_BLOCK_RANGE_LENGTH
      );
      throw "Should have reverted";
    } catch (error) {
      expect(error.reason).to.equal(
        "LineaProofHelper: commands number > storage proofs number"
      );
    }
  });

  it("should not revert if the block number returned by the gateway is in the accepted block range", async () => {
    await rollup.setCurrentStateRoot(blockNo, stateRoot);
    await rollup.setCurrentStateRoot(
      blockNo + ACCEPTED_L2_BLOCK_RANGE_LENGTH - 10,
      stateRoot
    );
    let proofsEncoded = AbiCoder.defaultAbiCoder().encode(
      [
        "uint256",
        "tuple(bytes key, uint256 leafIndex, tuple(bytes value, bytes[] proofRelatedNodes) proof)",
        "tuple(bytes32 key, uint256 leafIndex, tuple(bytes32 value, bytes[] proofRelatedNodes) proof, bool initialized)[]",
      ],
      [blockNo, proofTest.accountProof, proofTest.storageProofs]
    );
    proofsEncoded = PROOF_ENCODING_PADDING + proofsEncoded.substring(2);

    const result = await target.getStorageSlotsCallback(
      proofsEncoded,
      extraDataTest
    );
    expect(result.data.endsWith(retValueTest)).to.be.true;
  });

  it("should revert if the block number returned by the gateway is not in the accepted block range", async () => {
    await rollup.setCurrentStateRoot(blockNo, stateRoot);
    await rollup.setCurrentStateRoot(
      blockNo + ACCEPTED_L2_BLOCK_RANGE_LENGTH + 10,
      stateRoot
    );
    let proofsEncoded = AbiCoder.defaultAbiCoder().encode(
      [
        "uint256",
        "tuple(bytes key, uint256 leafIndex, tuple(bytes value, bytes[] proofRelatedNodes) proof)",
        "tuple(bytes32 key, uint256 leafIndex, tuple(bytes32 value, bytes[] proofRelatedNodes) proof, bool initialized)[]",
      ],
      [blockNo, proofTest.accountProof, proofTest.storageProofs]
    );
    proofsEncoded = PROOF_ENCODING_PADDING + proofsEncoded.substring(2);
    try {
      await target.getStorageSlotsCallback(proofsEncoded, extraDataTest);
      throw "Should have reverted";
    } catch (error) {
      expect(error.reason).to.equal(
        "LineaSparseProofVerifier: block not in range accepted"
      );
    }
  });

  it("should not revert when callbackdata > 32 bytes", async () => {
    await rollup.setCurrentStateRoot(blockNo, stateRoot);
    await rollup.setCurrentStateRoot(
      blockNo + ACCEPTED_L2_BLOCK_RANGE_LENGTH - 10,
      stateRoot
    );
    let proofsEncoded = AbiCoder.defaultAbiCoder().encode(
      [
        "uint256",
        "tuple(bytes key, uint256 leafIndex, tuple(bytes value, bytes[] proofRelatedNodes) proof)",
        "tuple(bytes32 key, uint256 leafIndex, tuple(bytes32 value, bytes[] proofRelatedNodes) proof, bool initialized)[]",
      ],
      [blockNo, proofTest.accountProof, proofTest.storageProofs]
    );
    proofsEncoded = PROOF_ENCODING_PADDING + proofsEncoded.substring(2);

    const result = await target.getStorageSlotsCallback(
      proofsEncoded,
      extraDataWithLongCallBackData
    );

    expect(result.data.endsWith(retValueLongTest)).to.be.true;
  });

  it("should revert when callbackdata < 32 bytes", async () => {
    await rollup.setCurrentStateRoot(blockNo, stateRoot);
    await rollup.setCurrentStateRoot(
      blockNo + ACCEPTED_L2_BLOCK_RANGE_LENGTH - 10,
      stateRoot
    );
    let proofsEncoded = AbiCoder.defaultAbiCoder().encode(
      [
        "uint256",
        "tuple(bytes key, uint256 leafIndex, tuple(bytes value, bytes[] proofRelatedNodes) proof)",
        "tuple(bytes32 key, uint256 leafIndex, tuple(bytes32 value, bytes[] proofRelatedNodes) proof, bool initialized)[]",
      ],
      [blockNo, proofTest.accountProof, proofTest.storageProofs]
    );
    proofsEncoded = PROOF_ENCODING_PADDING + proofsEncoded.substring(2);

    try {
      await target.getStorageSlotsCallback(
        proofsEncoded,
        extraDataWithShortCallBackData
      );
      throw "Should have reverted";
    } catch (error) {
      expect(error.reason).to.equal("require(false)");
    }
  });

  it("should not revert when block sent by the gateway <= currentL2BlockNumber and currentL2BlockNumber <= ACCEPTED_BLOCK_RANGE_LENGTH", async () => {
    const veryOldBlockNb = 1;
    await rollup.setCurrentStateRoot(veryOldBlockNb, stateRoot);
    await rollup.setCurrentStateRoot(ACCEPTED_L2_BLOCK_RANGE_LENGTH, stateRoot);
    let proofsEncoded = AbiCoder.defaultAbiCoder().encode(
      [
        "uint256",
        "tuple(bytes key, uint256 leafIndex, tuple(bytes value, bytes[] proofRelatedNodes) proof)",
        "tuple(bytes32 key, uint256 leafIndex, tuple(bytes32 value, bytes[] proofRelatedNodes) proof, bool initialized)[]",
      ],
      [veryOldBlockNb, proofTest.accountProof, proofTest.storageProofs]
    );
    proofsEncoded = PROOF_ENCODING_PADDING + proofsEncoded.substring(2);

    const result = await target.getStorageSlotsCallback(
      proofsEncoded,
      extraDataTest
    );

    expect(result.data.endsWith(retValueTest)).to.be.true;
  });

  it("should revert when block sent by the gateway > currentL2BlockNumber and currentL2BlockNumber <= ACCEPTED_BLOCK_RANGE_LENGTH", async () => {
    const veryOldBlockNb = ACCEPTED_L2_BLOCK_RANGE_LENGTH + 1;
    await rollup.setCurrentStateRoot(veryOldBlockNb, stateRoot);
    await rollup.setCurrentStateRoot(ACCEPTED_L2_BLOCK_RANGE_LENGTH, stateRoot);
    let proofsEncoded = AbiCoder.defaultAbiCoder().encode(
      [
        "uint256",
        "tuple(bytes key, uint256 leafIndex, tuple(bytes value, bytes[] proofRelatedNodes) proof)",
        "tuple(bytes32 key, uint256 leafIndex, tuple(bytes32 value, bytes[] proofRelatedNodes) proof, bool initialized)[]",
      ],
      [
        veryOldBlockNb + ACCEPTED_L2_BLOCK_RANGE_LENGTH,
        proofTest.accountProof,
        proofTest.storageProofs,
      ]
    );
    proofsEncoded = PROOF_ENCODING_PADDING + proofsEncoded.substring(2);

    try {
      await target.getStorageSlotsCallback(proofsEncoded, extraDataTest);
      throw "Should have reverted";
    } catch (error) {
      expect(error.reason).to.equal(
        "LineaSparseProofVerifier: invalid state root"
      );
    }
  });

  it("should revert if the proof's target is not matching the one queried", async () => {
    // Set the block number and stateRoot to match the predefined proof in the proof test file
    await rollup.setCurrentStateRoot(blockNo, stateRoot);
    let proofsEncoded = AbiCoder.defaultAbiCoder().encode(
      [
        "uint256",
        "tuple(bytes key, uint256 leafIndex, tuple(bytes value, bytes[] proofRelatedNodes) proof)",
        "tuple(bytes32 key, uint256 leafIndex, tuple(bytes32 value, bytes[] proofRelatedNodes) proof, bool initialized)[]",
      ],
      [blockNo, proofTest.accountProof, proofTest.storageProofs]
    );
    proofsEncoded = PROOF_ENCODING_PADDING + proofsEncoded.substring(2);
    try {
      await target.getStorageSlotsCallback(proofsEncoded, wrongExtraData);
      throw "Should have reverted";
    } catch (error) {
      expect(error.reason).to.equal("LineaProofHelper: wrong target");
    }
  });
});
