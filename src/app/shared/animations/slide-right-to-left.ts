import { trigger, state, animate, style, transition, keyframes } from "@angular/animations";

/**
 * @description
 *   The function is used to define the animations for
 *   slideNav end position. `right (closed state)` to `left (open state)`"
 */
export const slideRightToLeftAnimation = trigger('slideRightLeft', [
  state('*', style({
    position: "absolute",
  })),
  state('right', style({
    transform: "translateX(100%)",
    visibility: 'hidden'
  })),
  state('left', style({
    transform: "translateX(0)",
    visibility: 'visible'
  })),
  transition("* => left",  [
    animate('.4s cubic-bezier(.7,1.02,.98,.45)',
      keyframes([
              style({transform: "translateX(100%)"}),
              style({transform: "translateX(-18px)", visibility: 'visible'}),
              style({transform: "translateX(0)", visibility: 'visible'})
      ])
    )
  ]),
  transition("* => right", [ animate('.2s')])
]);
