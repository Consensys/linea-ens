const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('PohVerifier', function () {
  let PohVerifier
  let pohVerifier
  let owner
  let addr1
  let addrs

  const signature =
    '0x61a4bc8c787d59cb405daeddbbc90ce2d02c4e56343617e20c4e4a0b975e548b2584f168ccdc821215fb1d5f2495304568300484adfdd44fca60579826b4b3fc1c'
  const invalidSignature =
    '0xed6419236195b99d6f70605ce92a75c94e74be44424dc2a98462afab720e0d2e4944619cc0eb4eeb7e90b699b635589b4524265b5b3dc06eb998cea666968e451b'
  const signerAddress = '0x4a8e79E5258592f208ddba8A8a0d3ffEB051B10A'

  before(async function () {
    [owner, addr1, ...addrs] = await ethers.getSigners()

    PohVerifier = await ethers.getContractFactory('PohVerifier')
    pohVerifier = await PohVerifier.deploy()
    await pohVerifier.deployed()
  })


  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await pohVerifier.owner()).to.equal(owner.address)
    })
  })

  describe('setSigner', function () {
    it('Should revert if not called by the owner', async function () {
      await expect(
        pohVerifier.connect(addr1).setSigner(addr1.address),
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('Should revert if setting the zero address', async function () {
      await expect(
        pohVerifier.setSigner(ethers.constants.AddressZero),
      ).to.be.revertedWith('Invalid address')
    })

    it('Should emit the SignerUpdated event', async function () {
      await expect(pohVerifier.setSigner(addr1.address))
        .to.emit(pohVerifier, 'SignerUpdated')
        .withArgs(addr1.address)
    })
  })

  describe('verify', function () {
    it('Should return true for a valid signature', async function () {
      await pohVerifier.setSigner(signerAddress)
      expect(await pohVerifier.verify(signature, signerAddress)).to.be.true
    })

    it('Should return false for an invalid signature', async function () {
      await pohVerifier.setSigner(signerAddress)
      expect(await pohVerifier.verify(invalidSignature, signerAddress)).to.be
        .false
    })
  })
})
