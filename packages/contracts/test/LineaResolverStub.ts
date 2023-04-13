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

    // Deploy ResolverStub
    const LineaResolverStub = await ethers.getContractFactory("LineaResolverStub");
    const lineaResolverStub = await LineaResolverStub.deploy(["http://localhost:8080"], lineaResolver.address);
    await lineaResolverStub.deployed();

    return {
      owner,
      lineaResolver,
      hash,
      undefinedHash,
    };
  }

  describe("initialization", async () => {
    it("The contract should have been deployed correctly", async function () {
      const { lineaResolver, hash } = await loadFixture(deployContractsFixture);

      expect(await lineaResolver.addresses(hash)).to.be.equal(1);
      expect(await lineaResolver.tokenId()).to.be.equal(2);
    });
  });
});
