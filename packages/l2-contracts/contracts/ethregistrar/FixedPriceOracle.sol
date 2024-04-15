//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "./IPriceOracle.sol";

contract FixedPriceOracle is IPriceOracle {
    uint256 public constant FIXED_PRICE_USD = 1000000 * 10 ** 18; // 1,000,000 USD in Wei

    function price(
        string calldata,
        uint256,
        uint256
    ) external pure override returns (Price memory) {
        return Price(FIXED_PRICE_USD, 0);
    }
}
