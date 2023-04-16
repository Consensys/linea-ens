import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { defaultAbiCoder } from "@ethersproject/abi";
// We use mocked results from the gateway and L2 resolver for the unit tests
import { DOMAIN_NAME, EXPECTED_RESOLVE_WITH_PROOF_RESULT, GATEWAY_URL, L2_RESOLVER_ADDRESS, MOCKED_PROOF } from "./mocks/proof";

describe("LineaResolver", function () {
  async function deployContractsFixture() {
    const [owner] = await ethers.getSigners();

    const gateways = [GATEWAY_URL];
    const hash = ethers.utils.namehash(DOMAIN_NAME);

    const undefinedDomain = "undefined.lineatest.eth";
    const undefinedHash = ethers.utils.namehash(undefinedDomain);

    // Deploy ResolverStub
    const LineaResolverStub = await ethers.getContractFactory("LineaResolverStub");
    const lineaResolverStub = await LineaResolverStub.deploy(gateways, L2_RESOLVER_ADDRESS);
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
      const extraData = "0x3b3b57de" + hash.slice(2);
      const result = await lineaResolverStub.resolveWithProof(
        defaultAbiCoder.encode(["(bytes32,bytes,bytes,bytes32,bytes,bytes)"], [Object.values(MOCKED_PROOF)]),
        extraData,
      );
      expect(result).to.equal(EXPECTED_RESOLVE_WITH_PROOF_RESULT);
    });

    it("Should revert if hash does not match the proof", async function () {
      const { lineaResolverStub, undefinedHash } = await loadFixture(deployContractsFixture);
      const extraData = "0x3b3b57de" + undefinedHash.slice(2);
      await expect(
        lineaResolverStub.resolveWithProof(defaultAbiCoder.encode(["(bytes32,bytes,bytes,bytes32,bytes,bytes)"], [Object.values(MOCKED_PROOF)]), extraData),
      ).to.be.revertedWith("Invalid large internal hash");
    });

    it("Should return empty bytes if the function signature is not the one expected", async function () {
      const { lineaResolverStub, undefinedHash } = await loadFixture(deployContractsFixture);
      const extraData = "0x00000000" + undefinedHash.slice(2);
      const result = await lineaResolverStub.resolveWithProof(
        defaultAbiCoder.encode(["(bytes32,bytes,bytes,bytes32,bytes,bytes)"], [Object.values(MOCKED_PROOF)]),
        extraData,
      );
      expect(result).to.be.equal("0x");
    });
  });

  describe("resolve", async () => {
    it("Should revert with OffchainLookup when calling resolve", async function () {
      const { lineaResolverStub, hash } = await loadFixture(deployContractsFixture);
      const extraData = "0x3b3b57de" + hash.slice(2);
      const encodedName = ethers.utils.dnsEncode(DOMAIN_NAME);
      try {
        await lineaResolverStub.resolve(encodedName, extraData);
      } catch (error) {
        expect(error.errorName).to.equal("OffchainLookup");
      }
    });
  });
});
