import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SharedFunctionsModule } from '@shared/shared-functions.module';
import { PhoneNumberInputComponent } from './phone-number-input.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    FlexLayoutModule,
    SharedFunctionsModule
  ],
  declarations: [PhoneNumberInputComponent],
  exports: [PhoneNumberInputComponent]
})
export class PhoneNumberInputModule {}
