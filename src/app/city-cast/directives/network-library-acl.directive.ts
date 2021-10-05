import { Directive, OnInit, ElementRef, Renderer2, Input } from '@angular/core';
import { AuthenticationService } from '@shared/services';

@Directive({
  selector: '[networkLibraryAcl]'
})
export class NetworkLibraryAclDirective  implements OnInit {
  @Input() access: string;
  constructor(
    private el: ElementRef,
    private r: Renderer2,
    private authService: AuthenticationService
  ) { }
  ccAccess = {};
  networkModAccess = {};
  ngOnInit() {
    this.ccAccess = this.authService.getModuleAccess('citycast');
    this.networkModAccess = this.authService.getModuleAccess('networkLibrary');
    const ele = $(this.el.nativeElement);
    switch (this.access) {
      case 'edit':
          if (!(this.networkModAccess['edit'] && (this.ccAccess && this.ccAccess['write']))) {
            ele.remove();
          }
          break;
      case 'view':
          if (!(this.networkModAccess['view'] && (this.ccAccess && this.ccAccess['view']))) {
            ele.remove();
          }
          break;
      default:
        break;
    }
  }
}
