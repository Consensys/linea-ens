import { makeL2Gateway } from "linea-resolver-gateway";
import { Server } from "@chainlink/ccip-read-server";
import { HardhatEthersProvider } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";
import { HardhatEthersHelpers } from "@nomicfoundation/hardhat-ethers/types";
import { expect } from "chai";
import {
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
const labelhash = (label) => ethers.keccak256(ethers.toUtf8Bytes(label));
const encodeName = (name) => "0x" + packet.name.encode(name).toString("hex");
const name = "linea.eth";
const node = ethers.namehash(name);
const encodedname = encodeName(name);

const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
const EMPTY_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

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
  let signer: Signer;
  let verifier: Contract;
  let target: Contract;
  let l2contract: Contract;
  let ens: Contract;
  let wrapper: Contract;
  let baseRegistrar: Contract;
  let signerAddress, l2ResolverAddress, wrapperAddress;

  before(async () => {
    if (!process.env.L2_PROVIDER_URL) {
      throw "No L2_PROVIDER_URL found in env file";
    }
    if (!process.env.L2_RESOLVER_ADDRESS) {
      throw "No L2_RESOLVER_ADDRESS found in env file";
    }

    // Hack to get a 'real' ethers provider from hardhat. The default `HardhatProvider`
    // doesn't support CCIP-read.
    l1Provider = new ethers.BrowserProvider(ethers.provider._hardhatProvider);
    l2Provider = new ethers.JsonRpcProvider(
      process.env.L2_PROVIDER_URL,
      59140,
      {
        staticNetwork: true,
      }
    );
    // provider.on("debug", (x: any) => console.log(JSON.stringify(x, undefined, 2)));
    signer = await l1Provider.getSigner(0);
    signerAddress = await signer.getAddress();

    const Rollup = await ethers.getContractFactory("RollupMock", signer);
    const rollup = await Rollup.deploy();

    const gateway = makeL2Gateway(
      (l1Provider as unknown) as JsonRpcProvider,
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
    await baseRegistrar.register(labelhash("linea"), signerAddress, 100000000);
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
    l2ResolverAddress = process.env.L2_RESOLVER_ADDRESS;

    const Mimc = await ethers.getContractFactory("Mimc", signer);
    const mimc = await Mimc.deploy();

    const SparseMerkleProof = await ethers.getContractFactory(
      "SparseMerkleProof",
      { libraries: { Mimc: await mimc.getAddress() }, signer }
    );
    const sparseMerkleProof = await SparseMerkleProof.deploy();

    const verifierFactory = await ethers.getContractFactory("Verifier", {
      libraries: {
        SparseMerkleProof: await sparseMerkleProof.getAddress(),
      },
      signer,
    });
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
      wrapperAddress
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
    const incorrectnode = ethers.namehash("notowned.eth");
    const incorrectname = encodeName("notowned.eth");
    // For some reason expect().to.be.reverted isn't working
    // Throwing Error: missing revert data (action="estimateGas"...
    try {
      await target.setTarget(incorrectnode, l2ResolverAddress);
    } catch (e) {}

    const result = await target.getTarget(incorrectname, 0);
    expect(result[1]).to.equal(EMPTY_ADDRESS);
  });

  it("should allow owner to set target", async () => {
    await target.setTarget(node, signerAddress);
    const result = await target.getTarget(encodeName(name), 0);
    expect(result[1]).to.equal(signerAddress);
  });

  it("subname should get target of its parent", async () => {
    const subname = "d.linea.eth";
    const encodedsubname = encodeName(subname);
    const subnode = ethers.namehash(subname);
    await target.setTarget(node, signerAddress);
    const result = await target.getTarget(encodedsubname, 0);
    expect(result[0]).to.equal(subnode);
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
    const wrappedtnode = ethers.namehash(`${label}.eth`);
    await target.setTarget(wrappedtnode, l2ResolverAddress);
    const encodedname = encodeName(`${label}.eth`);
    const result = await target.getTarget(encodedname, 0);
    expect(result[1]).to.equal(l2ResolverAddress);
  });

  it.only("should resolve empty ETH Address", async () => {
    await target.setTarget(node, l2ResolverAddress);
    const addr = "0x0000000000000000000000000000000000000000";
    const result = await l2contract["addr(bytes32)"](node);
    expect(ethers.getAddress(result)).to.equal(addr);
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
    await target.setTarget(node, l2ResolverAddress);
    const addr = "0x5A384227B65FA093DEC03Ec34e111Db80A040615";
    await l2contract.clearRecords(node);
    await l2contract["setAddr(bytes32,address)"](node, addr);
    const result = await l2contract["addr(bytes32)"](node);
    expect(ethers.getAddress(result)).to.equal(addr);
    await l1Provider.send("evm_mine", []);

    const i = new ethers.Interface(["function addr(bytes32) returns(address)"]);
    const calldata = i.encodeFunctionData("addr", [node]);
    const result2 = await target.resolve(encodedname, calldata, {
      enableCcipRead: true,
    });
    const decoded = i.decodeFunctionResult("addr", result2);
    expect(decoded[0]).to.equal(addr);
  });

  it("should resolve ETH Address for subname", async () => {
    await target.setTarget(node, l2ResolverAddress);
    const addr = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
    await l2contract.clearRecords(node);
    const subname = "d.foo.eth";
    const subnode = ethers.namehash(subname);
    const encodedsubname = encodeName(subname);
    await l2contract["setAddr(bytes32,address)"](subnode, addr);
    const result = await l2contract["addr(bytes32)"](subnode);
    expect(ethers.getAddress(result)).to.equal(addr);
    await l1Provider.send("evm_mine", []);
    const i = new ethers.Interface(["function addr(bytes32) returns(address)"]);
    const calldata = i.encodeFunctionData("addr", [subnode]);

    const result2 = await target.resolve(encodedsubname, calldata, {
      enableCcipRead: true,
    });
    const decoded = i.decodeFunctionResult("addr", result2);
    expect(decoded[0]).to.equal(addr);
  });

  it("should resolve non ETH Address", async () => {
    await target.setTarget(node, l2ResolverAddress);
    const addr = "0x76a91462e907b15cbf27d5425399ebf6f0fb50ebb88f1888ac";
    const coinType = 0; // BTC
    await l2contract.clearRecords(node);
    await l2contract["setAddr(bytes32,uint256,bytes)"](node, coinType, addr);
    await l1Provider.send("evm_mine", []);

    const i = new ethers.Interface([
      "function addr(bytes32,uint256) returns(bytes)",
    ]);
    const calldata = i.encodeFunctionData("addr", [node, coinType]);
    const result2 = await target.resolve(encodedname, calldata, {
      enableCcipRead: true,
    });
    const decoded = i.decodeFunctionResult("addr", result2);
    expect(decoded[0]).to.equal(addr);
  });

  it("should resolve text record", async () => {
    await target.setTarget(node, l2ResolverAddress);
    const key = "name";
    const value = "nick.eth";
    await l2contract.clearRecords(node);
    await l2contract.setText(node, key, value);
    await l1Provider.send("evm_mine", []);

    const i = new ethers.Interface([
      "function text(bytes32,string) returns(string)",
    ]);
    const calldata = i.encodeFunctionData("text", [node, key]);
    const result2 = await target.resolve(encodedname, calldata, {
      enableCcipRead: true,
    });
    const decoded = i.decodeFunctionResult("text", result2);
    expect(decoded[0]).to.equal(value);
  });

  it("should test contenthash", async () => {
    await target.setTarget(node, l2ResolverAddress);
    const contenthash =
      "0xe3010170122029f2d17be6139079dc48696d1f582a8530eb9805b561eda517e22a892c7e3f1f";
    await l2contract.clearRecords(node);
    await l2contract.setContenthash(node, contenthash);
    await l1Provider.send("evm_mine", []);

    const i = new ethers.Interface([
      "function contenthash(bytes32) returns(bytes)",
    ]);
    const calldata = i.encodeFunctionData("contenthash", [node]);
    const result2 = await target.resolve(encodedname, calldata, {
      enableCcipRead: true,
    });
    const decoded = i.decodeFunctionResult("contenthash", result2);
    expect(decoded[0]).to.equal(contenthash);
  });
});
