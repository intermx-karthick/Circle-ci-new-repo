import { Component, OnInit, OnDestroy} from '@angular/core';
import { PlacesFiltersService } from '../filters/places-filters.service';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-places-header',
  templateUrl: './places-header.component.html',
  styleUrls: ['./places-header.component.less']
})
export class PlacesHeaderComponent implements OnInit, OnDestroy {
  public currentTab = '';
  private open = false;
  public audienceLicense = {};
  unSubscribe = true;
  constructor(
    private filtersService: PlacesFiltersService,
  ) { }

  ngOnInit() {
    this.filtersService.getFilterSidenav()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe(tabState => {
        if (!tabState['open']) {
          this.currentTab = '';
        } else if (tabState['open']) {
          this.open = true;
          this.currentTab = tabState['tab'];
        }
    });
  }
  ngOnDestroy() {
    this.unSubscribe = false;
  }
  openFilterSiderbar(tab) {
    if (this.open && this.currentTab === tab) {
      this.open = !this.open;
    } else {
      this.open = true;
    }
    this.currentTab = tab;
    let selectedTab;

    switch (tab) {
      case 'myPlaces':
        selectedTab = 1;
        break;
      case 'layers':
        selectedTab = 2;
        break;
      default:
        selectedTab = 0;
        break;
    }
    const sidenav = {open: this.open, tab: tab};
    this.filtersService.savePlacesSession('selectedTab', {open: this.open, tab: tab});
    this.filtersService.setFilterSidenav(sidenav);
  }
  mouseHover(event) {
    this.filtersService.setFilterSidenavOut(true);
  }
  mouseLeave(event) {
    this.filtersService.setFilterSidenavOut(false);
  }
}
