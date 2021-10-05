import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-arrow-navigation',
  templateUrl: './arrow-navigation.component.html',
  styleUrls: ['./arrow-navigation.component.less']
})
export class ArrowNavigationComponent implements OnInit {
  @Input() option: any;
  @Input() selectedOption: any;
  @Output() setSelectedOption: EventEmitter<any> = new EventEmitter();
  @Output() submit: EventEmitter<any> = new EventEmitter();
  public isActive: boolean;
  constructor() { }

  ngOnInit() {
    this.isActive = false;
  }
  submitOption() {
    this.setSelectedOption.emit(this.option);
    this.submit.emit();
  }
  unSelectItem() {
    this.setSelectedOption.emit({});
  }
  setActive(val) {
    this.isActive = val;
    if (val) {
      this.setSelectedOption.emit(this.option);
    }
  }
  getLabel() {
    return this.option.name;
  }
}
