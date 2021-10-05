import {AfterViewInit, Component, OnInit} from '@angular/core';
import {ThemeService} from '@shared/services';
import {UserService} from '../user.service';

@Component({
  selector: 'app-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.less']
})
export class ConfirmComponent implements OnInit, AfterViewInit {
  public user: any = {};
  themeSettings: any;
  constructor(
    private theme: ThemeService,
    private userService: UserService) { }

  ngOnInit() {
    this.themeSettings = this.theme.getThemeSettings();
    this.theme.themeSettings.subscribe(res => {
      this.themeSettings = this.theme.getThemeSettings();
    });
  }
  ngAfterViewInit() {
    this.user = this.userService.getUser();
  }

}
