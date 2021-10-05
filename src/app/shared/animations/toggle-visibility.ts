import { state, style, trigger } from '@angular/animations';

export const toggleVisibility = trigger('toggleVisibility', [
  state('show', style({
    visibility: 'visible'
  })),
  state('hide', style({
    visibility: 'hidden'
  }))
]);
