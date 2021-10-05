import { selection } from 'd3';
import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef, Input, ChangeDetectorRef, DoCheck, ChangeDetectionStrategy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CustomizeColumnComponent } from '@shared/components/customize-column/customize-column.component';
import {PopulationResultItem, PopulationSelectable} from '@interTypes/Population';

@Component({
  selector: 'app-population-tabular',
  templateUrl: './population-tabular.component.html',
  styleUrls: ['./population-tabular.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopulationTabularComponent implements OnInit {

  constructor(public dialog: MatDialog, private cdRef: ChangeDetectorRef) { }
  @Input() public geographies: PopulationResultItem[] = [];
  @Input() public currentPage: number;
  @Input() public totalPages: number;
  @Input() public defaultSort;
  @Input() public selectedCount: number;
  @Input() public totalCount: number;
  @Input() public selectQuery: PopulationSelectable;
  public isLoader = false;
  @Output() resizeElement = new EventEmitter();
  @Output() collapseTabular = new EventEmitter();
  @Output() scrolled = new EventEmitter();
  @Output() toggleSelection: EventEmitter<string> = new EventEmitter<string>();
  @Output() toggleAllSelection: EventEmitter<PopulationSelectable> = new EventEmitter<PopulationSelectable>()
  @Output() sortableEmit = new EventEmitter();
  @ViewChild('tabularHeight') tabularView: ElementRef;
  @ViewChild(MatSort) sort: MatSort;

  public tableHeight: any;
  dataSource = new MatTableDataSource([]);

  public sortables = [
    {name: 'Composition Percentage', displayname: 'Composition Percentage', value: 'comp'},
    {name: 'Name', displayname: 'Name', value: 'geoName'},
    {name: 'Composition Index', displayname: 'Composition Index', value: 'index'},
  ];
  public currentSortables = [];
  public displaySortables = [];
  public sortColumnQuery = '';

  ngOnInit() {
    this.dataSource.sort = this.sort;
    this.displaySortables = this.sortables;
    this.dataSource.data = this.geographies;
    this.sortColumnQuery = this.defaultSort['sortKey'];
    this.loadTabularData();
  }
  ngDoCheck() {
    this.dataSource.data = this.geographies;
    this.cdRef.markForCheck();
  }
  loadTabularData() {
    this.displaySortables = this.sortables.map(x => Object.assign({}, x));
    const localCustomColum = JSON.parse(localStorage.getItem('papulationCustomColumn'));
    if (localCustomColum === null || localCustomColum.length === 0) {
      this.currentSortables = this.displaySortables;
      this.displaySortables = [];
    }
    if (this.currentSortables.length === 0 && localCustomColum.length > 0) {
      this.currentSortables = localCustomColum;
    }
    if (this.currentSortables && this.currentSortables.length > 0) {
      this.displaySortables = this.currentSortables;
    }

    this.displaySortables = this.displaySortables.map(c => c['value']);
    if (this.displaySortables.indexOf('checked') === -1) {
      this.displaySortables.splice(0, 0, 'checked');
      const obj = {
        'name': 'CHECKBOX',
        'displayname': '',
        'value': 'checked'
      };
      this.currentSortables.splice(0, 0, obj);
    }
    if (this.displaySortables.indexOf('position') === -1) {
      this.displaySortables.splice(1, 0, 'position');
      const obj = {
        'name': 'SLNO',
        'displayname': '#',
        'value': 'position'
      };
      this.currentSortables.splice(1, 0, obj);
    }
  }
  selectCheckboxToggle(element: PopulationResultItem) {
    this.toggleSelection.emit(element.geoId);
  }
  selectAll($event) {
    if ($event.checked) {
      this.selectQuery = {key: 'all', display: 'All'};
    } else {
      this.selectQuery = {key: 'none', display: 'None'};
    }
    this.toggleAllSelection.emit(this.selectQuery);
  }
  sortColumn(name) {
    this.sortColumnQuery = name.value;
    const sortableData = {
      key: this.sortColumnQuery,
      sort: this.sort['_direction']
    };
    this.sortableEmit.emit(sortableData);
  }
  onResizeEnd(event) {
    event['height'] = this.tabularView.nativeElement.offsetHeight;
    this.tableHeight = event.rectangle.height - 100;
    this.resizeElement.emit(event);
  }
  onResizing(event) {
    event['height'] = this.tabularView.nativeElement.offsetHeight;
    this.tableHeight = event.rectangle.height - 100;
    this.resizeElement.emit(event);
  }
  collapseTable() {
    this.collapseTabular.emit({'collapse': true});
  }

  customizeColumn() {
    if (this.currentSortables && this.currentSortables.length > 0 ) {
      this.removeDuplicates(this.currentSortables, this.sortables);
    } else {
      this.currentSortables = this.sortables.map(x => Object.assign({}, x));
      this.sortables = [];
    }
    this.sortables = this.sortables.filter(column => column['value'] !== 'checked');
    this.sortables = this.sortables.filter(column => column['value'] !== 'position');
    this.currentSortables = this.currentSortables.filter(column => column['value'] !== 'checked');
    this.currentSortables = this.currentSortables.filter(column => column['value'] !== 'position');
    const dummyCurrentSortable = this.currentSortables.map(x => Object.assign({}, x));
    const ref = this.dialog.open(CustomizeColumnComponent, {
      data: {'sortables': this.sortables, 'currentSortables' : this.currentSortables, origin: 'papulation'},
      width: '700px',
      closeOnNavigation: true,
      panelClass: 'audience-browser-container'
    });

    ref.afterClosed().subscribe(res => {
      if (res) {
        if (!res.clear) {
          this.currentSortables = res.currentSortables;
          this.setLocalStorage(this.currentSortables);
          this.loadTabularData();
        } else {
          this.formatCurrentSortable(dummyCurrentSortable);
        }
      } else {
        this.formatCurrentSortable(dummyCurrentSortable);
      }
    });

  }
  setLocalStorage(customColumns) {
    localStorage.setItem('papulationCustomColumn', JSON.stringify(customColumns));
  }

  /**
   * To format the tabular column close the customized window.
   * @param dummyCurrentSortable assign to CurrentSortable object before open customized column.
   */
  formatCurrentSortable(dummyCurrentSortable) {
    this.setLocalStorage(dummyCurrentSortable);
    this.currentSortables = dummyCurrentSortable;
    const checkboxIndex = this.currentSortables.findIndex(column => column['value'] === 'checked');
    if (checkboxIndex < 0 ) {
      this.currentSortables.splice(0, 0, {
        'name': 'CHECKBOX',
        'displayname': '',
        'value': 'checked'
      });
    }
    const positionIndex = this.currentSortables.findIndex(column => column['value'] === 'position');
    if (positionIndex < 0 ) {
    this.currentSortables.splice(1, 0, {
      'name': 'SLNO',
      'displayname': '#',
      'value': 'position'
    });
    }
  }

  isExist(nameKey, myArray) {
    for (let i = 0; i < myArray.length; i++) {
      if (myArray[i].value === nameKey) {
        return i;
      }
    }
  }

  removeDuplicates(a, b) {
    for (let i = 0, len = a.length; i < len; i++) {
      for (let j = 0, len2 = b.length; j < len2; j++) {
        if (a[i].name === b[j].name) {
            b.splice(j, 1);
            len2 = b.length;
          }
      }
    }
  }

  loadMore() {
    this.scrolled.emit();
  }
  trackByFunction(item, index) {
    return item.geoId;
  }
}
