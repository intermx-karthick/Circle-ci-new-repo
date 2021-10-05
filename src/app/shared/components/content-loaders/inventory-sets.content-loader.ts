import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * @description
 *   Display the skeleton view in the form of
 * list style component with left side
 * checkbox and right side edit and delete button
 * at each list item.
 *
 * @example
 *  <app-cl-inventory-sets></app-cl-inventory-sets>
 */
@Component({
  selector: 'app-cl-inventory-sets',
  template: `
    <content-loader>
      <svg:rect x="0" y="2" width="16" height="16" />
      <svg:rect x="25" y="5"  width="220" height="10" />
      <svg:rect x="365" y="5" rx="7" ry="7" width="15" height="15" />
      <svg:rect x="385" y="5" rx="7" ry="7" width="15" height="15" />

      <svg:rect x="0" y="26" width="16" height="16" />
      <svg:rect x="25" y="30"  width="180" height="10" />
      <svg:rect x="365" y="26" rx="7" ry="7" width="15" height="15" />
      <svg:rect x="385" y="26" rx="7" ry="7" width="15" height="15" />

      <svg:rect x="0" y="52" width="16" height="16" />
      <svg:rect x="25" y="55" width="220" height="10" />
      <svg:rect x="365" y="52" rx="7" ry="7" width="15" height="15" />
      <svg:rect x="385" y="52" rx="7" ry="7" width="15" height="15" />

      <svg:rect x="0" y="77" width="16" height="16" />
      <svg:rect x="25" y="80" width="180" height="10" />
      <svg:rect x="365" y="77" rx="7" ry="7" width="15" height="15" />
      <svg:rect x="385" y="77" rx="7" ry="7" width="15" height="15" />
    </content-loader>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventorySetsContentLoader {

}
