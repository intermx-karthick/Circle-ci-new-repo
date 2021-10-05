import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter
} from '@angular/core';

@Component({
  selector: 'app-infinite-select',
  templateUrl: './infinite-select.component.html',
  styleUrls: ['./infinite-select.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfiniteSelectComponent {
  @Input() set selectedValue(data: any) {
    this.selectedOption = data;
  };

  @Input() label: string;
  @Input() items: any[];
  @Input() itemViewField: string;
  @Input() total: number | string;
  @Input() limit = 10;
  @Input() offset = 10;
  @Input() threshold = '50%';
  @Input() isLoading = false;
  @Input() showError = false;
  @Input() showTabLink = false;
  @Input() disableEdit = false;
  @Input() createOptionEnable = false;
  @Input() createLabel: string;
  @Output() selectionChange: EventEmitter<any> = new EventEmitter();
  @Output() createAction: EventEmitter<any> = new EventEmitter();
  @Output() scroll: EventEmitter<any> = new EventEmitter();
  @Output() tabLink = new EventEmitter<string>();
  public Array = Array;
  public selectedOption;
  public isComplete = false;

  public onSelectionChange(value: any): void {
    this.selectionChange.emit(value);
  }

  compareObjects(o1: any, o2: any): boolean {
    if(o1 && o2){
      return (
        o1[this.itemViewField as string] === o2[this.itemViewField as string] &&
        o1._id === o2._id
      );
    }
  }

  public onScroll() {
    if (!this.isComplete) {
      this.scroll.emit(String(this.limit + this.offset));
      this.offset += this.limit;
      this.isComplete = this.offset >= this.total;
    }
  }
  public openNewWindowAction(){
    this.createAction.emit();
  }

  handleTabClick(_id: string | undefined) {
    this.tabLink.emit(_id);
  }
}
