import {
  trigger,
  state,
  animate,
  style,
  transition
} from '@angular/animations';

/**
 * @description
 *  This function is used to define the animation for slide top to
 *  down.
 *
 *  @example notifications
 */
export const slideTopDownAnimation = trigger('slide-up-down', [
  state(
    '*',
    style({
      position: 'absolute'
    })
  ),
  state(
    'top',
    style({
      top: '-1000px',
      visibility: 'hidden'
    })
  ),
  state(
    'down',
    style({
      top: '0px',
      visibility: 'visible'
    })
  ),
  transition('top <=> down', [animate('.4s')])
]);
