import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * @description
 *   Display the skeleton view in the form of
 * list style component with right side
 * checkbox button at each list item.
 *
 * @example
 *  <app-cl-list-right-checkbox></app-cl-list-right-checkbox>
 */
@Component({
  selector: 'app-cl-list-right-checkbox',
  template: `
    <content-loader>
      <svg:rect x="0" y="5" width="70%" height="10"/>
      <svg:rect x="95%" y="2" width="16" height="16"/>
      <svg:rect x="0" y="30" width="50%" height="10"/>
      <svg:rect x="95%" y="26" width="16" height="16"/>
      <svg:rect x="0" y="55" width="70%" height="10"/>
      <svg:rect x="95%" y="52" width="16" height="16"/>
      <svg:rect x="0" y="80" width="50%" height="10"/>
      <svg:rect x="95%" y="77" width="16" height="16"/>
    </content-loader>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListWithRightCheckBoxContentLoader {
}
