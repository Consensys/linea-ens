import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { constants } from "ethers";

describe("LineaResolver", function () {
  async function deployContractsFixture() {
    const [owner] = await ethers.getSigners();

    const domain = "julink.lineatest.eth";
    const hash = ethers.utils.namehash(domain);

    const undefinedDomain = "undefined.lineatest.eth";
    const undefinedHash = ethers.utils.namehash(undefinedDomain);

    // Deploy Resolver
    const LineaResolver = await ethers.getContractFactory("LineaResolver");
    const lineaResolver = await LineaResolver.deploy("Lineatest", "LTST");
    await lineaResolver.deployed();

    // Mint domain
    await lineaResolver.mintSubdomain(hash, owner.address);

    return {
      owner,
      lineaResolver,
      hash,
      undefinedHash,
    };
  }

  describe("resolve", async () => {
    it("Should be able to resolve an address given a hashname", async function () {
      const { lineaResolver, hash, owner } = await loadFixture(deployContractsFixture);

      expect(await lineaResolver.resolve(hash)).to.be.equal(owner.address);
    });

    it("Resolve should send address(0) if the hash has not been minted", async function () {
      const { lineaResolver, undefinedHash } = await loadFixture(deployContractsFixture);

      expect(await lineaResolver.resolve(undefinedHash)).to.be.equal(constants.AddressZero);
    });
  });

  describe("exists", async () => {
    it("Should be able to check if an tokenId exists", async function () {
      const { lineaResolver } = await loadFixture(deployContractsFixture);

      expect(await lineaResolver.exists(1)).to.be.equal(true);
      expect(await lineaResolver.exists(10)).to.be.equal(false);
    });
  });
});
