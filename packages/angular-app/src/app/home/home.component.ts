import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Web3Service } from '../services/contract/web3.service';
import {ethers} from 'ethers';
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

const AirdropperABI = require('../../assets/AirDropper.json');
const ERC20ABI = require('../../assets/ERC20.json');
const REWARDS = require('../../assets/rewards.json');

const tokenAddress= '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const airdropperContractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  hasClaimed=false;
  public address: string = ""; 
  
  account: any;
  airdropperContract: undefined|any;
  claimableBalance: number = 0;
  tokenBalance: number = 0;

  merkleTree: any;


  constructor(private web3Service:Web3Service, private router:Router) { 
    // this.tokens = tokens as Token[];

  }

  ngOnInit(): void {
    setTimeout(async ()=>{
      
      //Wire Merkle tree
      const leafNodes = REWARDS.map((i,ix) => { 
        const packed = this.web3Service.web3js.utils.encodePacked(
          {value: i.address, type: 'address'},
          {value: this.toWei(i.balance).toString(), type: 'uint256'}
        ); 
        // return keccak256(i, toWei(ix));
        return keccak256(packed);        
      })
      
      // Generate merkleTree from leafNodes
      this.merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
      // Get root hash from merkle tree
      const rootHash = this.merkleTree.getRoot();
      // console.log('rootHash: ', rootHash);

      this.airdropperContract = new this.web3Service.web3js!.eth.Contract(AirdropperABI,airdropperContractAddress);  

      if(this.web3Service.accounts){
        this.account = this.web3Service.accounts[0];
        this.hasClaimed = await this.airdropperContract.methods.hasClaimed().call({from: this.account});
        // reload
        this.loadBalances();
      }

      

    }, 3500)
  }


  public async getClaimableBalance(): Promise<number> {
    const address = this.account;
    const reward = REWARDS.filter(f=>f.address.toLowerCase()==address.toLowerCase());  
    if(reward && reward.length >0){
      return reward[0].balance;
    }  
    return 0;
  }

  public async getTokenBalance(tokenAddress: string){
    const tokenContract = new this.web3Service.web3js!.eth.Contract(ERC20ABI,tokenAddress) ;    
    const balance = await tokenContract.methods.balanceOf(this.account).call();

    return +this.web3Service.web3js!.utils.fromWei(balance , 'ether')
  }

  async claim(){
    const result = await this._claim();
    if(result=='succeeded'){
      alert('Your Tokens has been Claimed');
    }else{
      alert('FAIL! Withdrawal failed.');
    }
    this.hasClaimed = await  this.airdropperContract.methods.hasClaimed().call({from: this.account});
    // reload
    this.loadBalances();
  }

  async loadBalances(){
    // reload
    this.claimableBalance = await this.getClaimableBalance();      
    this.tokenBalance = await this.getTokenBalance(tokenAddress);
  }

  async _claim() {
    
    const contract = this.airdropperContract;  
    try{
      const claimable = await this.getClaimableBalance();
      const packed = this.web3Service.web3js.utils.encodePacked(
        {value: this.account, type: 'address'},
        {value: this.toWei(claimable).toString(), type: 'uint256'}
      );
      const proof = this.merkleTree.getHexProof(keccak256(packed));

      await contract.methods.claim(proof, this.toWei(claimable)).send({from: this.account});
      return 'succeeded' ;
    }catch(err){
      return 'failed';
    }    
  }


  toWei(amount: any){
    return this.web3Service.web3js!.utils.toWei(amount.toString() , 'ether');
  }

}
