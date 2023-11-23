import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ContractAgreement, ContractDefinition, PolicyDefinition } from '@think-it-labs/edc-connector-client';
import { Asset } from '@think-it-labs/edc-connector-client/dist/src/entities/asset';
import { Observable, map, of } from 'rxjs';
import { AppConfigService } from 'src/modules/app/app-config.service';
import { AssetService, ContractAgreementService, ContractDefinitionService, PolicyService, TransferProcessService } from 'src/modules/mgmt-api-client';

@Component({
  selector: 'edc-demo-introduction',
  templateUrl: './introduction.component.html',
  styleUrls: ['./introduction.component.scss']
})
export class IntroductionComponent implements OnInit {

  incomingTransfers: any[] = [];
  outgoingTransfers: any[] = [];
  protocolUrl:any=""
  dataOfferingCount$: Observable<number> = of(0);
  assetCount$: Observable<number> = of(0);
  policyCount$: Observable<number> = of(0);
  preconfiguredCatalogCount: number = 0;
  contractAgreementCount$: Observable<number> = of(0);
  columns: string[] = ['id', 'state', 'assetId'];
  isCopied: boolean = false;

  mockIncoming: any[] = [
    {
      id: '1',
      state: 'STARTED',
      connectorId: 'AESC',
      assetId: 'PCF_DATA'

    },
    {
      id: '2',
      state: 'FINISHED',
      connectorId: 'AESC',
      assetId: 'PCF_DATA'

    }
  ]
  constructor(private assetService: AssetService, private policyService: PolicyService, private transferProcessService: TransferProcessService,
    private contractDefinitionService: ContractDefinitionService, private contractAgreementService: ContractAgreementService,private appConfigService:AppConfigService,
    private router: Router) {
  }

  ngOnInit(): void {
    this.loadIncomingTransfers();
    this.loadOutgoingTransfers();
    this.protocolUrl=this.appConfigService.getConfig()?.protocolUrl
    this.assetCount$ = this.assetService.requestAssets().pipe(
      map((assetArray: Asset[]) => {
        return assetArray.length;
      })
    )

    this.policyCount$ = this.policyService.getAllPolicies().pipe(
      map((policies: PolicyDefinition[]) => {
        return policies.length;
      })
    )

    this.dataOfferingCount$ = this.contractDefinitionService.getAllContractDefinitions().pipe(
      map((contractDefinitions: ContractDefinition[]) => {
        return contractDefinitions.length;
      })
    )

    this.contractAgreementCount$ = this.contractAgreementService.queryAllAgreements().pipe(
      map((contractAgreements: ContractAgreement[]) => {
        return contractAgreements.length;
      })
    )



  }


  loadIncomingTransfers() {
    this.transferProcessService.queryAllTransferProcesses().subscribe(res => {
      // this.incomingTransfers=res.filter(process => process.consumerId !== this.appConfigService.getConfig()?.connectorId)
      this.incomingTransfers=res.filter(process => process.type !== 'PROVIDER')

      console.log("incoming:",this.incomingTransfers)});
  }
  loadOutgoingTransfers() {
    this.transferProcessService.queryAllTransferProcesses().subscribe(res => {
      this.outgoingTransfers=res.filter(process => process.type === 'PROVIDER')
      console.log("outgoing:",this.outgoingTransfers)});
  }

  routeTo(route:string){
    this.router.navigateByUrl(route);

  }

  changeText(){
    this.isCopied = true;
    setTimeout(()=>{
      this.isCopied =false;
    },5000)
  }
}
