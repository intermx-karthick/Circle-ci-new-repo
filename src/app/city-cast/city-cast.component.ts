import { Component, OnInit, OnDestroy } from '@angular/core';
import { CityCastApiService } from './services/city-cast-api.service';
import { MatDialog } from '@angular/material/dialog';
import { CityCastManageCastComponent } from './city-cast-manage-cast/city-cast-manage-cast.component';
import { takeUntil, map, catchError, filter, switchMap, tap } from 'rxjs/operators';
import { Subject, forkJoin, of } from 'rxjs';
@Component({
  selector: 'app-city-cast',
  templateUrl: './city-cast.component.html',
  styleUrls: ['./city-cast.component.less']
})
export class CityCastComponent implements OnInit, OnDestroy {
  geoscopes = [];
  selectedGeoscope = {};
  selectedScenario = {};
  totalPage = 0;
  currentPage = 1;
  pageSize = 50;
  private unSubscribe: Subject<void> = new Subject<void>();
  constructor(
    private ccAPIService: CityCastApiService,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    this.getScopeList();
    this.ccAPIService
        .getScenarioTitle()
        .pipe(takeUntil(this.unSubscribe))
        .subscribe((scenarioTitle) => {
            this.selectedScenario['title'] = scenarioTitle;

    });
  }
  getScopeList() {
    this.ccAPIService
      .getTFGeoScopeList(this.currentPage, this.pageSize)
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((scopes) => {
        if (this.currentPage <= 1) {
          this.geoscopes = scopes['data'];
          this.totalPage = Math.ceil(
            scopes['pagination']['total'] / this.pageSize
          );
          const selectedGeoscope = this.ccAPIService.getGeoScopeFromLocal();
          const selectedScenario = this.ccAPIService.getScenarioFromLocal();
          if (selectedGeoscope && selectedScenario) {
            this.getScopeAndScenario(
              selectedGeoscope,
              selectedScenario
            ).subscribe();
          } else {
            this.ccAPIService
              .getConfigurations()
              .pipe(
                takeUntil(this.unSubscribe),
                filter((response) => response?.data?.default?.geoscopeId),
                map((response) => response.data.default),
                switchMap((response) =>
                  this.getScopeAndScenario(
                    response['geoscopeId'],
                    response['scenarioId']
                  )
                )
              )
              .subscribe();
          }
        } else {
          this.geoscopes = this.geoscopes.concat(scopes['data']);
        }
      });
  }
  loadMoreScenario() {
    if (this.totalPage >= this.currentPage) {
      this.currentPage = this.currentPage + 1;
      this.getScopeList();
    }
  }
  getScopeAndScenario(geoscopeId, scenarioId) {
    return forkJoin([
      this.ccAPIService.getTFGeoScope(geoscopeId).pipe(
        takeUntil(this.unSubscribe),
        map((response) => response.data),
        catchError((error) => of(null))
      ),
      this.ccAPIService.getTFScenario(scenarioId).pipe(
        takeUntil(this.unSubscribe),
        map((response) => response.data),
        catchError((error) => of(null))
      )
    ]).pipe(
      takeUntil(this.unSubscribe),
      tap((results) => {
        if (results[0] !== null) {
          this.selectedGeoscope = results[0];
          this.ccAPIService.setGeoScope(this.selectedGeoscope);
          if (results[1] !== null) {
            this.selectedScenario = results[1];
            this.ccAPIService.setScenario(this.selectedScenario);
          }
        }
      })
    );
  }
  openGeoscope(scope) {
    this.dialog
      .open(CityCastManageCastComponent, {
        data: {
          scopeID: scope['id']
        },
        width: '500px',
        height: '500px',
        closeOnNavigation: true,
        panelClass: 'manage-cast'
      })
      .afterClosed()
      .pipe(filter((response) => response))
      .subscribe((scenario) => {
        this.selectedGeoscope = scope;
        this.selectedScenario = scenario;
        this.ccAPIService.setGeoScope(scope);
        this.ccAPIService.setScenario(scenario);
      });
  }
  ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }
}