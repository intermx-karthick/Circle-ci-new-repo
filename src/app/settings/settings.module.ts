import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SettingsRouting} from './settings.routing';

import {SettingsComponent} from './settings.component';
import {ThemeSettingsComponent} from './theme-settings/theme-settings.component';
import {SharedModule} from '@shared/shared.module';
import {UserProfileComponent} from './user-profile/user-profile.component';
import { ColorPickerDirective } from '../shared/directives/color-picker.directive';

@NgModule({
  imports: [
    CommonModule,
    SettingsRouting,
    SharedModule,
  ],
  declarations: [
    SettingsComponent,
    ThemeSettingsComponent,
    UserProfileComponent,
    ColorPickerDirective
  ],
  exports: [
    SettingsComponent,
    SharedModule,
    ColorPickerDirective
  ],
})
export class SettingsModule { }
