const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('PohRegistrationManager', function () {
  let PohRegistrationManager;
  let pohRegistrationManager;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    PohRegistrationManager = await ethers.getContractFactory('PohRegistrationManager');
    pohRegistrationManager = await PohRegistrationManager.deploy();
    await pohRegistrationManager.deployed();
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await pohRegistrationManager.owner()).to.equal(owner.address);
    });
  });

  describe('markAsRegistered', function () {
    it('Should revert if not called by the manager', async function () {
      await expect(pohRegistrationManager.connect(addr1).markAsRegistered(addr1.address)).to.be.reverted;
    });

    it('Should mark an address as registered', async function () {
      await pohRegistrationManager.setManager(addr1.address, true);
      await pohRegistrationManager.connect(addr1).markAsRegistered(addr2.address);
      expect(await pohRegistrationManager.isRegistered(addr2.address)).to.be.true;
    });
  });

  describe('isRegistered', function () {
    it('Should return false for an unregistered address', async function () {
      expect(await pohRegistrationManager.isRegistered(addr1.address)).to.be.false;
    });

    it('Should return true for a registered address', async function () {
      await pohRegistrationManager.setManager(owner.address, true);
      await pohRegistrationManager.markAsRegistered(addr1.address);
      expect(await pohRegistrationManager.isRegistered(addr1.address)).to.be.true;
    });
  });

  describe('setManager', function () {
    it('Should revert if not called by the manager', async function () {
      await expect(pohRegistrationManager.connect(addr1).setManager(addr1.address, true)).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should set an address as a manager', async function () {
      await pohRegistrationManager.setManager(addr1.address, true);
      expect(await pohRegistrationManager.managers(addr1.address)).to.be.true;
    });

    it('Should remove an address as a manager', async function () {
      await pohRegistrationManager.setManager(addr1.address, true);
      await pohRegistrationManager.setManager(addr1.address, false);
      expect(await pohRegistrationManager.managers(addr1.address)).to.be.false;
    });
  });
});