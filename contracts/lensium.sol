// SPDX-License-Identifier:MIT
pragma solidity ^0.8.0;
contract lensium {
    mapping (address => uint)limitCounter;
    function limitTracker() public {
        limitCounter[msg.sender]++;
    }
    function checkLimit()public view {
        require (limitCounter[msg.sender] <= 10,"limit reached"); 
    }
}
