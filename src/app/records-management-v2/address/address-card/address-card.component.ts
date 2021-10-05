import { Component, HostBinding, Input } from '@angular/core';

/**
 * @description
 *  This is an higher order component for show the address form
 *  which will take form component as child.
 *
 *  @example
 *   <app-address-card class="address-card-override-class">
 *     <app-us-address></app-us-address>
 *   </app-address-card>
 *
 */
@Component({
  selector: 'app-address-card',
  template: `
    <ng-content></ng-content> `,
  styleUrls: ['./address-card.component.less'],
  host: {
    ['class']: 'c-address-card'
  }
})
export class AddressCardComponent {
  @Input() class: string;

  @HostBinding('class') get classList() {
    return this.class;
  }
}
