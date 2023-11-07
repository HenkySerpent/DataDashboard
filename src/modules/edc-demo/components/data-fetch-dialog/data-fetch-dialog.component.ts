import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import { JsonPipe } from '@angular/common';


@Component({
  selector: 'app-data-fetch-dialog',
  templateUrl: './data-fetch-dialog.component.html',
  styleUrls: ['./data-fetch-dialog.component.scss']
})
export class DataFetchDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<DataFetchDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit(): void {
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  onConfirm() {
    this.dialogRef.close(true);
  }
}

