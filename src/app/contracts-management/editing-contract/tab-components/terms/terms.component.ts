import { Component, OnInit, ChangeDetectionStrategy,  Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { ContractCkEditorFrontTermsConfig, ContractCkEditorBackTermsConfig } from '@constants/contract-ckeditor-config';
import { CKEditor4 } from 'ckeditor4-angular';

@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TermsComponent implements OnInit {
  @Input() termsFormGroup: FormGroup;
  @Input() public dialogHeightRef: any;

  public frontTermsConfig = ContractCkEditorFrontTermsConfig;
  public backTermsConfig = ContractCkEditorBackTermsConfig;

  constructor() {
  }

  ngOnInit(): void {
  }

}
