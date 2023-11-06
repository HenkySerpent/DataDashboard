import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CatalogBrowserService } from "../../services/catalog-browser.service";
import { NotificationService } from "../../services/notification.service";
import { Router } from "@angular/router";
import { TransferProcessStates } from "../../models/transfer-process-states";
import { ContractOffer } from "../../models/contract-offer";
import { NegotiationResult } from "../../models/negotiation-result";
import { ContractNegotiation, ContractNegotiationRequest } from "../../../mgmt-api-client/model";
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

interface RunningTransferProcess {
  processId: string;
  assetId?: string;
  state: TransferProcessStates;
}

@Component({
  selector: 'edc-demo-catalog-browser',
  templateUrl: './catalog-browser.component.html',
  styleUrls: ['./catalog-browser.component.scss']
})
export class CatalogBrowserComponent implements OnInit {

  filteredContractOffers$: Observable<ContractOffer[]> = of([]);
  searchText = '';
  selectedCatalog: string = "";
  catalogCtrl = new FormControl();
  catalogs: string[] = ['http://tx-plato-controlplane:8084/api/v1/dsp', 'http://tx-nissan-controlplane:8084/api/v1/dsp', 'http://tx-sokrates-controlplane:8084/api/v1/dsp'];
  runningTransferProcesses: RunningTransferProcess[] = [];
  runningNegotiations: Map<string, NegotiationResult> = new Map<string, NegotiationResult>(); // contractOfferId, NegotiationResult
  finishedNegotiations: Map<string, ContractNegotiation> = new Map<string, ContractNegotiation>(); // contractOfferId, contractAgreementId
  private fetch$ = new BehaviorSubject(null);
  private pollingHandleNegotiation?: any;

  constructor(private apiService: CatalogBrowserService,
    public dialog: MatDialog,
    private router: Router,
    private notificationService: NotificationService,
    @Inject('HOME_CONNECTOR_STORAGE_ACCOUNT') private homeConnectorStorageAccount: string) {
  }

  ngOnInit(): void {


  }
  onCatalogSelect(event: MatAutocompleteSelectedEvent): void {
    // Handle the selection of existing options here
    // For this example, we'll just log the selected value
    console.log('Selected:', event.option.viewValue);
    this.selectedCatalog = event.option.viewValue
    localStorage.setItem("catalogUrl", event.option.viewValue)
    this.filteredContractOffers$ = this.fetch$
    .pipe(
      switchMap(() => {
        const contractOffers$ = this.apiService.getContractOffers(this.selectedCatalog);
        console.log(contractOffers$)
        return !!this.searchText ?
          contractOffers$.pipe(map(contractOffers => contractOffers.filter(contractOffer => contractOffer.assetId.toLowerCase().includes(this.searchText))))
          :contractOffers$;

      }));
  }
  onSearch() {
    this.fetch$.next(null);
  }
  addCatalog(): void {
    const customOption = this.catalogCtrl.value.trim();

    if (customOption && !this.catalogs.includes(customOption)) {
      this.catalogs.push(customOption);
      this.catalogCtrl.setValue('');
    }
  }
  getCatalogUrl():string {
    let catalogUrl = localStorage.getItem("catalogUrl")
    if (catalogUrl !== null) {
      return catalogUrl
    } else {
  
      return "";
    }
  }

onNegotiateClicked(contractOffer: ContractOffer) {
  // debugger
  const initiateRequest: ContractNegotiationRequest = {
    // connectorAddress: contractOffer.originator,
    connectorAddress: this.getCatalogUrl(),

    offer: {
      offerId: contractOffer.id,
      assetId: contractOffer.assetId,
      policy: contractOffer.policy,
    },
    connectorId: 'BPNL0000000PLATO',
    providerId: contractOffer["dcat:service"].id
  };

  const finishedNegotiationStates = [
    "VERIFIED",
    "TERMINATED",
    "ERROR"];

  this.apiService.initiateNegotiation(initiateRequest).subscribe(negotiationId => {
    this.finishedNegotiations.delete(initiateRequest.offer.offerId);
    this.runningNegotiations.set(initiateRequest.offer.offerId, {
      id: negotiationId,
      offerId: initiateRequest.offer.offerId
    });

    if (!this.pollingHandleNegotiation) {
      // there are no active negotiations
      this.pollingHandleNegotiation = setInterval(() => {
        // const finishedNegotiations: NegotiationResult[] = [];

        for (const negotiation of this.runningNegotiations.values()) {
          this.apiService.getNegotiationState(negotiation.id).subscribe(updatedNegotiation => {
            if (finishedNegotiationStates.includes(updatedNegotiation.state!)) {
              let offerId = negotiation.offerId;
              this.runningNegotiations.delete(offerId);
              if (updatedNegotiation["edc:state"] === "VERIFIED") {
                this.finishedNegotiations.set(offerId, updatedNegotiation);
                this.notificationService.showInfo("Contract Negotiation complete!", "Show me!", () => {
                  this.router.navigate(['/contracts'])
                })
              }
            }

            if (this.runningNegotiations.size === 0) {
              clearInterval(this.pollingHandleNegotiation);
              this.pollingHandleNegotiation = undefined;
            }
          });
        }
      }, 1000);
    }
  }, error => {
    console.error(error);
    this.notificationService.showError("Error starting negotiation");
  });
}

isBusy(contractOffer: ContractOffer) {
  return this.runningNegotiations.get(contractOffer.id) !== undefined || !!this.runningTransferProcesses.find(tp => tp.assetId === contractOffer.assetId);
}

getState(contractOffer: ContractOffer): string {
  const transferProcess = this.runningTransferProcesses.find(tp => tp.assetId === contractOffer.assetId);
  if (transferProcess) {
    return TransferProcessStates[transferProcess.state];
  }

  const negotiation = this.runningNegotiations.get(contractOffer.id);
  if (negotiation) {
    return 'negotiating';
  }

  return '';
}

isNegotiated(contractOffer: ContractOffer) {
  return this.finishedNegotiations.get(contractOffer.id) !== undefined;
}

}
