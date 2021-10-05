import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, InjectionToken, NgModule } from '@angular/core';

import { AppRouting } from './app.routing';
import {DefaultComponent} from './layout/default.component';
import { UserModule } from './user/user.module';

import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '@shared/shared.module';
import { ExploreWorkspaceSharedModule } from '@shared/explore-workspace-shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TokenInterceptor } from './interceptors/token.interceptor';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AppConfig } from './app-config.service';
import { FlexLayoutModule } from '@angular/flex-layout';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './home/home.component';
import { environment } from '../environments/environment';
import { NgHttpLoaderModule } from 'ng-http-loader';
import { AppLoaderComponent } from './app-loader.component';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { LeftNavBarComponent } from './layout/app-layout/left-nav-bar/left-nav-bar.component';
import { LoaderHeaderInterceptor } from './interceptors/loader-header.interceptor';
import { ErrorHandlerInterceptor } from './interceptors/error-handler.interceptor';
import { HomePopupComponent } from './home/home-popup/home-popup.component';
import { CustomPreloadingStrategy } from './custom-preload-strategy';
import { OriginInterceptor } from './interceptors/origin.interceptor';
import {CallbackComponent } from './auth/callback/callback.component';
import { ToastrModule } from 'ngx-toastr';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS} from '@angular/material/snack-bar';
import { MAT_TABS_CONFIG } from '@angular/material/tabs';
import { AddAgencyComponent } from './add-agency/add-agency.component';


@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    HomeComponent,
    AppLoaderComponent,
    AppLayoutComponent,
    LeftNavBarComponent,
    HomePopupComponent,
    DefaultComponent,
    CallbackComponent,
    AddAgencyComponent,
    // PlacesFileuploadComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRouting,
    UserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgHttpLoaderModule.forRoot(),
    SharedModule,
    ExploreWorkspaceSharedModule,
    FlexLayoutModule,
    ToastrModule.forRoot({
      positionClass: 'toast-bottom-right'
    }),
  ],
  exports: [SharedModule, ExploreWorkspaceSharedModule],
  providers: [
    AppConfig,
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoaderHeaderInterceptor,
      multi: true
    },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorHandlerInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: OriginInterceptor, multi: true },
    {
      provide: APP_INITIALIZER,
      useFactory: (config: AppConfig) => () => config.load(),
      deps: [AppConfig],
      multi: true
    },
    CustomPreloadingStrategy,
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: {
        horizontalPosition: 'right',
        verticalPosition: 'bottom',
      }
    },
    { provide: MAT_TABS_CONFIG, useValue: { animationDuration: '0ms' } },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {
    if (this.isIE()) {
      throw new Error('IE is not supported, Please upgrade your browser');
    }
    if (environment.production) {
      this.versionCheck();
    }
  }

  private versionCheck() {
    const localVersion = localStorage.getItem('version');
    const codeVersion = environment.devops?.image_version + '-' + environment.devops?.image_rc;
    const unParsed = localStorage.getItem('themeSettings') || '{}';
    const themeSetting = JSON.parse(unParsed);
    if (localVersion) {
      console.info('current version is ' + localVersion);
    }
    if (!localVersion || localVersion !== codeVersion) {
      if (themeSetting?.site !== 'geopath') {
        localStorage.clear();
      }
      localStorage.setItem('version', codeVersion);
      location.reload(true);
    }
  }

  isIE() {
    const ua = window.navigator.userAgent;
    // IE 10 or older
    const msie = ua.indexOf('MSIE ');
    if (msie > 0) {
      return true;
    }
    // IE 11
    const trident = ua.indexOf('Trident/');
    if (trident > 0) {
      return true;
    }
    // other browser
    return false;
  }
}
