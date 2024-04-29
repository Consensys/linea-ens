const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('FixedPriceOracle', function () {
  let FixedPriceOracle;
  let fixedPriceOracle;

  beforeEach(async function () {
    FixedPriceOracle = await ethers.getContractFactory('FixedPriceOracle');
    fixedPriceOracle = await FixedPriceOracle.deploy();
    await fixedPriceOracle.deployed();
  });

  it('should return the fixed price in ETH', async function () {
    const fixedPriceETH = await fixedPriceOracle.FIXED_PRICE_ETH();
    const expectedFixedPriceETH = ethers.utils.parseEther('1000000');

    expect(fixedPriceETH).to.equal(expectedFixedPriceETH);
  });

  it('should return the fixed price for any input parameters', async function () {
    const name = 'example.linea-test.eth';
    const expires = 0;
    const duration = 31536000; // 1 year in seconds

    const price = await fixedPriceOracle.price(name, expires, duration);

    expect(price.base).to.equal(ethers.utils.parseEther('1000000'));
    expect(price.premium).to.equal(0);
  });

  it('should return the fixed price for different input parameters', async function () {
    const name1 = 'test.linea-test.eth';
    const expires1 = 1234567890;
    const duration1 = 2592000; // 30 days in seconds

    const price1 = await fixedPriceOracle.price(name1, expires1, duration1);

    expect(price1.base).to.equal(ethers.utils.parseEther('1000000'));
    expect(price1.premium).to.equal(0);

    const name2 = 'another.linea-test.eth';
    const expires2 = 9876543210;
    const duration2 = 31536000; // 1 year in seconds

    const price2 = await fixedPriceOracle.price(name2, expires2, duration2);

    expect(price2.base).to.equal(ethers.utils.parseEther('1000000'));
    expect(price2.premium).to.equal(0);
  });
});