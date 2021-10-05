import {Component, OnInit, OnDestroy} from '@angular/core';
import {ExploreDataService} from '@shared/services';
import {takeWhile} from 'rxjs/operators';

@Component({
  selector: 'app-explore-legends',
  templateUrl: './explore-legends.component.html',
  styleUrls: ['./explore-legends.component.less']
})
export class ExploreLegendsComponent implements OnInit, OnDestroy {
  public show = false;
  objectKeys = Object.keys;
  private unSubscribe = true;
  public legends: any = [];
  constructor(
    private dataService: ExploreDataService
  ) {
  }

  ngOnInit() {
    this.dataService
      .keyLegendsSubscriber()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe(result => {
        this.legends = result;
      });
  }

  public toggle() {
    this.show = !this.show;
  }
  ngOnDestroy() {
    this.legends = [];
    this.unSubscribe = false;
  }
}
