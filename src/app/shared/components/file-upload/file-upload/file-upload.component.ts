import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { FileUploadAbstract } from '../file-upload-abstract';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileUploadComponent extends FileUploadAbstract implements OnInit {
  constructor(public cdRef: ChangeDetectorRef) {
    super(cdRef);
  }
  ngOnInit(): void {
    this.clearAttachment$?.subscribe((flag) => {
      if (flag) {
        this.clearAttachment();
      }
    });
  }
}
