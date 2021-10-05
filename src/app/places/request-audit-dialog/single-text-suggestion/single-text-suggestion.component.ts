import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-single-text-suggestion',
  templateUrl: './single-text-suggestion.component.html',
  styleUrls: ['./single-text-suggestion.component.less']
})
export class SingleTextSuggestionComponent implements OnInit, OnChanges {

  constructor() { }
  @Input() data: any;
  // tslint:disable-next-line:no-output-on-prefix
  @Output() onToggleSuggestion: EventEmitter<any> = new EventEmitter();
  // tslint:disable-next-line:no-output-on-prefix
  @Output() onSaveSuggestion: EventEmitter<any> = new EventEmitter();
  public suggestion = '';
  ngOnInit() {
    this.suggestion = this.data['suggestion'];
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.suggestion = changes['data']['currentValue']['suggestion'];
    }
  }
  toggleSuggestion(state = true) {
    if (!state) {
      this.suggestion = '';
    }
    this.onToggleSuggestion.emit(state);
  }
  saveSuggestion() {
    this.onSaveSuggestion.emit(this.suggestion);
  }
}
