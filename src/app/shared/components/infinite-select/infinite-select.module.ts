import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfiniteSelectComponent } from './infinite-select.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ImxMaterialModule } from 'app/imx-material/imx-material.module';
import { SharedModule } from '@shared/shared.module';
import {InfiniteScrollModule} from 'ngx-infinite-scroll';

@NgModule({
  imports: [
    CommonModule,
    MatFormFieldModule,
    FormsModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    FlexLayoutModule,
    ImxMaterialModule,
    SharedModule,
    InfiniteScrollModule
  ],
  declarations: [InfiniteSelectComponent],
  exports: [InfiniteSelectComponent]
})
export class InfiniteSelectModule {}
