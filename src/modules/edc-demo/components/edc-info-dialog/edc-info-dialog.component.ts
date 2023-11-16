import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AppConfigService } from 'src/modules/app/app-config.service';

@Component({
  selector: 'app-edc-info-dialog',
  templateUrl: './edc-info-dialog.component.html',
  styleUrls: ['./edc-info-dialog.component.scss']
})
export class EdcInfoDialogComponent{

  protocolUrl:any=""
  constructor(public dialogRef: MatDialogRef<EdcInfoDialogComponent>,private appConfigService:AppConfigService){
    this.protocolUrl=this.appConfigService.getConfig()?.protocolUrl;
  }
 
}
