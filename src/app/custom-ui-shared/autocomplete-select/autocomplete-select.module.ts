import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { SharedFunctionsModule } from '@shared/shared-functions.module';
import { SharedModule } from '@shared/shared.module';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AutocompleteSelectComponent } from './autocomplete-select.component';

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
    MatTooltipModule
  ],
  declarations: [AutocompleteSelectComponent],
  exports: [AutocompleteSelectComponent]
})
export class AutocompleteSelectModule {}
