// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title YieldHunterSubscription
 * @dev Handles subscriptions for the YieldHunter platform
 */
contract YieldHunterSubscription {
    address public owner;
    uint256 public subscriptionFee;
    
    // Track subscribed users
    mapping(address => bool) public subscribers;
    
    // Events
    event SubscriptionPurchased(address indexed user, uint256 amount);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event FundsWithdrawn(address to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor(uint256 _fee) {
        owner = msg.sender;
        subscriptionFee = _fee; // Fee is in wei
    }

    /**
     * @dev Purchase a subscription to YieldHunter
     */
    function subscribe() external payable {
        require(!subscribers[msg.sender], "Already subscribed");
        require(msg.value >= subscriptionFee, "Insufficient payment");
        
        subscribers[msg.sender] = true;
        
        // Refund excess payment if any
        uint256 excess = msg.value - subscriptionFee;
        if (excess > 0) {
            payable(msg.sender).transfer(excess);
        }
        
        emit SubscriptionPurchased(msg.sender, subscriptionFee);
    }

    /**
     * @dev Check if an address is subscribed
     */
    function isSubscribed(address user) external view returns (bool) {
        return subscribers[user];
    }

    /**
     * @dev Update the subscription fee (only owner)
     */
    function updateSubscriptionFee(uint256 _newFee) external onlyOwner {
        emit FeeUpdated(subscriptionFee, _newFee);
        subscriptionFee = _newFee;
    }

    /**
     * @dev Withdraw funds from the contract (only owner)
     */
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        payable(owner).transfer(balance);
        emit FundsWithdrawn(owner, balance);
    }

    /**
     * @dev Transfer ownership of the contract
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}