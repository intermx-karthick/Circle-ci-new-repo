import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-vendors',
  templateUrl: './vendors.component.html',
  styleUrls: ['./vendors.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VendorsComponent implements OnInit {

  testForm: FormGroup;

  constructor(
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.testForm = this.fb.group({
      usAddress: [null],
      shippingAddress: [null],
      intAddress: [null]
    });
  }

}
