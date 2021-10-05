import { Directive, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2 } from '@angular/core';

@Directive({
  selector: '[color-picker]'
})
export class ColorPickerDirective implements OnInit {
  @Input() defaultColor: string;
  @Input() textBoxId: string;
  @Output() onColorChange = new EventEmitter();
  constructor(private el: ElementRef, private r: Renderer2) {}
  ngOnInit() {
    const ele = $(this.el.nativeElement);
    const id = ele.attr('id');
    const textBoxId = this.textBoxId;
    const self = this;
    $('#' + textBoxId).hide();
    const options = {
      livePreview: true,
      color: this.defaultColor,
      onSubmit: function(hsb, hex, rgb, el) {
        $('#' + textBoxId).focus();
        // browser.executeScript('1+1');
        self.onColorChange.emit('#' + hex);
        // document.getElementById(textBoxId).value = '#' + hex;
        $(el).css('backgroundColor', '#' + hex);
        $('#' + textBoxId).val('#' + hex);
        $(el).ColorPickerHide();
      }
    };
    $('#' + id).ColorPicker(options);
    // this.r.setElementStyle(this.el.nativeElement, 'display', 'none');
  }
}
