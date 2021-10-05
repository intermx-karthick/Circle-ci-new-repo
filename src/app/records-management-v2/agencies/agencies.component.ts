import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-agencies',
  templateUrl: './agencies.component.html',
  styleUrls: ['./agencies.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgenciesComponent implements OnInit {

  testForm: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.testForm = this.fb.group({
      usAddress: [null],
      shippingAddress: [null],
      intAddress: [null]
    });
  }
}
