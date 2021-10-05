import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * @description
 *   Display the skeleton view in the form of
 * list style component with left side
 * radio button at each list item.
 *
 * @example
 *  <app-cl-list-left-radio-btn></app-cl-list-left-radio-btn>
 */
@Component({
  selector: 'app-cl-list-left-radio-btn',
  template: `
    <content-loader>
      <svg:circle cx="10" cy="11" r="8"/>
      <svg:rect x="25" y="5" width="220" height="10"/>
      <svg:circle cx="10" cy="35" r="8"/>
      <svg:rect x="25" y="30" width="180" height="10"/>
      <svg:circle cx="10" cy="60" r="8"/>
      <svg:rect x="25" y="55" width="220" height="10"/>
      <svg:circle cx="10" cy="85" r="8"/>
      <svg:rect x="25" y="80" width="180" height="10"/>
    </content-loader>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListWithLeftRadioBtnContentLoader {
}
