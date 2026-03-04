// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract PrBountyDistributor {
    IERC20 public immutable usdc;
    address public owner;
    mapping(bytes32 => bool) public processed;
    bool public paused;

    event Rewarded(address indexed to, uint256 amount, bytes32 indexed eventId);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(bool isPaused);
    event Recovered(address indexed token, address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "paused");
        _;
    }

    constructor(address usdc_, address owner_) {
        require(usdc_ != address(0), "zero usdc");
        require(owner_ != address(0), "zero owner");
        usdc = IERC20(usdc_);
        owner = owner_;
        emit OwnershipTransferred(address(0), owner_);
    }

    function reward(address to, uint256 amount, bytes32 eventId) external onlyOwner whenNotPaused {
        require(to != address(0), "zero recipient");
        require(amount > 0, "zero amount");
        require(!processed[eventId], "already processed");

        processed[eventId] = true;
        require(usdc.transfer(to, amount), "transfer failed");
        emit Rewarded(to, amount, eventId);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero new owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setPaused(bool isPaused) external onlyOwner {
        paused = isPaused;
        emit Paused(isPaused);
    }

    function recoverToken(address token, address to, uint256 amount) external onlyOwner {
        require(token != address(0), "zero token");
        require(to != address(0), "zero to");
        require(IERC20(token).transfer(to, amount), "recover failed");
        emit Recovered(token, to, amount);
    }
}
