import { AuthenticationService } from '@shared/services';
import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  Renderer2,
  Inject,
  OnDestroy
} from '@angular/core';
import { UsersService } from './services';

@Component({
  selector: 'user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.less']
})
export class UserManagementComponent implements AfterViewInit, OnDestroy {
  public isSiteAdmin = false;

  constructor(
    private renderer: Renderer2,
    public userService: UsersService,
    private authenticationService: AuthenticationService,
    @Inject(DOCUMENT) private readonly document: Document
  ) {
    this.authenticationService
      .getUserDetailsUsingAuth0Token()
      .subscribe(({ permissions }) => {
        this.isSiteAdmin = permissions?.site_admin?.write;
      });
  }

  ngAfterViewInit() {
    if (!this.document.body.classList.contains('intermx-theme-new')) {
      this.renderer.addClass(this.document.body, 'intermx-theme-new');
    }
  }

  ngOnDestroy(): void {
    const body = document.body;
    if (body.classList.contains('intermx-theme-new')) {
      body.classList.remove('intermx-theme-new');
    }
  }
}
