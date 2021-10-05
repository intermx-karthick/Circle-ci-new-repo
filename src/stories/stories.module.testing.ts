import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { BrowserModule } from '@angular/platform-browser';
import { FlexLayoutModule } from '@angular/flex-layout';
import {ThemeService, TitleService} from '@shared/services';
import { ImxMaterialModule } from 'app/imx-material/imx-material.module';
import { AppConfig } from 'app/app-config.service';
import { RouterTestingModule } from '@angular/router/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { SharedModule } from '@shared/shared.module';
import { SharedFunctionsModule } from '@shared/shared-functions.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MockThemeService } from './mocks/mock-theme.service';
// import { NgxMatIntlTelInputModule } from 'ngx-mat-intl-tel-input';
import { APP_BASE_HREF } from '@angular/common';

export const StoriesModuleTesting = {
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatAutocompleteModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    ImxMaterialModule,
    HttpClientTestingModule,
    RouterTestingModule,
    MatOptionModule,
    InfiniteScrollModule,
    SharedModule,
    SharedFunctionsModule,
    MatTooltipModule,
    // NgxMatIntlTelInputModule
  ],
  providers: [
    { provide: APP_BASE_HREF, useValue : '/' },
    AppConfig,
    TitleService,
    {
      provide: ThemeService,
      useClass: MockThemeService
    }
  ]
};
