import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, Address } from "viem";

describe("PohVerifier", function () {
  async function deployOneYearPohVerifierFixture() {
    const [owner, signer, humanAccount, otherAccount] =
      await hre.viem.getWalletClients();

    const verifier = await hre.viem.deployContract("PohVerifier", []);
    await verifier.write.setSigner([owner.account.address]);

    const publicClient = await hre.viem.getPublicClient();

    const domain = {
      name: "VerifyPoh",
      version: "1",
      chainId: 31337,
      verifyingContract: verifier.address,
    } as const;

    const types = {
      POH: [{ name: "to", type: "address" }],
    } as const;

    return {
      verifier,
      domain,
      types,
      owner,
      signer,
      humanAccount,
      otherAccount,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { verifier, owner } = await loadFixture(
        deployOneYearPohVerifierFixture
      );

      expect(await verifier.read.owner()).to.equal(
        getAddress(owner.account.address)
      );
    });
  });

  describe("Signer", function () {
    it("Should return When deployed, the signer is the owner", async function () {
      const { verifier, owner } = await loadFixture(
        deployOneYearPohVerifierFixture
      );
      const currentSigner = await verifier.read.signer();

      expect(getAddress(currentSigner)).to.equal(
        getAddress(owner.account.address)
      );
    });
    it("Should return the new signer when changed", async function () {
      const { verifier, signer } = await loadFixture(
        deployOneYearPohVerifierFixture
      );
      await verifier.write.setSigner([signer.account.address]);
      const currentSigner = await verifier.read.signer();

      expect(getAddress(currentSigner)).to.equal(
        getAddress(signer.account.address)
      );
    });
  });

  describe("Verify", function () {
    it("Should verify proof of humanity with good signature", async function () {
      const { verifier, domain, types, owner, humanAccount } =
        await loadFixture(deployOneYearPohVerifierFixture);

      const signature = await owner.signTypedData({
        domain,
        types,
        primaryType: "POH",
        message: {
          to: humanAccount.account.address,
        },
      });

      const pohCheck = await verifier.read.verify([
        signature,
        humanAccount.account.address,
      ]);

      expect(pohCheck).to.equal(true);
    });

    it("Should not verify proof of humanity with bad signature", async function () {
      const { verifier, domain, types, owner, humanAccount, otherAccount } =
        await loadFixture(deployOneYearPohVerifierFixture);

      const signature = await owner.signTypedData({
        domain,
        types,
        primaryType: "POH",
        message: {
          to: humanAccount.account.address,
        },
      });

      const pohCheck = await verifier.read.verify([
        signature,
        otherAccount.account.address,
      ]);

      expect(pohCheck).to.equal(false);
    });
  });

  describe("Events", function () {
    it("Should emit an event on setSigner", async function () {
      const { verifier, publicClient, signer } = await loadFixture(
        deployOneYearPohVerifierFixture
      );

      const hash = await verifier.write.setSigner([signer.account.address]);
      await publicClient.waitForTransactionReceipt({ hash });

      const setSignerEvents = await verifier.getEvents.SignerUpdated();
      const newSigner = setSignerEvents[0].args.newSigner as Address;
      expect(setSignerEvents).to.have.lengthOf(1);
      expect(getAddress(newSigner)).to.equal(
        getAddress(signer.account.address)
      );
    });
  });
});
