import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColorPaletteComponent } from './color-palette/color-palette.component';
import { ColorPickerComponent } from './color-picker.component';
import { ColorSliderComponent } from './color-slider/color-slider.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [
    ColorPickerComponent,
    ColorPaletteComponent,
    ColorSliderComponent
  ],
  exports: [
    ColorPickerComponent
  ]
})
export class ColorPickerModule {}
