import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { CityCastRouting } from './city-cast.routing';
import { CityCastComponent } from './city-cast.component';
import { CityCastHomeComponent } from './city-cast-home/city-cast-home.component';
import { CityCastFloatingMenuComponent } from './city-cast-floating-menu/city-cast-floating-menu.component';
import { CityCastApiService } from './services/city-cast-api.service';
import { CityCastManageCastComponent } from './city-cast-manage-cast/city-cast-manage-cast.component';
import { CityCastFindFeaturesComponent } from './city-cast-find-features/city-cast-find-features.component';
import { CityCastSchemesComponent } from './city-cast-schemes/city-cast-schemes.component';
import { CityCastSchemeCardComponent } from './city-cast-scheme-card/city-cast-scheme-card.component';
import { NetworkLibraryAclDirective } from './directives/network-library-acl.directive';
import { CityCastMetricsComponent } from './city-cast-metrics/city-cast-metrics.component';
import { CityCastSettingsComponent } from './city-cast-settings/city-cast-settings.component';


@NgModule({
  declarations: [CityCastComponent, CityCastHomeComponent, CityCastFloatingMenuComponent, CityCastManageCastComponent, CityCastFindFeaturesComponent, CityCastSchemesComponent, CityCastSchemeCardComponent, NetworkLibraryAclDirective, CityCastMetricsComponent, CityCastSettingsComponent],
  imports: [
    CommonModule,
    CityCastRouting,
    SharedModule
  ],
  providers: [
    CityCastApiService
  ]
})
export class CityCastModule { }
