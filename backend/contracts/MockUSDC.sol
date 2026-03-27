// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @notice Simple ERC-20 with 6 decimals for local testing.
 */
contract MockUSDC is ERC20, Ownable {
    constructor() ERC20("Mock USDC", "mUSDC") Ownable(msg.sender) {}

    /**
     * @dev Simple faucet for testing.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev USDC usually has 6 decimals.
     */
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}
