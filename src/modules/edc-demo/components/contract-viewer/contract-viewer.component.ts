import { Component, Inject, OnInit } from '@angular/core';
import {
  AssetService,
  ContractAgreementService,
  TransferProcessService
} from "../../../mgmt-api-client";
import { from, Observable, of } from "rxjs";
import { Asset, ContractAgreement, TransferProcessInput, IdResponse } from "../../../mgmt-api-client/model";
import { ContractOffer } from "../../models/contract-offer";
import { filter, first, map, switchMap, tap } from "rxjs/operators";
import { NotificationService } from "../../services/notification.service";
import {
  CatalogBrowserTransferDialog
} from "../catalog-browser-transfer-dialog/catalog-browser-transfer-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { CatalogBrowserService } from "../../services/catalog-browser.service";
import { Router } from "@angular/router";
import { TransferProcessStates } from "../../models/transfer-process-states";
import { DataFetchDialogComponent } from '../data-fetch-dialog/data-fetch-dialog.component';
import { AppConfigService } from 'src/modules/app/app-config.service';

interface RunningTransferProcess {
  processId: string;
  contractId: string;
  state: TransferProcessStates;
}

@Component({
  selector: 'app-contract-viewer',
  templateUrl: './contract-viewer.component.html',
  styleUrls: ['./contract-viewer.component.scss']
})
export class ContractViewerComponent implements OnInit {

  contracts$: Observable<ContractAgreement[]> = of([]);
  private runningTransfers: RunningTransferProcess[] = [];
  private pollingHandleTransfer?: any;
  authToken:any;
  responseData:any;
  index:any;
  buttonName:string="Transfer";
  fetchAccess: boolean[] = [];
  transferAccess: boolean[] = [];

  constructor(private contractAgreementService: ContractAgreementService,
    private assetService: AssetService,
    public dialog: MatDialog,
    @Inject('HOME_CONNECTOR_STORAGE_ACCOUNT') private homeConnectorStorageAccount: string,
    private transferService: TransferProcessService,
    private catalogService: CatalogBrowserService,
    private appConfigService:AppConfigService,
    private router: Router,
    private notificationService: NotificationService) {
  }

  private static isFinishedState(state: string): boolean {
    return [
      "COMPLETED",
      "STARTED",
      "ERROR",
      "ENDED"].includes(state);
  }

  ngOnInit(): void {
    this.contracts$ = this.contractAgreementService.queryAllAgreements();
  }

  asDate(epochSeconds?: number): string {
    if (epochSeconds) {
      const d = new Date(0);
      d.setUTCSeconds(epochSeconds);
      return d.toLocaleDateString();
    }
    return '';
  }

  onTransferClicked(contract: ContractAgreement,i:any ) {
    // const dialogRef = this.dialog.open(CatalogBrowserTransferDialog);

    // dialogRef.afterClosed().pipe(first()).subscribe(result => {
    //   const storageTypeId: string = result.storageTypeId;
    //   if (storageTypeId !== 'AzureStorage') {
    //     this.notificationService.showError("Only storage type \"AzureStorage\" is implemented currently!")
    //     return;
    //   }
    this.index = i;
      if(this.buttonName=="Fetch Data"){
        this.fetchData();
      }
      else{
        this.createTransferRequest(contract)
        .pipe(switchMap(trq => this.transferService.initiateTransfer(trq)))
        .subscribe(transferId => {
          this.startPolling(transferId, contract["@id"]!);
        }, error => {
          console.error(error);
          this.notificationService.showError("Error initiating transfer");
        });
      }
    // });
  }

  isTransferInProgress(contractId: string): boolean {
    return !!this.runningTransfers.find(rt => rt.contractId === contractId);
  }

  private createTransferRequest(contract: ContractAgreement): Observable<TransferProcessInput> {
    return this.getContractOfferForAssetId(contract.assetId!).pipe(map((contractOffer:any) => {

      const iniateTransfer: any = {
        assetId: contractOffer.assetId,
        connectorAddress: contractOffer.originator,

        connectorId: this.appConfigService.getConfig()?.connectorId, //doesn't matter, but cannot be null
        contractId: contract.id,
        dataDestination: {
          "type": "HttpProxy" // CAUTION: hardcoded value for AzureBlob
          // container: omitted, so it will be auto-assigned by the EDC runtime
        },
        // managedResources: false,
        privateProperties: {
          "receiverHttpEndpoint": "http://172.28.18.215:5000/receive"
        },
        // protocol: "dataspace-protocol-http"
        // transferType: {
        //   "contentType": "application/octet-stream",
        //   "isFinite": true
        // }
      };

      return iniateTransfer;
    }));

  }
  getCatalogUrl():string {
    let catalogUrl = localStorage.getItem("catalogUrl")
    if (catalogUrl !== null) {
      return catalogUrl
    } else {
  
      return "";
    }
  }
  /**
   * This method is used to obtain that URL of the connector that is offering a particular asset from the catalog.
   * This is a bit of a hack, because currently there is no "clean" way to get the counter-party's URL for a ContractAgreement.
   *
   * @param assetId Asset ID of the asset that is associated with the contract.Observable<ContractOffer>
   */
  private getContractOfferForAssetId(assetId: string):  any{
    // return Observable.toString("");

    return this.catalogService.getContractOffers(this.getCatalogUrl())
      .pipe(
        map(offers => offers.find(o => o.assetId === assetId)),
        map(o => {
          if (o) return o;
          else throw new Error(`No offer found for asset ID ${assetId}`);
        }))
  }

  private startPolling(transferProcessId: IdResponse, contractId: string) {
    // track this transfer process
    this.runningTransfers.push({
      processId: transferProcessId.id!,
      state: TransferProcessStates.REQUESTED,
      contractId: contractId
    });

    if (!this.pollingHandleTransfer) {
      this.pollingHandleTransfer = setInterval(this.pollRunningTransfers(), 1000);
    }

  }
  private pollRunningTransfer() {
    return () => {
      const isFinishedState = [
        "STARTED",
        "COMPLETED",
        "ERROR",
        "ENDED"];
      for (const t of this.runningTransfers.values()) {
        this.transferService.getTransferProcessState(t.processId).subscribe((tpDto: any) => {
          if (isFinishedState.includes((tpDto['edc:state']))) {
            if (tpDto['edc:state'] === "STARTED"|| tpDto['edc:state'] === "COMPLETED") {
              this.runningTransfers = this.runningTransfers.filter(rtp => rtp.processId !== tpDto['@id']);
              // this.transferAccess[this.index] = false;
              // this.fetchAccess[this.index] = true;
              this.notificationService.showInfo(`Transfer complete!`);
              this.transferService.getAuthToken().subscribe((res: any) => {
                 this.authToken = res.authCode;
                //  this.loaderService.hide();
              }, error => {
                this.notificationService.showError(error);
                // this.loaderService.hide();
              });
            }
          }
          // clear interval if necessary
          if (this.runningTransfers.length === 0) {
            clearInterval(this.pollingHandleTransfer);
            this.pollingHandleTransfer = undefined;
          }
        }, error => {
          this.notificationService.showError(error);
          // this.loaderService.hide();
        })
      }
    }
  }
  private pollRunningTransfers() {
    return () => {
      from(this.runningTransfers) //create from array
        .pipe(switchMap(runningTransferProcess => this.catalogService.getTransferProcessesById(runningTransferProcess.processId)), // fetch from API
          filter(transferprocess => ContractViewerComponent.isFinishedState(transferprocess.state!)), // only use finished ones
          tap(transferProcess => {
            this.runningTransfers = this.runningTransfers.filter(rtp => rtp.processId !== transferProcess.id)
            this.notificationService.showInfo(`Transfer [${transferProcess.id}] complete!`, "Show me!", () => {
              
            })
            // this.buttonName="Fetch Data"
            this.transferAccess[this.index] = false;
            this.fetchAccess[this.index] = true;
            this.transferService.getAuthToken().subscribe((res: any) => {
              this.authToken = res.authCode;
           }, error => {
             this.notificationService.showError(error);
           });
          }),
        ).subscribe(() => {
          // clear interval if necessary
          if (this.runningTransfers.length === 0) {
            clearInterval(this.pollingHandleTransfer);
            this.pollingHandleTransfer = undefined;
          }
        }, error => this.notificationService.showError(error))
    }

  }
  fetchData() {
    this.transferService.fetchData(this.authToken).subscribe((res: any) => {
     this.responseData = res;
     console.log("data:",res)
    //  this.initiateBIMSTransfer();
     const dialogRef = this.dialog.open(DataFetchDialogComponent, {maxWidth: "100%", data: this.responseData});
     dialogRef.afterClosed().pipe(first()).subscribe(result => {

     });
    }, error => {
      console.error(error);
      this.notificationService.showError("Error initiating transfer");
    });
  }

}
