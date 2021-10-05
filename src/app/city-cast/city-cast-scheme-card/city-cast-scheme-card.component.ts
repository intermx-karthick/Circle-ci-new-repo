import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CCCastStatuses } from '../classes/layer-factory';
import { KeyValue } from '@angular/common';

@Component({
  selector: 'app-city-cast-scheme-card',
  templateUrl: './city-cast-scheme-card.component.html',
  styleUrls: ['./city-cast-scheme-card.component.less']
})
export class CityCastSchemeCardComponent implements OnInit {
  // @Output() navigateToChanges = new EventEmitter();
  @Input() cast = null;
  @Input() data = null;
  @Input() index = null;
  @Input() type = '';
  @Output() cardAction = new EventEmitter();
  castStatuses = CCCastStatuses;
  constructor() { }

  ngOnInit(): void {
  }
  originalOrder = (
    a: KeyValue<number, string>,
    b: KeyValue<number, string>
  ): number => {
    return 0;
  };
  triggerSchemeAction(data, action) {
    const values = {
      data: data,
      action: action,
      type: this.type
    };
    this.cardAction.emit(values);
    return true;
  }
}
