import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * @description
 *   Display the skeleton view in the form of
 * list style component with left side
 * checkbox at each
 * list item.
 *
 * @example
 *  <app-cl-list-with-left-check-box>
 *  </app-cl-list-with-left-check-box>
 */
@Component({
  selector: 'app-cl-list-with-left-check-box',
  template: `
<content-loader>
    <svg:rect x="0" y="2" width="16" height="16" />
    <svg:rect x="25" y="5"  width="220" height="10" />

    <svg:rect x="0" y="26" width="16" height="16" />
    <svg:rect x="25" y="30"  width="180" height="10" />

    <svg:rect x="0" y="52" width="16" height="16" />
    <svg:rect x="25" y="55" width="220" height="10" />

    <svg:rect x="0" y="77" width="16" height="16" />
    <svg:rect x="25" y="80" width="180" height="10" />
</content-loader>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListWithLeftCheckBoxContentLoader {

}
