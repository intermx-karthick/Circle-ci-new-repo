import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedFunctionsModule } from '@shared/shared-functions.module';
import { SharedModule } from '@shared/shared.module';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { MultiselectDropdownComponent } from './multiselect-dropdown.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatInputModule,
    MatIconModule,
    MatOptionModule,
    InfiniteScrollModule,
    SharedModule,
    SharedFunctionsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  declarations: [MultiselectDropdownComponent],
  exports: [MultiselectDropdownComponent]
})
export class MultiselectDropdownModule {}
