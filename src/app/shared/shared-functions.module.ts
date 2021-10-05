import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TruncatePipe } from './pipes/truncate.pipe';
import { GeoKeysPipe } from './../explore/pipes/geo-keys.pipe';
import { ConvertPipe } from './pipes/convert.pipe';
import { IMXHighlightPipe } from './pipes/highlight.pipe';
import { UnderscoreToTitlePipe } from './pipes/underscore-to-title.pipe';
import { SearchDirective } from './directives/search.directive';
import { ChipsInputAutoCompleteComponent } from './components/chips-input-auto-complete/chips-input-auto-complete.component';
import { ChipsInputGroupAutoCompleteComponent } from './components/chips-input-group-auto-complete/chips-input-group-auto-complete.component';
import { ImxMaterialModule } from 'app/imx-material/imx-material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { GeographySetsListComponent } from '@shared/components/geography-sets-list/geography-sets-list.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { MapLegendsComponent } from './components/map-legends/map-legends.component';
import { PortalModule } from '@angular/cdk/portal';
import { ImageUrlPipe } from './pipes/image-url-pipe/image-url.pipe';
import { ContentLoaderModule } from '@ngneat/content-loader';
import * as contentLoader from './components/content-loaders';
import { NumberOnlyDirective } from './directives/number-only.directive';
import { DateFormatDirective } from './directives/date-format.directive';
import { TooltipV2Directive } from './directives/tooltip-new.directive';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    InfiniteScrollModule,
    ImxMaterialModule,
    ContentLoaderModule,
  ],
  declarations: [
    TruncatePipe,
    GeoKeysPipe,
    ConvertPipe,
    IMXHighlightPipe,
    SearchDirective,
    ChipsInputAutoCompleteComponent,
    ChipsInputGroupAutoCompleteComponent,
    GeographySetsListComponent,
    MapLegendsComponent,
    UnderscoreToTitlePipe,
    ImageUrlPipe,
    ...contentLoader.components,
    NumberOnlyDirective,
    DateFormatDirective,
    TooltipV2Directive,
  ],
  exports: [
    TruncatePipe,
    GeoKeysPipe,
    ConvertPipe,
    IMXHighlightPipe,
    SearchDirective,
    ChipsInputAutoCompleteComponent,
    ChipsInputGroupAutoCompleteComponent,
    GeographySetsListComponent,
    MapLegendsComponent,
    PortalModule,
    UnderscoreToTitlePipe,
    ImageUrlPipe,
    ContentLoaderModule,
    ...contentLoader.components,
    NumberOnlyDirective,
    DateFormatDirective,
    TooltipV2Directive,
  ],
  providers: [
    ConvertPipe,
    UnderscoreToTitlePipe
  ]
})
export class SharedFunctionsModule { }
