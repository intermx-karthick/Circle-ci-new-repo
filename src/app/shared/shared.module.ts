import { TelephoneInputComponent } from './components/telephone-input/telephone-input.component';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {InfiniteScrollModule} from 'ngx-infinite-scroll';
import {UserNavigationComponent} from './components/user-navigation/user-navigation.component';
import {RouterModule} from '@angular/router';

import {AuthenticateDirective} from './directives/authenticate.directive';
// import {CommonService} from '@shared/services/common.service';
import { ThemeService } from '@shared/services/theme.service';
import {ExploreService} from '@shared/services/explore.service';
import {LoaderService} from '@shared/services/loader.service';
import {TitleService} from '@shared/services/title.service';
import { InventoryService } from '@shared/services/inventory.service';
import { MatGridListModule } from '@angular/material/grid-list';
import {ShowErrorsComponent} from './components/show-errors/show-errors.component';
import { AutocompleteComponent } from './components/autocomplete/autocomplete.component';
//  Have to remove from shared to explore-workspaceave
// import {WorkSpaceService} from './services/work-space.service';
// --end
import {FormatService} from '@shared/services/format.service';
//  Have to remove from shared to explore-workspaceave
// import {WorkSpaceDataService} from './services/work-space-data.service';
// import {TargetAudienceService} from './services/target-audience.service';
import {ExploreSavePackageComponent} from './components/explore-save-package/explore-save-package.component';
// --end

import {FlexLayoutModule} from '@angular/flex-layout';
import {CanExitGuard} from './guards/can-exit.guard';
import {BreadCrumbsComponent} from './components/bread-crumbs/bread-crumbs.component';
import {MobileViewGuard} from './guards/mobile-view-guard.service';
// Have to move from shared
// import {WorkspaceDataMissingGuard} from './guards/workspace-data-missing.guard';
// --end
import {AuthenticationService} from './services/authentication.service';
import {AuthGuard} from './guards/auth.guard';
import {LoginRedirectGuard} from './guards/login-redirect.guard';
import {PlacesDataService, PlacesService, SnackbarService} from '@shared/services';
//  Have to remove from shared to explore-workspaceave
import {AudienceBrowserComponent} from '@shared/components/audience-browser/audience-browser.component';
import {CustomizeColumnComponent} from '@shared/components/customize-column/customize-column.component';
// --end
import {DebounceDirective} from './directives/debounce.directive';
import {PlacesResolver} from './resolvers/places.resolver';
import {SavedCharactersPipe} from '@shared/pipes/saved-characters.pipe';
import {NgxDnDModule} from '@swimlane/ngx-dnd';
import { TagsInputComponent } from './components/tags-input/tags-input.component';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { HeaderComponent } from '../layout/app-layout/header/header.component';
import { NumberFormatterDirective } from './directives/number-formatter.directive';
import {NormalizeSavedAudiencePipe} from '@shared/pipes/normalize-saved-audience.pipe';
import { SavePlaceSetsDialogComponent } from '@shared/components/save-place-sets-dialog/save-place-sets-dialog.component';
import { AudienceBrowserDialogComponent } from './components/audience-browser-dialog/audience-browser-dialog.component';
import {FiltersService} from '../explore/filters/filters.service';
import { ArrowNavigationComponent } from '@shared/components/arrow-navigation/arrow-navigation.component';
import { AudienceTitleDialogComponent } from './components/audience-title-dialog/audience-title-dialog.component';
import { SavedViewDialogComponent } from './components/saved-view-dialog/saved-view-dialog.component';
import { ApplicenseDirective } from './directives/applicense.directive';
import { LicenseDisableDirective } from './directives/license-disable.directive';
import { NumberOnlyDirective } from './directives/number-only.directive';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DropdownComponent } from './components/dropdown/dropdown.component';
import {OverlayModule} from '@angular/cdk/overlay';
import { AngularDraggableModule } from 'angular2-draggable';
import { AccessModuleDirective } from './directives/access-module.directive';
import { DynamicComponentService } from './services/dynamic-component.service';
import { MapService } from '@shared/services/map.service';
import { PlaceSetsDialogComponent } from './components/place-sets-dialog/place-sets-dialog.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { MediaTypesBuilderDialogComponent } from './components/media-types-builder-dialog/media-types-builder-dialog.component';
import { DragDropDirective} from '@shared/directives/drag-drop.directive';
import { MapLegendsComponent } from './components/map-legends/map-legends.component';
import {SharedFunctionsModule} from './shared-functions.module';
import { DefaultPageComponent } from './components/default-page/default-page.component';
import { AudienceGhostComponent } from './components/audience-browser/audience-ghost/audience-ghost.component';
import { MarketTypeFilterComponent } from './components/market-type-filter/market-type-filter.component';
import { MarketFilterComponent } from '../explore/filters/market-filter/market-filter.component';
import { PublicSignInComponent } from './components/publicSite/sign-in-sign-up/sign-in-sign-up.component';
import { PrintViewPublicDialogComponent } from './components/publicSite/print-view-public-dialog/print-view-public-dialog.component';
import { InventoryStatusDotsComponent } from './components/inventory-status-dots/inventory-status-dots.component';
import { PublicSiteRedirctGaurd } from './guards/public-site-redirect.gaurd';
import { TooltipDirective } from './directives/tooltip.directive';
import { ChipsInputAutoCompleteComponent } from './components/chips-input-auto-complete/chips-input-auto-complete.component';
import {ChipsInputGroupAutoCompleteComponent} from '@shared/components/chips-input-group-auto-complete/chips-input-group-auto-complete.component';
import {PaddingPipe} from '@shared/pipes/padding.pipe';
import {NotificationsModule} from '../notifications/notifications.module';
import { MediaTypesFilterBuilderComponent } from './components/media-types-filter-builder/media-types-filter-builder.component';

import { MediaTypesFilterBuilderComponentW3 } from './components/media-types-filter-builder-w3/media-types-filter-builder-w3.component';


import {InventoryListSortTogglePipe} from '@shared/pipes/inventory-list-sort-toggle.pipe';
import { ThresholdsFilterGPComponent } from 'app/explore/filters/thresholds-filter-gp/thresholds-filter-gp.component';
import { D3Module } from '@d3/d3.module';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { PlacementFilterComponent } from './components/place-placement-filter/place-placement-filter.component';
import { DisableSortPipe } from './pipes/disable-sort.pipe';
import { UploadFileDialogComponent } from './components/upload-file-dialog/upload-file-dialog.component';
import { WidgetsModule } from 'app/widgets/widgets.module';
import { ImxMaterialModule } from 'app/imx-material/imx-material.module';
import { FieldsMappingComponent } from './components/fields-mapping/fields-mapping.component';
import { AuditStatusLabelPipe } from './pipes/audit-status-label.pipe';
import {NgCircleProgressModule} from 'ng-circle-progress';
import { LibraryNavigationComponent } from './components/libray-navigation/library-navigation.component';
import { AudienceNamePipe } from './pipes/audience-name.pipe';
import { MarketNamePipe } from './pipes/market-name.pipe';
import {MarketsSelectionComponent} from '@shared/components/markets-selector/markets-selection.component';
import { LayersDisplayOptionsModule } from './layers-display-options/layers-display-options.module';
import { PopulationDataService } from './services/population-data.service';
// import {GeographySetsListComponent} from './components/geography-sets-list/geography-sets-list.component';
import { PlaceNameFilterComponent } from 'app/explore/filters/place-name-filter/place-name-filter.component';
import { MarketSelectionPipe } from './pipes/market-selection.pipe';
import { PopupModule } from '@shared/popup/popup.module';
import { ActionMenuTemplateComponent } from './components/action-menu-template/action-menu-template.component';
import { DatetimePrintComponent } from './components/datetime-print/datetime-print.component';
import { ExploreScenariosComponent } from 'app/explore/filters/explore-scenarios/explore-scenarios.component';
import { MarketsSelectorDialogComponent } from './components/markets-selector-dialog/markets-selector-dialog.component';
import { HoursComponent } from './components/hours/hours.component';
import { DateAgoPipe } from './pipes/date-ago.pipe';
import { FileExtensionPipe } from '@shared/pipes/file-extension.pipe';
import { FormatBytesPipe } from '@shared/pipes/format-bytes.pipe';
import { FileUploadComponent } from './components/file-upload/file-upload/file-upload.component';
import { FileUploadV2Component } from './components/file-upload-v2/file-upload-v2.component';
import * as MediaTypeBuilder from './components/media-types-filter-builder'
import * as MediaTypeBuilderW3 from './components/media-types-filter-builder-w3'
import * as placeAndPlacement from './components/place-placement-filter';
import { IsObjectExistsPipe } from '@shared/pipes/is-object-exists.pipe';
import { TimeFormatterDirective } from './directives/time-formatter.directive';

import * as Shared from './components';
import { DirectionPipe } from './pipes/directon.pipe';
import { InchesToFeetPipe } from './pipes/inches-to-feet.pipe';
import { AppFilterPipe } from './pipes/app-filter.pipe';
import { AppArrayFilterPipe } from './pipes/app-arr-filter.pipe';
import { DateFormatDirective } from '@shared/directives/date-formate.directive';

import { DeleteConfirmationDialogComponent } from './components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { AppNumeralDirective } from './directives/numeral.directive';
import { NETWORK_ERROR_COMPONENTS } from '@shared/components/network-errors';
import { HoverClassDirective } from './directives/hover-class.directive';
import { MarketFilterPipe } from './pipes/market-filter.pipe';
import { NoteNamePipe } from './pipes/note-name.pipe';
import {MetricsPipe} from '@shared/pipes/metrics.pipe';
import { PhoneFormatPipe } from './pipes/phone-format.pipe';
import { AutocompletePositionDirective } from './directives/autocomplete-position.directive';

import { AppContractsAutocompleteComponent } from './components/app-autocomplete/app-contracts-autocomplete.component';

import { CKEditorModule } from 'ckeditor4-angular';
import { AutoFocusDirective } from './directives/auto-focus.directive';
import { ToPlainTextPipe } from './pipes/to-plain-text.pipe';
import { FilterOverlayComponent } from './components/filter-overlay/filter-overlay.component';
import { NewConfirmationDialogComponent } from './components/new-confirmation-dialog/new-confirmation-dialog.component';
import { LogosComponent } from './components/logos/logos.component';
import { LogoFileUploadV2Component } from './components/logos/file-upload-v2/file-upload-v2.component';
import { LogoService } from './services/logo.service';
import { IMXOverlayListComponent } from './components/overlay-list/overlay-list.component';

import { ImxArrayEllipsisPipe } from './pipes/imx-array-ellipsis.pipe';
import { ImxMarketTableSectionComponent } from './components/imx-market-table-section/imx-market-table-section.component';
import { UsAddressComponent } from './components/us-address/us-address.component';
import { AddressCardComponent } from './components/address-card/address-card.component';
import { ImxTagInputComponent } from './components/imx-tag-input/imx-tag-input.component';
import { AppSortByPipe } from './pipes/sort-by.pipe';
import { ImxFileExtFormatPipe } from './pipes/imx-file-ext-format.pipe';
import {MeasureReleaseLabelPipe} from '@shared/pipes/measure-release-label.pipe';
import {NgxExtendedPdfViewerModule} from 'ngx-extended-pdf-viewer';
import { IMXPDFPreviewerComponent } from './components/imx-pdf-previewer/imx-pdf-previewer.component';
import { UserAccessPermissionDirective } from './directives/user-access-permission.directive';
import { ImxUserApplicationSettingsComponent } from './components/imx-user-application-settings/imx-user-application-settings.component';
import { ImxBaseAudiencePopupComponent } from './components/imx-base-audience-popup/imx-base-audience-popup.component';
import { UserLabelPipe } from './pipes/user-label.pipe'
import { TooltipPanelModule } from './tooltip-panel/tooltip-panel.module';
import { TooltipPanelDirectives } from './directives/tooltip-panel.directive';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ImxMaterialModule,
    RouterModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    NgxDnDModule,
    DragDropModule,
    OverlayModule,
    AngularDraggableModule,
    InfiniteScrollModule,
    SharedFunctionsModule,
    NotificationsModule,
    NgxMatSelectSearchModule,
    D3Module,
    NgxSliderModule,
    WidgetsModule,
    LayersDisplayOptionsModule,
    NgCircleProgressModule.forRoot({
      radius: 100,
      outerStrokeWidth: 16,
      innerStrokeWidth: 8,
      outerStrokeColor: '#78C000',
      innerStrokeColor: '#C7E596',
      animationDuration: 300,
      maxPercent: 100,
    }),
    PopupModule,
    MatGridListModule,
    CKEditorModule,
    NgxExtendedPdfViewerModule,
    TooltipPanelModule
  ],
  declarations: [
    UserNavigationComponent,
    AuthenticateDirective,
    ShowErrorsComponent,
    InventoryListSortTogglePipe,
    PaddingPipe,
    // IMXHighlightPipe,
    SavedCharactersPipe,
    NormalizeSavedAudiencePipe,
    BreadCrumbsComponent,
    AudienceBrowserComponent,
    CustomizeColumnComponent,
    SavePlaceSetsDialogComponent,
    DebounceDirective,
    TagsInputComponent,
    // SearchDirective,
    HeaderComponent,
    NumberFormatterDirective,
    ExploreSavePackageComponent,
    AudienceBrowserDialogComponent,
    ArrowNavigationComponent,
    AudienceTitleDialogComponent,
    SavedViewDialogComponent,
    ApplicenseDirective,
    LicenseDisableDirective,
    DropdownComponent,
    AccessModuleDirective,
    UserAccessPermissionDirective,
    PlaceSetsDialogComponent,
    ConfirmationDialogComponent,
    AutocompleteComponent,
    MediaTypesBuilderDialogComponent,
    DragDropDirective,
    // MapLegendsComponent,
    DefaultPageComponent,
    AudienceGhostComponent,
    MarketTypeFilterComponent,
    MarketFilterComponent,
    PublicSignInComponent,
    PrintViewPublicDialogComponent,
    InventoryStatusDotsComponent,
    // ChipsInputAutoCompleteComponent,
    // ChipsInputGroupAutoCompleteComponent,
    MediaTypesFilterBuilderComponent,
    MediaTypesFilterBuilderComponentW3,
    ThresholdsFilterGPComponent,
    PlacementFilterComponent,
    DisableSortPipe,
    UploadFileDialogComponent,
    FieldsMappingComponent,
    AuditStatusLabelPipe,
    LibraryNavigationComponent,
    AudienceNamePipe,
    MarketNamePipe,
    MarketsSelectionComponent,
    PlaceNameFilterComponent,
    MarketSelectionPipe,
    ActionMenuTemplateComponent,
    DatetimePrintComponent,
    ExploreScenariosComponent,
    MarketsSelectorDialogComponent,
    HoursComponent,
    DateAgoPipe,
    FileExtensionPipe,
    FormatBytesPipe,
    FileUploadComponent,
    FileUploadV2Component,
    ...placeAndPlacement.components,
    ...MediaTypeBuilder.components,
    ...MediaTypeBuilderW3.components,
    IsObjectExistsPipe,
    TimeFormatterDirective,
    ...Shared.COMPONENTS,
    DirectionPipe,
    InchesToFeetPipe,
    DeleteConfirmationDialogComponent,
    AppFilterPipe,
    DateFormatDirective,
    TooltipDirective,
    AppNumeralDirective,
    TooltipDirective,
    NETWORK_ERROR_COMPONENTS,
    HoverClassDirective,
    MarketFilterPipe,
    NoteNamePipe,
    MetricsPipe,
    PhoneFormatPipe,
    AutocompletePositionDirective,
    AppContractsAutocompleteComponent,
    AutoFocusDirective,
    ToPlainTextPipe,
    FilterOverlayComponent,
    NewConfirmationDialogComponent,
    LogosComponent,
    LogoFileUploadV2Component,
    ImxArrayEllipsisPipe,
    ImxMarketTableSectionComponent,
    UsAddressComponent,
    AddressCardComponent,
    ImxUserApplicationSettingsComponent,
    ImxBaseAudiencePopupComponent,
    TelephoneInputComponent,
    ImxTagInputComponent,
    IMXPDFPreviewerComponent,
    AppSortByPipe,
    AppArrayFilterPipe,
    ImxFileExtFormatPipe,
    IMXOverlayListComponent,
    MeasureReleaseLabelPipe,
    UserLabelPipe,
    TooltipPanelDirectives
  ],
  exports: [
    DateFormatDirective,
    FormsModule,
    RouterModule,
    ImxMaterialModule,
    ReactiveFormsModule,
    UserNavigationComponent,
    AuthenticateDirective,
    ShowErrorsComponent,
    InventoryListSortTogglePipe,
    // IMXHighlightPipe,
    SavedCharactersPipe,
    BreadCrumbsComponent,
    FlexLayoutModule,
    NgxDnDModule,
    TagsInputComponent,
    AudienceBrowserComponent,
    CustomizeColumnComponent,
    SavePlaceSetsDialogComponent,
    DebounceDirective,
    NgxMatSelectSearchModule,
    // SearchDirective,
    HeaderComponent,
    NumberFormatterDirective,
    ExploreSavePackageComponent,
    AudienceBrowserDialogComponent,
    ArrowNavigationComponent,
    SavedViewDialogComponent,
    ApplicenseDirective,
    LicenseDisableDirective,
    DragDropModule,
    DropdownComponent,
    OverlayModule,
    AngularDraggableModule,
    AccessModuleDirective,
    UserAccessPermissionDirective,
    InfiniteScrollModule,
    PlaceSetsDialogComponent,
    AutocompleteComponent,
    MediaTypesBuilderDialogComponent,
    DragDropDirective,
    // MapLegendsComponent,
    MarketTypeFilterComponent,
    MarketFilterComponent,
    SharedFunctionsModule,
    PublicSignInComponent,
    InventoryStatusDotsComponent,
    // ChipsInputAutoCompleteComponent,
    // ChipsInputGroupAutoCompleteComponent,
    MediaTypesFilterBuilderComponent,
    MediaTypesFilterBuilderComponentW3,
    PaddingPipe,
    ThresholdsFilterGPComponent,
    D3Module,
    NgxSliderModule,
    DisableSortPipe,
    WidgetsModule,
    UploadFileDialogComponent,
    AuditStatusLabelPipe,
    NgCircleProgressModule,
    LibraryNavigationComponent,
    AudienceNamePipe,
    MarketNamePipe,
    MarketsSelectionComponent,
    LayersDisplayOptionsModule,
    PlaceNameFilterComponent,
    PopupModule,
    ActionMenuTemplateComponent,
    DatetimePrintComponent,
    ExploreScenariosComponent,
    MarketsSelectorDialogComponent,
    HoursComponent,
    DateAgoPipe,
    FileExtensionPipe,
    FormatBytesPipe,
    FileUploadComponent,
    FileUploadV2Component,
    ...MediaTypeBuilder.components,
    ...MediaTypeBuilderW3.components,
    ...placeAndPlacement.components,
    IsObjectExistsPipe,
    TimeFormatterDirective,
    ...Shared.COMPONENTS,
    DirectionPipe,
    InchesToFeetPipe,
    AppFilterPipe,
    TooltipDirective,
    AppNumeralDirective,
    NETWORK_ERROR_COMPONENTS,
    HoverClassDirective,
    MarketFilterPipe,
    NoteNamePipe,
    MetricsPipe,
    PhoneFormatPipe,
    AutocompletePositionDirective,
    AppContractsAutocompleteComponent,
    CKEditorModule,
    NgxExtendedPdfViewerModule,
    AutoFocusDirective,
    ToPlainTextPipe,
    FilterOverlayComponent,
    LogosComponent,
    ImxMarketTableSectionComponent,
    UsAddressComponent,
    AddressCardComponent,
    ImxUserApplicationSettingsComponent,
    ImxBaseAudiencePopupComponent,
    TelephoneInputComponent,
    ImxTagInputComponent,
    IMXPDFPreviewerComponent,
    AppSortByPipe,
    AppArrayFilterPipe,
    ImxFileExtFormatPipe,
    IMXOverlayListComponent,
    MeasureReleaseLabelPipe,
    UserLabelPipe,
    TooltipPanelModule,
    TooltipPanelDirectives
  ],
  providers: [
    // AuthenticationService,
    ThemeService,
    ExploreService,
    LoaderService,
    TitleService,
    FormatService,
    FiltersService,
    AuthGuard,
    LoginRedirectGuard,
    CanExitGuard,
    MobileViewGuard,
    PlacesDataService,
    PlacesService,
    PlacesResolver,
    InventoryListSortTogglePipe,
    PaddingPipe,
    DynamicComponentService,
    MapService,
    InventoryService,
    PublicSiteRedirctGaurd,
    DisableSortPipe,
    AuditStatusLabelPipe,
    AudienceNamePipe,
    MarketNamePipe,
    PopulationDataService,
    DateAgoPipe,
    FileExtensionPipe,
    FormatBytesPipe,
    IsObjectExistsPipe,
    TimeFormatterDirective,
    DirectionPipe,
    InchesToFeetPipe,
    AppFilterPipe,
    MarketFilterPipe,
    NoteNamePipe,
    MetricsPipe,
    PhoneFormatPipe,
    ToPlainTextPipe,
    LogoService,
    SnackbarService,
    AppArrayFilterPipe,
    ImxFileExtFormatPipe
  ],
})
export class SharedModule {}
