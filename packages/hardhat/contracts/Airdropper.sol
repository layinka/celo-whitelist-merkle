// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AirDropper is Ownable, ReentrancyGuard {

    using SafeERC20 for IERC20;

    bytes32 public immutable root;
    address tokenAddress ;
    
    mapping(address => bool) claimed;

    constructor(bytes32 _root, address token) {
        root = _root;
        tokenAddress=token;
    }

    function hasClaimed() external view returns (bool) {
        return _hasClaimed(msg.sender);
    }
    // function hasClaimed(address user) external view returns (bool) {
    //     return _hasClaimed(user);
    // }

    function _hasClaimed(address user) private view  returns (bool) {
        return claimed[user];
    }

    function claim(bytes32[] calldata _proof, uint amount) external nonReentrant {
        address claimer = msg.sender;
        require(!claimed[claimer], "Already claimed air drop");
        claimed[claimer] = true;
        bytes32 _leaf = keccak256(abi.encodePacked(claimer, amount));
        require(
            MerkleProof.verify(_proof, root, _leaf),
            "Incorrect merkle proof"
        );

        require( IERC20(tokenAddress).balanceOf(address(this)) > amount, 'AIRDROP CLAIM: No PBTG token to release by airdropper');
        
        IERC20(tokenAddress).safeTransfer(claimer, amount);
    }

    

    // change owner and reward token
    function upToken(address t) public onlyOwner {
        tokenAddress = t;
    }

    function claimTokens(uint amount) public onlyOwner {
        require( IERC20(tokenAddress).balanceOf(address(this)) > amount, 'AIRDROP CLAIM: No PBTG token to release by airdropper');
        
        IERC20(tokenAddress).safeTransfer(msg.sender, amount);
    }
}
