import {Component, OnInit, OnDestroy, Input, Output, EventEmitter} from '@angular/core';
import {MapLegendsService} from '@shared/services';
import {takeWhile} from 'rxjs/operators';

@Component({
  selector: 'app-map-legends',
  templateUrl: './map-legends.component.html',
  styleUrls: ['./map-legends.component.less']
})
export class MapLegendsComponent implements OnInit, OnDestroy {
  public show = false;
  objectKeys = Object.keys;
  private unSubscribe = true;
  public legends: any = [];
  public areaLegends: any = [];
  public selectedOptions: any = [];
  @Input() module: any;
  @Output() toggleAreaLayers: EventEmitter<any> = new EventEmitter();
  @Input() layerType: any;
  constructor(
    private dataService: MapLegendsService
  ) {
  }

  ngOnInit() {
    this.dataService
      .keyLegendsSubscriber()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe(result => {
         this.legends = result[this.layerType] || [];
      });
    this.dataService
      .placeAreaLegendsSubscriber()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe(result => {
        this.areaLegends = [];
        this.objectKeys(result).forEach(key => {
          this.areaLegends.push(result[key][0]);
        });
        this.selectedOptions = [...this.areaLegends];
      });
  }

  public toggle() {
    this.show = !this.show;
  }
  ngOnDestroy() {
    this.legends = [];
    this.unSubscribe = false;
  }

  public onSelectOption() {
    this.toggleAreaLayers.emit(this.selectedOptions);
  }

  public compare(c1, c2) {
    return c1 && c2 && c1['type'] === c2['type'];
  }
}
