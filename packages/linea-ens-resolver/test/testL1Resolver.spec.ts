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
} from "./testData";
const labelhash = (label) => ethers.keccak256(ethers.toUtf8Bytes(label));
const encodeName = (name) => "0x" + packet.name.encode(name).toString("hex");
const domainName = "linea-test";
const baseDomain = `${domainName}.eth`;
const node = ethers.namehash(baseDomain);
const encodedname = encodeName(baseDomain);

const registrantAddr = "0x4a8e79E5258592f208ddba8A8a0d3ffEB051B10A";
const subDomain = "testpoh.linea-test.eth";
const subDomainNode = ethers.namehash(subDomain);
const encodedSubDomain = encodeName(subDomain);

const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
const EMPTY_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const PROOF_ENCODING_PADDING =
  "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000044e0";

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
  let l1Provider: BrowserProvider;
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
  let signerAddress, l2ResolverAddress, wrapperAddress;

  before(async () => {
    // Hack to get a 'real' ethers provider from hardhat. The default `HardhatProvider`
    // doesn't support CCIP-read.
    l1Provider = new ethers.BrowserProvider(ethers.provider._hardhatProvider);
    // Those test work only with a specific contract deployed on linea sepolia
    l2Provider = new ethers.JsonRpcProvider(
      "https://rpc.sepolia.linea.build/",
      59140,
      {
        staticNetwork: true,
      }
    );
    // We need this provider to get the latest L2BlockNumber along with the the linea state root hash
    l1SepoliaProvider = new ethers.JsonRpcProvider(
      "https://gateway.tenderly.co/public/sepolia",
      11155111,
      {
        staticNetwork: true,
      }
    );
    signer = await l1Provider.getSigner(0);
    signerAddress = await signer.getAddress();

    const Rollup = await ethers.getContractFactory("RollupMock", signer);

    // We query the latest block number and state root hash on the actual L1 sepolia chain
    // because otherwise if we hard code a block number and state root hash the test is no longer
    // working after a while as linea_getProof stops working for older blocks
    const rollupSepolia = new ethers.Contract(
      "0xB218f8A4Bc926cF1cA7b3423c154a0D627Bdb7E5",
      Rollup.interface,
      l1SepoliaProvider
    );
    const currentL2BlockNumber = await rollupSepolia.currentL2BlockNumber();
    const stateRootHash =
      await rollupSepolia.stateRootHashes(currentL2BlockNumber);
    rollup = await Rollup.deploy(currentL2BlockNumber, stateRootHash);

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
    const ensAddress = await ens.getAddress();
    const baseRegistrarFactory = await ethers.getContractFactory(
      "BaseRegistrarImplementation",
      signer
    );
    baseRegistrar = await baseRegistrarFactory.deploy(
      ensAddress,
      ethers.namehash("eth")
    );
    const baseRegistrarAddress = await baseRegistrar.getAddress();
    await baseRegistrar.addController(signerAddress);
    const metaDataserviceFactory = await ethers.getContractFactory(
      "StaticMetadataService",
      signer
    );
    const metaDataservice = await metaDataserviceFactory.deploy(
      "https://ens.domains"
    );
    const metaDataserviceAddress = await metaDataservice.getAddress();
    const reverseRegistrarFactory = await ethers.getContractFactory(
      "ReverseRegistrar",
      signer
    );
    const reverseRegistrar = await reverseRegistrarFactory.deploy(ensAddress);
    const reverseRegistrarAddress = await reverseRegistrar.getAddress();
    await ens.setSubnodeOwner(
      EMPTY_BYTES32,
      labelhash("reverse"),
      signerAddress
    );
    await ens.setSubnodeOwner(
      ethers.namehash("reverse"),
      labelhash("addr"),
      reverseRegistrarAddress
    );
    await ens.setSubnodeOwner(
      EMPTY_BYTES32,
      labelhash("eth"),
      baseRegistrarAddress
    );
    await baseRegistrar.register(
      labelhash(domainName),
      signerAddress,
      100000000
    );
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
    const publicResolverAddress = await publicResolver.getAddress();
    await reverseRegistrar.setDefaultResolver(publicResolverAddress);

    const wrapperFactory = await ethers.getContractFactory(
      "NameWrapper",
      signer
    );
    await l1Provider.send("evm_mine", []);
    wrapper = await wrapperFactory.deploy(
      ensAddress,
      baseRegistrarAddress,
      metaDataserviceAddress
    );
    wrapperAddress = await wrapper.getAddress();
    const impl = await ethers.getContractFactory("PublicResolver", signer);
    l2ResolverAddress = "0x28F15B034f9744d43548ac64DCE04ed77BdBd832";

    const Mimc = await ethers.getContractFactory("Mimc", signer);
    const mimc = await Mimc.deploy();

    const SparseMerkleProof = await ethers.getContractFactory(
      "SparseMerkleProof",
      { libraries: { Mimc: await mimc.getAddress() }, signer }
    );
    const sparseMerkleProof = await SparseMerkleProof.deploy();

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
    // Mine an empty block so we have something to prove against
    await l1Provider.send("evm_mine", []);
    l2contract = new ethers.Contract(
      l2ResolverAddress,
      impl.interface,
      l2Provider
    );
  });

  it("should not allow non owner to set target", async () => {
    const incorrectname = encodeName("notowned.eth");
    try {
      await target.setTarget(incorrectname, l2ResolverAddress);
    } catch (e) {
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
    await target.setTarget(wrappedtname, l2ResolverAddress);
    const encodedname = encodeName(`${label}.eth`);
    const result = await target.getTarget(encodedname);
    expect(result[1]).to.equal(l2ResolverAddress);
  });

  it("should resolve empty ETH Address", async () => {
    await target.setTarget(encodedname, l2ResolverAddress);
    const addr = "0x0000000000000000000000000000000000000000";
    const result = await l2contract["addr(bytes32)"](node);
    expect(result).to.equal(addr);
    await l1Provider.send("evm_mine", []);

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
    } catch (error) {
      expect(error.reason).to.equal("invalid selector");
    }
  });

  it("should revert if the calldata is too short", async () => {
    await target.setTarget(encodedname, l2ResolverAddress);
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
    } catch (error) {
      expect(error.reason).to.equal("param data too short");
    }
  });

  it("should revert if the number of commands is bigger than the number of storage proofs returned by the gateway", async () => {
    const currentBlockNo = await rollup.currentL2BlockNumber();
    const currentStateRoot = await rollup.stateRootHashes(currentBlockNo);
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
        86400
      );
    } catch (error) {
      expect(error.reason).to.equal(
        "LineaProofHelper: commands number > storage proofs number"
      );
    }
    // Put back the right block number and state root
    await rollup.setCurrentStateRoot(currentBlockNo, currentStateRoot);
  });

  it("should revert if the block number returned by the gateway is not the most recent one", async () => {
    const currentBlockNo = await rollup.currentL2BlockNumber();
    const currentStateRoot = await rollup.stateRootHashes(currentBlockNo);
    // Put a wrong block number
    await rollup.setCurrentStateRoot(blockNo + 100_000, stateRoot);
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
    } catch (error) {
      expect(error.reason).to.equal(
        "LineaSparseProofVerifier: block not in range accepted"
      );
    }
    // Put back the right block number and state root
    await rollup.setCurrentStateRoot(currentBlockNo, currentStateRoot);
  });

  it("should revert if the proof's target is not matching the one queried", async () => {
    const currentBlockNo = await rollup.currentL2BlockNumber();
    const currentStateRoot = await rollup.stateRootHashes(currentBlockNo);
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
    } catch (error) {
      expect(error.reason).to.equal("LineaProofHelper: wrong target");
    }
    // Put back block number and state root
    await rollup.setCurrentStateRoot(currentBlockNo, currentStateRoot);
  });
});
