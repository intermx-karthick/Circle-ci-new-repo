import { Component, Input, EventEmitter, Output, OnInit } from '@angular/core';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.less']
})
export class ColorPickerComponent implements OnInit {
  @Input() inputLabel: string;
  @Input() appColor: string;
  @Output() appColorChange: EventEmitter<string> = new EventEmitter();
  @Output() appColorClose: EventEmitter<boolean> = new EventEmitter();
  public hue: string;
  public color: string;
  public inputColor: string;

  constructor() {

  }

  ngOnInit() {
    this.hue = this.appColor;
    this.color = this.appColor;
    this.inputColor = this.appColor.slice(1);
  }
  onChange(color) {
    this.color = color;
    this.inputColor = color.slice(1);
    this.appColorChange.emit(color);
  }
  onChangeColor(color) {
    this.hue = '#' + color;
    if (color.length === 6) {
      this.appColorChange.emit(this.hue);
    }
  }
  onClose() {
    this.appColorClose.emit(true);
  }

}
