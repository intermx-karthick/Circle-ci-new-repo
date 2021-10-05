import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-audience-ghost',
  templateUrl: './audience-ghost.component.html',
  styleUrls: ['./audience-ghost.component.less']
})

/**
 * @deprecated This component is deprecated and will be removed. Any new implementation should not be based on this component.
 * This is deprecated because of new design.
 */
export class AudienceGhostComponent {
  @Input() selectionType;
}
