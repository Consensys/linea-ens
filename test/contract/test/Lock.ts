import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseGwei, Address } from "viem";

const mockedMessage = {
  to: "0xF110a41f75edEb224227747b64Be7f6A7f140abc" as Address,
  contents: "very interesting",
};

const mockedMessageWithError = {
  to: "0xF110a41f75edEb224227747b64Be7f6A7f140abc" as Address,
  contents: "very interesting",
};

describe("Lock712", function () {
  async function deployOneYearLock712Fixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;

    const lockedAmount = parseGwei("1");
    const unlockTime = BigInt((await time.latest()) + ONE_YEAR_IN_SECS);

    const [owner, signer, otherAccount] = await hre.viem.getWalletClients();

    const lock = await hre.viem.deployContract("Lock712", [unlockTime], {
      value: lockedAmount,
    });
    await lock.write.setSigner([owner.account.address]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      lock,
      unlockTime,
      lockedAmount,
      owner,
      signer,
      otherAccount,
      publicClient,
    };
  }

  describe("Signer", function () {
    it("Should return When deployed, the signer is the owner", async function () {
      const { lock, owner } = await loadFixture(deployOneYearLock712Fixture);
      const currentSigner = await lock.read.signer();

      expect(getAddress(currentSigner)).to.equal(
        getAddress(owner.account.address)
      );
    });
    it("Should return the new signer when changed", async function () {
      const { lock, signer } = await loadFixture(deployOneYearLock712Fixture);
      await lock.write.setSigner([signer.account.address]);
      const currentSigner = await lock.read.signer();

      expect(getAddress(currentSigner)).to.equal(
        getAddress(signer.account.address)
      );
    });
  });

  describe("EIP712", function () {
    it("EIP712", async function () {
      const { lock, owner } = await loadFixture(deployOneYearLock712Fixture);

      const domain = {
        name: "VotingApp",
        version: "1",
        chainId: 31337,
        verifyingContract: lock.address,
      } as const;

      const types = {
        Mail: [
          { name: "to", type: "address" },
          { name: "contents", type: "string" },
        ],
      } as const;

      const signature = await owner.signTypedData({
        domain,
        types,
        primaryType: "Mail",
        message: mockedMessage,
      });

      const test3 = await lock.read.verify([
        signature,
        owner.account.address,
        "0xF110a41f75edEb224227747b64Be7f6A7f140abc",
        "very interesting",
      ]);

      console.log("xoooo", test3);
    });
  });

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { lock, unlockTime } = await loadFixture(
        deployOneYearLock712Fixture
      );

      expect(await lock.read.unlockTime()).to.equal(unlockTime);
    });

    it("Should set the right owner", async function () {
      const { lock, owner } = await loadFixture(deployOneYearLock712Fixture);

      expect(await lock.read.owner()).to.equal(
        getAddress(owner.account.address)
      );
    });

    it("Should receive and store the funds to lock", async function () {
      const { lock, lockedAmount, publicClient } = await loadFixture(
        deployOneYearLock712Fixture
      );

      expect(
        await publicClient.getBalance({
          address: lock.address,
        })
      ).to.equal(lockedAmount);
    });

    it("Should fail if the unlockTime is not in the future", async function () {
      // We don't use the fixture here because we want a different deployment
      const latestTime = BigInt(await time.latest());
      await expect(
        hre.viem.deployContract("Lock712", [latestTime], {
          value: 1n,
        })
      ).to.be.rejectedWith("Unlock time should be in the future");
    });
  });

  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        const { lock } = await loadFixture(deployOneYearLock712Fixture);

        await expect(lock.write.withdraw42()).to.be.rejectedWith(
          "You can't withdraw yet"
        );
      });

      it("Should revert with the right error if called from another account", async function () {
        const { lock, unlockTime, otherAccount } = await loadFixture(
          deployOneYearLock712Fixture
        );

        // We can increase the time in Hardhat Network
        await time.increaseTo(unlockTime);

        // We retrieve the contract with a different account to send a transaction
        const lockAsOtherAccount = await hre.viem.getContractAt(
          "Lock712",
          lock.address,
          { walletClient: otherAccount }
        );
        await expect(lockAsOtherAccount.write.withdraw42()).to.be.rejectedWith(
          "You aren't the owner"
        );
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { lock, unlockTime } = await loadFixture(
          deployOneYearLock712Fixture
        );

        // Transactions are sent using the first signer by default
        await time.increaseTo(unlockTime);

        await expect(lock.write.withdraw42()).to.be.fulfilled;
      });
    });

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { lock, unlockTime, lockedAmount, publicClient } =
          await loadFixture(deployOneYearLock712Fixture);

        await time.increaseTo(unlockTime);

        const hash = await lock.write.withdraw42();
        await publicClient.waitForTransactionReceipt({ hash });

        // get the withdrawal events in the latest block
        const withdrawalEvents = await lock.getEvents.Withdrawal();
        expect(withdrawalEvents).to.have.lengthOf(1);
        expect(withdrawalEvents[0].args.amount).to.equal(lockedAmount);
      });
    });
  });
});
