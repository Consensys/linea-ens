//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "./IPriceOracle.sol";

contract FixedPriceOracle is IPriceOracle {
    /// @dev 1,000,000 ETH in Wei
    uint256 public constant FIXED_PRICE_ETH = 1000000 * 10 ** 18;

    /**
     * @notice Returns a fixed amount of ETH as the price.
     * @dev Kept 3 empty args to match the default price() method definition of the ExponentialPremiumPriceOracle.
     */
    function price(
        string calldata,
        uint256,
        uint256
    ) external pure override returns (Price memory) {
        return Price(FIXED_PRICE_ETH, 0);
    }
}
