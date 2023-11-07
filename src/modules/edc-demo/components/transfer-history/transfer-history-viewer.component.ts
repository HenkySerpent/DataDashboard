import {Component, OnInit} from '@angular/core';
import {Observable, of} from 'rxjs';
import {TransferProcessService} from "../../../mgmt-api-client";
import {TransferProcess} from "../../../mgmt-api-client/model";
import {AppConfigService} from "../../../app/app-config.service";
import {ConfirmationDialogComponent, ConfirmDialogModel} from "../confirmation-dialog/confirmation-dialog.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'edc-demo-transfer-history',
  templateUrl: './transfer-history-viewer.component.html',
  styleUrls: ['./transfer-history-viewer.component.scss']
})
export class TransferHistoryViewerComponent implements OnInit {

  columns: string[] = ['id', 'state', 'connectorId', 'assetId', 'contractId'];
  transferProcesses$: Observable<any[]> = of([]);
  storageExplorerLinkTemplate: string | undefined;
  transfers: any[] = [];
  history:any[]=[];

  constructor(private transferProcessService: TransferProcessService,
              private dialog : MatDialog,
              private appConfigService: AppConfigService) {
  }

  ngOnInit(): void {
    this.loadTransferProcesses();
    
    // this.storageExplorerLinkTemplate = this.appConfigService.getConfig()?.storageExplorerLinkTemplate
  }

  onDeprovision(transferProcess: TransferProcess): void {

    const dialogData = new ConfirmDialogModel("Confirm deprovision", `Deprovisioning resources for transfer [${transferProcess["@id"]}] will take some time and once started, it cannot be stopped.`)
    dialogData.confirmColor = "warn";
    dialogData.confirmText = "Confirm";
    dialogData.cancelText = "Abort";
    const ref = this.dialog.open(ConfirmationDialogComponent, {maxWidth: '20%', data: dialogData});

    ref.afterClosed().subscribe(res => {
      if (res) {
       this.transferProcessService.deprovisionTransferProcess(transferProcess["@id"]!).subscribe(() => this.loadTransferProcesses());
      }
    });
  }

  showStorageExplorerLink(transferProcess: TransferProcess) {
    return transferProcess.dataDestination?.properties?.type === 'AzureStorage' && transferProcess.state === 'COMPLETED';
  }

  showDeprovisionButton(transferProcess: TransferProcess) {
    return ['COMPLETED', 'PROVISIONED', 'REQUESTED', 'REQUESTED_ACK', 'IN_PROGRESS', 'STREAMING'].includes(transferProcess.state!);
  }

  loadTransferProcesses() {
     this.transferProcesses$ = this.transferProcessService.queryAllTransferProcesses();

     this.transferProcesses$.subscribe(res=> {
      this.history=res
      console.log("history:",this.history)}
      )
      console.log("hiostory:",this.history)
      this.transfers= this.history.map(this.convertToObject)
      console.log("transformed:",this.transfers)
    //  this.transferProcesses$.subscribe(res=> console.log(this.convertJsonToTransferProcess(res)))
    //  this.transferProcesses$.subscribe(res=> console.log((res)))


  }

  asDate(epochMillis?: number) {
    return epochMillis ? new Date(epochMillis).toLocaleDateString() : '';
  }
  convertToObject(transferObject:any) {
    let transferProcess :any={};
    debugger
    transferProcess.id = transferObject.id;
    transferProcess.type = transferObject.type;
    transferProcess.assetId = transferObject.assetId;
    transferProcess.connectorId = transferObject.connectorId;
    transferProcess.contractId = transferObject.contractId;
    transferProcess.correlationId = transferObject.correlationId;
    transferProcess.state = transferObject.state;
    transferProcess.createdAt = transferObject.createdAt;
    debugger
    // this.transfers.push(transferProcess)
    
    // Handle dataDestination
    const dataDestinationObject = transferObject["https://w3id.org/edc/v0.0.1/ns/dataDestination"][0];
    // const dataAddress = new DataAddress();
    // dataAddress.type = dataDestinationObject["https://w3id.org/edc/v0.0.1/ns/type"][0]["@value"];
    // You may need to set other properties of the dataAddress object here.
    // transferProcess.dataDestination = dataAddress;
    
    // Handle privateProperties
    // const privatePropertiesObject = transferObject["your-private-properties-field"];
    // You may need to set the private properties on the transferProcess object.
    
    return transferProcess;
  }
   convertJsonToTransferProcess(transferObject:any) {
    let transferProcess :any={};
    debugger
    transferProcess["id"] = transferObject["@id"];
    transferProcess.type = transferObject["@type"][0];
    transferProcess.assetId = transferObject["https://w3id.org/edc/v0.0.1/ns/assetId"][0]["@value"];
    transferProcess.connectorId = transferObject["https://w3id.org/edc/v0.0.1/ns/connectorId"][0]["@value"];
    transferProcess.contractId = transferObject["https://w3id.org/edc/v0.0.1/ns/contractId"][0]["@value"];
    transferProcess.correlationId = transferObject["https://w3id.org/edc/v0.0.1/ns/correlationId"][0]["@value"];
    transferProcess.state = transferObject["https://w3id.org/edc/v0.0.1/ns/state"][0]["@value"];
    transferProcess.createdAt = transferObject["https://w3id.org/edc/v0.0.1/ns/stateTimestamp"][0]["@value"];
    debugger
    this.transfers.push(transferProcess)
    
    // Handle dataDestination
    const dataDestinationObject = transferObject["https://w3id.org/edc/v0.0.1/ns/dataDestination"][0];
    // const dataAddress = new DataAddress();
    // dataAddress.type = dataDestinationObject["https://w3id.org/edc/v0.0.1/ns/type"][0]["@value"];
    // You may need to set other properties of the dataAddress object here.
    // transferProcess.dataDestination = dataAddress;
    
    // Handle privateProperties
    // const privatePropertiesObject = transferObject["your-private-properties-field"];
    // You may need to set the private properties on the transferProcess object.
    
    return transferProcess;
  }
}
