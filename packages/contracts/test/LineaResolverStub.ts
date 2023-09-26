import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { defaultAbiCoder } from "@ethersproject/abi";
// We use mocked results from the gateway and L2 resolver for the unit tests
import { DOMAIN_NAME, EXPECTED_RESOLVE_WITH_PROOF_RESULT, GATEWAY_URL, L2_RESOLVER_ADDRESS, MOCKED_PROOF, MOCKED_PROOF_UNDEFINED } from "./mocks/proof";

describe("LineaResolverStub", function () {
  async function deployContractsFixture() {
    const [owner] = await ethers.getSigners();

    const gateways = [GATEWAY_URL];
    const hash = ethers.utils.namehash(DOMAIN_NAME);

    const undefinedDomain = "undefined.lineatest.eth";
    const undefinedHash = ethers.utils.namehash(undefinedDomain);

    // Deploy FakeRollup
    const FakeRollup = await ethers.getContractFactory("FakeRollup");
    const fakeRollup = await FakeRollup.deploy();
    await fakeRollup.deployed();

    // Deploy ResolverStub
    const LineaResolverStub = await ethers.getContractFactory("LineaResolverStub");
    const lineaResolverStub = await LineaResolverStub.deploy(gateways, L2_RESOLVER_ADDRESS, fakeRollup.address);
    await lineaResolverStub.deployed();

    return {
      owner,
      lineaResolverStub,
      hash,
      undefinedHash,
      gateways,
    };
  }

  describe("initialization", async () => {
    it("The contract should have been deployed correctly", async function () {
      const { lineaResolverStub } = await loadFixture(deployContractsFixture);

      expect(await lineaResolverStub.gateways(0)).to.be.equal(GATEWAY_URL);
      expect(await lineaResolverStub.l2resolver()).to.be.equal(L2_RESOLVER_ADDRESS);
    });
  });

  describe("resolveWithProof", async () => {
    it("Should return the expected address", async function () {
      const { lineaResolverStub, hash } = await loadFixture(deployContractsFixture);
      // We prefix with the function signature 'addr(bytes32)' as bytes4
      const extraData = `0x3b3b57de${hash.slice(2)}`;
      const result = await lineaResolverStub.resolveWithProof(
        defaultAbiCoder.encode(["(bytes32,bytes,bytes,bytes32,bytes,bytes)"], [Object.values(MOCKED_PROOF)]),
        extraData,
      );
      expect(result).to.equal(EXPECTED_RESOLVE_WITH_PROOF_RESULT);
    });

    it("Should revert if hash does not match the proof", async function () {
      const { lineaResolverStub, undefinedHash } = await loadFixture(deployContractsFixture);
      const extraData = `0x3b3b57de${undefinedHash.slice(2)}`;
      await expect(
        lineaResolverStub.resolveWithProof(defaultAbiCoder.encode(["(bytes32,bytes,bytes,bytes32,bytes,bytes)"], [Object.values(MOCKED_PROOF)]), extraData),
      ).to.be.revertedWith("Invalid large internal hash");
    });

    it("Should return empty bytes if the function signature is not the one expected", async function () {
      const { lineaResolverStub, undefinedHash } = await loadFixture(deployContractsFixture);
      const extraData = `0x00000000${undefinedHash.slice(2)}`;
      const result = await lineaResolverStub.resolveWithProof(
        defaultAbiCoder.encode(["(bytes32,bytes,bytes,bytes32,bytes,bytes)"], [Object.values(MOCKED_PROOF)]),
        extraData,
      );
      expect(result).to.be.equal("0x");
    });

    it("Should return empty bytes if the domain does not exists but the proof is correct", async function () {
      const { lineaResolverStub, undefinedHash } = await loadFixture(deployContractsFixture);
      const extraData = `0x3b3b57de${undefinedHash.slice(2)}`;
      const result = await lineaResolverStub.resolveWithProof(
        defaultAbiCoder.encode(["(bytes32,bytes,bytes,bytes32,bytes,bytes)"], [Object.values(MOCKED_PROOF_UNDEFINED)]),
        extraData,
      );
      expect(result).to.be.equal("0x");
    });

    it("Should revert when blockHash is not valid", async function () {
      const { lineaResolverStub, hash } = await loadFixture(deployContractsFixture);
      const extraData = `0x3b3b57de${hash.slice(2)}`;
      const proofWithInvalidBlockHash = { ...MOCKED_PROOF };
      proofWithInvalidBlockHash.blockHash = "0x94ea534b47baee0ba1b851ea15ffd0435de5389022baf665d5f59dac55c140b1";
      await expect(
        lineaResolverStub.resolveWithProof(
          defaultAbiCoder.encode(["(bytes32,bytes,bytes,bytes32,bytes,bytes)"], [Object.values(proofWithInvalidBlockHash)]),
          extraData,
        ),
      ).to.revertedWith("LineaResolverStub: blockHash encodedBlockArray mismatch");
    });

    // it("Should revert if the given state root is invalid", async function () {
    //   const { lineaResolverStub, hash } = await loadFixture(deployContractsFixture);
    //   const extraData = `0x3b3b57de${hash.slice(2)}`;
    //   await expect(
    //     lineaResolverStub.resolveWithProof(
    //       defaultAbiCoder.encode(["(bytes32,bytes,bytes,bytes32,bytes,bytes)"], [Object.values(MOCKED_PROOF_INVALID_STATE_ROOT)]),
    //       extraData,
    //     ),
    //   ).to.revertedWith("LineaResolverStub: invalid state root");
    // });
  });

  describe("resolve", async () => {
    it("Should revert with OffchainLookup when calling resolve", async function () {
      const { lineaResolverStub, hash } = await loadFixture(deployContractsFixture);
      const extraData = `0x3b3b57de${hash.slice(2)}`;
      const encodedName = ethers.utils.dnsEncode(DOMAIN_NAME);
      try {
        await lineaResolverStub.resolve(encodedName, extraData);
      } catch (error) {
        expect(error.errorName).to.equal("OffchainLookup");
      }
    });
  });

  describe("supportsInterface", async () => {
    it("should return true for valid interfaceId", async () => {
      const { lineaResolverStub } = await loadFixture(deployContractsFixture);
      const anotherInterfaceId = "0x9061b923";
      const result = await lineaResolverStub.supportsInterface(anotherInterfaceId);
      expect(result).to.be.equal(true);
    });

    it("should return true for valid interfaceId for the abstract SupportsInterface contract", async () => {
      const { lineaResolverStub } = await loadFixture(deployContractsFixture);
      const anotherInterfaceId = "0x01ffc9a7";
      const result = await lineaResolverStub.supportsInterface(anotherInterfaceId);
      expect(result).to.be.equal(true);
    });

    it("should return false for invalid interfaceId", async () => {
      const { lineaResolverStub } = await loadFixture(deployContractsFixture);
      const invalidInterfaceId = "0x89abcdef";
      const result = await lineaResolverStub.supportsInterface(invalidInterfaceId);
      expect(result).to.be.equal(false);
    });
  });
});
