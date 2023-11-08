import { Component, Inject, OnInit } from '@angular/core';
import { AssetInput } from "@think-it-labs/edc-connector-client";
import { MatDialogRef } from "@angular/material/dialog";
import { StorageType } from "../../models/storage-type";


@Component({
  selector: 'edc-demo-asset-editor-dialog',
  templateUrl: './asset-editor-dialog.component.html',
  styleUrls: ['./asset-editor-dialog.component.scss']
})
export class AssetEditorDialog implements OnInit {

  id: string = '';
  version: string = '';
  name: string = '';
  contenttype: string = '';

  storageTypeId: string = 'HttpData';
  account: string = '';
  container: string = 'src-container';
  blobname: string = '';
  sourcePath:string = '';

  constructor(private dialogRef: MatDialogRef<AssetEditorDialog>,
      @Inject('STORAGE_TYPES') public storageTypes: StorageType[]) {
  }

  ngOnInit(): void {
  }
  // const assetEntryDto =
  // {
  //   "@context": {},
  //   "asset": {
  //     "@type": "Asset",
  //     "@id": this.id,
  //     "properties": {
  //       "description": this.name
  //     }
  //   },
  //   "dataAddress": {
  //     "@type": "DataAddress",
  //     "type": "HttpData",
  //     "baseUrl": this.sourcePath
  //   }
  // }
  onSave() {
    const assetInput: AssetInput = {
      "@id": this.id,
      properties: {
        "name": this.name,
        "version": this.version,
        "contenttype": this.contenttype,
      },
      dataAddress: {
        "type": this.storageTypeId,
        "baseUrl": this.sourcePath
        // "account": this.account,
        // "container": this.container,
        // "blobname": this.blobname,
        // "keyName": `${this.account}-key1`
      }
    };

    this.dialogRef.close({ assetInput });
  }
}
