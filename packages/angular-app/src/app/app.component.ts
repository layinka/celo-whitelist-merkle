import {Component} from '@angular/core';
import {Web3Service} from "./services/contract/web3.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  authenticated: boolean = false;
  accounts: any[] | undefined;
  balance: string | undefined;


  constructor(
    private web3: Web3Service) {
  }

  async ngOnInit(){
    await this.Connect();
  }


  async Connect() {
    let accounts = await this.web3.connectAccount();
    console.log('Account: ', accounts);
    this.accounts = accounts;
      
    this.balance =  await this.web3.accountInfo(this.accounts![0]);
  }

}
