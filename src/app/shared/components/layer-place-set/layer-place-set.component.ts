import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
  OnDestroy
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-layer-place-set',
  templateUrl: './layer-place-set.component.html',
  styleUrls: ['./layer-place-set.component.less'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayerPlaceSetComponent implements OnInit ,OnDestroy {
  @Input() filteredPlacePacks;
  @Input() type;
  @Input() isLoading = false;
  @Input() public isSearching = false;
  @Output() layer = new EventEmitter();
  @Output() searchPlaces = new EventEmitter();
  public searchFromCtl = new FormControl('');
  private unSubscribe: Subject<void> = new Subject<void>();
  constructor() { }

  ngOnInit() {
    this.searchFromCtl.valueChanges.pipe(
      debounceTime(500),
      takeUntil(this.unSubscribe)
    ).subscribe( value =>{
      this.isSearching = true;
      this.searchPlaces.emit(value);
    });
  }
  public moveLayer(layer, type, position) {
    this.layer.emit({layer: layer, type: type, position: position});
  }

  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

}
