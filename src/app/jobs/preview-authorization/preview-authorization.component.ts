import { Component, OnInit, ChangeDetectionStrategy, Optional, SkipSelf, Inject, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-preview-authorization',
  templateUrl: './preview-authorization.component.html',
  styleUrls: ['./preview-authorization.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewAuthorizationComponent implements OnInit {
  public panelContainer:any;
  public lineItemScroll;
  public containerBodyHeight:number;


  @ViewChild('scrollContainer', {read: ElementRef, static:false}) scrollContainer: ElementRef;

  constructor(
  public dialogRef: MatDialogRef<PreviewAuthorizationComponent>,
  @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public dialogData: any,
  private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // this.reSize();
    // this.loadLayoutStyles();
  }

  loadLayoutStyles() {
    // Header footer style comming from API
    document.getElementById('contract-preview-style')?.remove();
    const body = document.getElementsByTagName('body')[0];
    const style = document.createElement('style');
    style.id = 'contract-preview-style';
    style.type = 'text/css';
    style.media = 'all';
    // style.innerText = this.layout?.styles;
    body.appendChild(style);
    this.reSize();
    this.panelContainer = this.dialogRef['_containerInstance']['_elementRef'].nativeElement;
  }

  public reSize(){
    this.lineItemScroll = (this.scrollContainer?.nativeElement?.clientWidth - 40);
    this.containerBodyHeight = (this.dialogRef?.['_containerInstance']['_elementRef']['nativeElement']?.clientHeight - 50);

    this.cdRef.detectChanges();
  }
  downloadPDF() {

  }
  copyContract() {
    
  }
}
