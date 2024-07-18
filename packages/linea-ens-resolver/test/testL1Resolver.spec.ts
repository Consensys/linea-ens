import { makeL2Gateway } from "linea-ccip-gateway";
import { Server } from "@chainlink/ccip-read-server";
import { HardhatEthersProvider } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";
import { HardhatEthersHelpers } from "@nomicfoundation/hardhat-ethers/types";
import { expect } from "chai";
import {
  AbiCoder,
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  Signer,
  ethers as ethersT,
} from "ethers";
import { FetchRequest } from "ethers";
import { ethers } from "hardhat";
import { EthereumProvider } from "hardhat/types";
import request from "supertest";
import packet from "dns-packet";
import {
  blockNo,
  commands2Test,
  commandsTest,
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
const labelhash = (label) => ethers.keccak256(ethers.toUtf8Bytes(label));
const encodeName = (name) => "0x" + packet.name.encode(name).toString("hex");
const domainName = "linea-test";
const baseDomain = `${domainName}.eth`;
const node = ethers.namehash(baseDomain);
const encodedname = encodeName(baseDomain);

const registrantAddr = "0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73";
const subDomain = "testpoh.linea-test.eth";
const subDomainNode = ethers.namehash(subDomain);
const encodedSubDomain = encodeName(subDomain);

const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
const EMPTY_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const PROOF_ENCODING_PADDING =
  "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000044e0";

const ACCEPTED_L2_BLOCK_RANGE_LENGTH = 86400;

type ethersObj = typeof ethersT &
  Omit<HardhatEthersHelpers, "provider"> & {
    provider: Omit<HardhatEthersProvider, "_hardhatProvider"> & {
      _hardhatProvider: EthereumProvider;
    };
  };

declare module "hardhat/types/runtime" {
  const ethers: ethersObj;
  interface HardhatRuntimeEnvironment {
    ethers: ethersObj;
  }
}

describe("Crosschain Resolver", () => {
  let l1Provider: JsonRpcProvider;
  let l2Provider: JsonRpcProvider;
  let l1SepoliaProvider: JsonRpcProvider;
  let signer: Signer;
  let verifier: Contract;
  let target: Contract;
  let l2contract: Contract;
  let ens: Contract;
  let wrapper: Contract;
  let baseRegistrar: Contract;
  let rollup: Contract;
  let signerAddress, signerL2, signerL2Address, resolverAddress, wrapperAddress;

  before(async () => {
    // Hack to get a 'real' ethers provider from hardhat. The default `HardhatProvider`
    // doesn't support CCIP-read.
    l1Provider = new ethers.JsonRpcProvider(
      "http://localhost:8445/",
      31648428,
      {
        staticNetwork: true,
      }
    );
    // Those test work only with a specific contract deployed on linea sepolia
    l2Provider = new ethers.JsonRpcProvider("http://localhost:8845/", 1337, {
      staticNetwork: true,
    });
    // We need this provider to get the latest L2BlockNumber along with the the linea state root hash
    l1SepoliaProvider = new ethers.JsonRpcProvider(
      "http://localhost:8445/",
      31648428,
      {
        staticNetwork: true,
      }
    );
    signer = new ethers.Wallet(
      "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
      l1Provider
    );
    signerAddress = await signer.getAddress();

    signerL2 = new ethers.Wallet(
      "8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63",
      l2Provider
    );
    signerL2Address = await signerL2.getAddress();

    console.log(signerL2Address);

    const Rollup = await ethers.getContractFactory("RollupMock", signer);

    // We query the latest block number and state root hash on the actual L1 sepolia chain
    // because otherwise if we hard code a block number and state root hash the test is no longer
    // working after a while as linea_getProof stops working for older blocks
    const rollupSepolia = new ethers.Contract(
      "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
      Rollup.interface,
      l1Provider
    );
    const currentL2BlockNumber = await rollupSepolia.currentL2BlockNumber();
    const stateRootHash =
      await rollupSepolia.stateRootHashes(currentL2BlockNumber);
    rollup = await Rollup.deploy(currentL2BlockNumber, stateRootHash);
    await rollup.waitForDeployment();

    const shomeiFrontend = new ethers.JsonRpcProvider(
      "http://localhost:8889/",
      31648428,
      {
        staticNetwork: true,
      }
    );
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

    const ensFactory = await ethers.getContractFactory("ENSRegistry", signer);
    ens = await ensFactory.deploy();
    await ens.waitForDeployment();

    const ensAddress = await ens.getAddress();
    const baseRegistrarFactory = await ethers.getContractFactory(
      "BaseRegistrarImplementation",
      signer
    );
    baseRegistrar = await baseRegistrarFactory.deploy(
      ensAddress,
      ethers.namehash("eth")
    );
    await baseRegistrar.waitForDeployment();
    const baseRegistrarAddress = await baseRegistrar.getAddress();
    let tx = await baseRegistrar.addController(signer);
    await tx.wait();
    const metaDataserviceFactory = await ethers.getContractFactory(
      "StaticMetadataService",
      signer
    );
    const metaDataservice = await metaDataserviceFactory.deploy(
      "https://ens.domains"
    );
    await metaDataservice.waitForDeployment();
    const metaDataserviceAddress = await metaDataservice.getAddress();
    const reverseRegistrarFactory = await ethers.getContractFactory(
      "ReverseRegistrar",
      signer
    );
    const reverseRegistrar = await reverseRegistrarFactory.deploy(ensAddress);
    await reverseRegistrar.waitForDeployment();
    const reverseRegistrarAddress = await reverseRegistrar.getAddress();
    tx = await ens.setSubnodeOwner(EMPTY_BYTES32, labelhash("reverse"), signer);
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
      signerAddress,
      100000000
    );
    await tx.wait();
    const publicResolverFactory = await ethers.getContractFactory(
      "PublicResolver",
      signer
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
      signer
    );

    wrapper = await wrapperFactory.deploy(
      ensAddress,
      baseRegistrarAddress,
      metaDataserviceAddress
    );
    await wrapper.waitForDeployment();
    wrapperAddress = await wrapper.getAddress();

    const Mimc = await ethers.getContractFactory("Mimc", signer);
    const mimc = await Mimc.deploy();

    await mimc.waitForDeployment();

    const SparseMerkleProof = await ethers.getContractFactory(
      "SparseMerkleProof",
      { libraries: { Mimc: await mimc.getAddress() }, signer }
    );
    const sparseMerkleProof = await SparseMerkleProof.deploy();

    await sparseMerkleProof.waitForDeployment();

    const verifierFactory = await ethers.getContractFactory(
      "LineaSparseProofVerifier",
      {
        libraries: {
          SparseMerkleProof: await sparseMerkleProof.getAddress(),
        },
        signer,
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
    resolverAddress = resolver;

    const l1ResolverFactory = await ethers.getContractFactory(
      "L1Resolver",
      signer
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

    l2contract = impl.attach(resolverAddress);
    tx = await l2contract["setAddr(bytes32,address)"](
      subDomainNode,
      registrantAddr
    );
    await tx.wait();
    console.log("TEST");
  });

  it("should not allow non owner to set target", async () => {
    const incorrectname = encodeName("notowned.eth");
    try {
      const tx = await target.setTarget(incorrectname, resolverAddress);
      await tx.wait();
      throw "Should have reverted";
    } catch (e) {
      console.log(e);
      expect(e.reason).equal("Not authorized to set target for this node");
    }

    const result = await target.getTarget(incorrectname);
    expect(result[1]).to.equal(EMPTY_ADDRESS);
  });

  it("should allow owner to set target", async () => {
    await target.setTarget(encodedname, signerAddress);
    const result = await target.getTarget(encodeName(baseDomain));
    expect(result[1]).to.equal(signerAddress);
  });

  it("subname should get target of its parent", async () => {
    await target.setTarget(encodedname, signerAddress);
    const result = await target.getTarget(encodedSubDomain);
    expect(result[0]).to.equal(subDomainNode);
    expect(result[1]).to.equal(signerAddress);
  });

  it("should allow wrapped owner to set target", async () => {
    const label = "wrapped";
    const tokenId = labelhash(label);
    await baseRegistrar.setApprovalForAll(wrapperAddress, true);
    await baseRegistrar.register(tokenId, signerAddress, 100000000);
    await wrapper.wrapETH2LD(
      label,
      signerAddress,
      0, // CAN_DO_EVERYTHING
      EMPTY_ADDRESS
    );
    const wrappedtname = encodeName(`${label}.eth`);
    await target.setTarget(wrappedtname, resolverAddress);
    const encodedname = encodeName(`${label}.eth`);
    const result = await target.getTarget(encodedname);
    expect(result[1]).to.equal(resolverAddress);
  });

  it.only("should resolve empty ETH Address", async () => {
    let tx = await target.setTarget(encodedname, resolverAddress);
    await tx.wait();
    const addr = "0x0000000000000000000000000000000000000000";
    const result = await l2contract["addr(bytes32)"](node);
    console.log("0");
    expect(result).to.equal(addr);

    const i = new ethers.Interface(["function addr(bytes32) returns(address)"]);
    const calldata = i.encodeFunctionData("addr", [node]);
    console.log("1");
    const result2 = await target.resolve(encodedname, calldata, {
      enableCcipRead: true,
    });
    console.log("2");
    const decoded = i.decodeFunctionResult("addr", result2);
    expect(decoded[0]).to.equal(addr);
  });

  it("should resolve ETH Address", async () => {
    await target.setTarget(encodedname, resolverAddress);
    const result = await l2contract["addr(bytes32)"](subDomainNode);
    expect(ethers.getAddress(result)).to.equal(registrantAddr);
    await l1Provider.send("evm_mine", []);

    const i = new ethers.Interface(["function addr(bytes32) returns(address)"]);
    const calldata = i.encodeFunctionData("addr", [subDomainNode]);
    const result2 = await target.resolve(encodedSubDomain, calldata, {
      enableCcipRead: true,
    });
    const decoded = i.decodeFunctionResult("addr", result2);
    expect(ethers.getAddress(decoded[0])).to.equal(
      ethers.getAddress(registrantAddr)
    );
  });

  it("should resolve non ETH Address", async () => {
    await target.setTarget(encodedname, resolverAddress);
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
    await target.setTarget(encodedname, resolverAddress);
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
    await target.setTarget(encodedname, resolverAddress);
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
    await target.setTarget(encodedname, resolverAddress);
    const addr = "0x0000000000000000000000000000000000000000";
    const result = await l2contract["addr(bytes32)"](node);
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
    await target.setTarget(encodedname, resolverAddress);
    const addr = "0x0000000000000000000000000000000000000000";
    const result = await l2contract["addr(bytes32)"](node);
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
        resolverAddress,
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
