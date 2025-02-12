import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from '@angular/common/http';
import {Inject, Injectable} from '@angular/core';
import {EMPTY, Observable} from 'rxjs';
import {catchError, map, reduce} from 'rxjs/operators';
import {Catalog} from '../models/catalog';
import {ContractOffer} from '../models/contract-offer';
import {
  ContractNegotiationService,
  TransferProcessService,
} from "../../mgmt-api-client";
import {CONNECTOR_CATALOG_API, CONNECTOR_MANAGEMENT_API} from "../../app/variables";
// import TypeEnum = Policy.TypeEnum; //TODO Use TypeEnum https://github.com/Think-iT-Labs/edc-connector-client/issues/103
import {
  ContractNegotiationRequest,
  ContractNegotiation,
  PolicyInput,
  TransferProcess,
  TransferProcessInput
} from "../../mgmt-api-client/model";



/**
 * Combines several services that are used from the {@link CatalogBrowserComponent}
 */
@Injectable({
  providedIn: 'root'
})
export class CatalogBrowserService {

  constructor(private httpClient: HttpClient,
              private transferProcessService: TransferProcessService,
              private negotiationService: ContractNegotiationService,
              @Inject(CONNECTOR_MANAGEMENT_API) private managementApiUrl: string,
              @Inject(CONNECTOR_CATALOG_API) private catalogApiUrl: string) {
  }

  getContractOffers(): Observable<ContractOffer[]> {
    let url = this.catalogApiUrl || this.managementApiUrl;
    // return this.post<Catalog[]>(url + "/federatedcatalog")
    return this.post<Catalog[]>(url + "/v2/catalog/request")
      .pipe(map((catalog: any) => {
        const arr = Array<ContractOffer>();
        let datasets = catalog["dcat:dataset"];
        if (!Array.isArray(datasets)) {
          datasets = [datasets];
        }

        for(let i = 0; i < datasets.length; i++) {
          const dataSet: any = datasets[i];
          const properties: { [key: string]: string; } = {
            id: dataSet["edc:id"],
            // name: dataSet["edc:name"],
            name: dataSet["@id"],
            version: dataSet["edc:version"],
            type: dataSet["edc:type"],
            contentType: dataSet["edc:contenttype"]
          }
          console.log(dataSet)
          const assetId = dataSet["@id"];

          const hasPolicy = dataSet["odrl:hasPolicy"];
          const policy: PolicyInput = {
            //currently hardcoded to SET since parsed type is {"@policytype": "set"}
            "@type": "set", //TODO Use TypeEnum https://github.com/Think-iT-Labs/edc-connector-client/issues/103
            "@context" : "http://www.w3.org/ns/odrl.jsonld",
            "uid": hasPolicy["@id"],
            "assignee": hasPolicy["assignee"],
            "assigner": hasPolicy["assigner"],
            "obligation": hasPolicy["odrl:obligations"],
            "permission": hasPolicy["odrl:permissions"],
            "prohibition": hasPolicy["odrl:prohibitions"],
            "target": hasPolicy["odrl:target"]
          };

          const newContractOffer: ContractOffer = {
            assetId: assetId,
            properties: properties,
            "dcat:service": catalog["dcat:service"],
            "dcat:dataset": datasets,
            // id: hasPolicy["@id"],
            id: Array.isArray(hasPolicy) ? hasPolicy[1]['@id'] : hasPolicy["@id"],
            // originator: catalog["edc:originator"]
            originator: catalog["dcat:service"]["dct:endpointUrl"],
            // policy: policy
            policy: hasPolicy[1]
          };

          arr.push(newContractOffer)
        }
        return arr;
      }));
  }

  initiateTransfer(transferRequest: TransferProcessInput): Observable<string> {
    return this.transferProcessService.initiateTransfer(transferRequest).pipe(map(t => t.id!))
  }

  getTransferProcessesById(id: string): Observable<TransferProcess> {
    return this.transferProcessService.getTransferProcess(id);
  }

  initiateNegotiation(initiate: ContractNegotiationRequest): Observable<string> {
    return this.negotiationService.initiateContractNegotiation(initiate).pipe(map(t => t.id!))
  }

  getNegotiationState(id: string): Observable<ContractNegotiation> {
    return this.negotiationService.getNegotiation(id);
  }

  private post<T>(urlPath: string,
                  params?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>; })
    : Observable<T> {
    const url = `${urlPath}`;

    let headers = new HttpHeaders({"Content-type": "application/json"});
    const payload = {
      "@context": {},
      "protocol": "dataspace-protocol-http",
      "providerUrl": "http://tx-plato-controlplane:8084/api/v1/dsp",
      "querySpec": {
        "offset": 0,
        "limit": 100,
        "filter": "",
        "range": {
          "from": 0,
          "to": 100
        },
        "criterion": ""
      }
    };
    
    return this.catchError(this.httpClient.post<T>(url, payload, { headers, params }), url, 'POST');
    
    // return this.catchError(this.httpClient.post<T>(url, "{\"edc:operandLeft\": \"\",\"edc:operandRight\": \"\",\"edc:operator\": \"\",\"edc:Criterion\":\"\"}", {headers, params}), url, 'POST');
    
    // return this.catchError(this.httpClient.post<T>(url, "{\"edc:operandLeft\": \"\",\"edc:operandRight\": \"\",\"edc:operator\": \"\",\"edc:Criterion\":\"\"}", {headers, params}), url, 'POST');
  }

  private catchError<T>(observable: Observable<T>, url: string, method: string): Observable<T> {
    return observable
      .pipe(
        catchError((httpErrorResponse: HttpErrorResponse) => {
          if (httpErrorResponse.error instanceof Error) {
            console.error(`Error accessing URL '${url}', Method: 'GET', Error: '${httpErrorResponse.error.message}'`);
          } else {
            console.error(`Unsuccessful status code accessing URL '${url}', Method: '${method}', StatusCode: '${httpErrorResponse.status}', Error: '${httpErrorResponse.error?.message}'`);
          }

          return EMPTY;
        }));
  }
}
