import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * @description
 *   Display the skeleton view in the form of
 * list style component with left side
 * checkbox and right side content at each
 * list item.
 *
 * @example
 *  <app-cl-list-with-left-check-box-right-ctnt>
 *  </app-cl-list-with-left-check-box-right-ctnt>
 */
@Component({
  selector: 'app-cl-list-with-left-radio-right-ctnt',
  template: `
<content-loader>
    <svg:rect x="0" y="2" rx="8" ry="8" width="16" height="16" />
    <svg:rect x="25" y="5"  width="220" height="10" />
    <svg:rect x="375" y="2" rx="5" ry="5" width="25" height="10" />

    <svg:rect x="0" y="26" rx="8" ry="8" width="16" height="16" />
    <svg:rect x="25" y="30"  width="180" height="10" />
    <svg:rect x="350" y="26" rx="5" ry="5" width="50" height="10" />

    <svg:rect x="0" y="52" rx="8" ry="8" width="16" height="16" />
    <svg:rect x="25" y="55" width="220" height="10" />
    <svg:rect x="375" y="52" rx="5" ry="5" width="25" height="10" />

    <svg:rect x="0" y="77" rx="8" ry="8" width="16" height="16" />
    <svg:rect x="25" y="80" width="180" height="10" />
    <svg:rect x="350" y="77" rx="5" ry="5" width="50" height="10" />
</content-loader>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListWithLeftRadioRightCtntContentLoader {

}
