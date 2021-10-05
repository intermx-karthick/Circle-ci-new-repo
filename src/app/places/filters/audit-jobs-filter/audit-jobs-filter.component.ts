import { CollectionViewer, SelectionChange } from '@angular/cdk/collections';
import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, Injectable, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, ViewChild } from '@angular/core';
import { BehaviorSubject, merge, Observable, Subject, combineLatest, of } from 'rxjs';
import { map, takeUntil, filter, debounceTime, distinctUntilChanged, switchMap, catchError,tap } from 'rxjs/operators';
import { PlacesFiltersService } from '../places-filters.service';
import { PlaceDetails, PlaceAuditState, AuditPlaceNode, Place, AuditedPlace } from '@interTypes/Place-audit-types';
import { MatTree } from '@angular/material/tree';
import { FormControl } from '@angular/forms';
import { ConfirmationDialog } from '@interTypes/workspaceV2';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';


/**
 * Database for dynamic data. When expanding a node in the tree, the data source will need to fetch
 * the descendants data from the database.
 */
@Injectable()
export class AuditPlacesDatabase {
  dataMap = [];

  setData(data) {
    this.dataMap = data;
  }

  /** Initial data from database */
  initialData(): AuditPlaceNode[] {
    const nodes = [];
    this.dataMap.map(node => {
      const tempnode = new AuditPlaceNode(
        node.client_name,
        // node['clients'].length,
        Number(node.count),
        0,
        '',
        node.client_id,
        true
      );
      const children = this.getChildren(tempnode);
      children['childrens'].map(data => {
        data.level = 1;
        const temp = new AuditPlaceNode(
          data.name,
          data.count,
          data.level,
          data.placeId,
          data.id,
          true,
          false,
          data.parent,
          node.parent
        );
        tempnode.children.push(temp);
      });
      nodes.push(tempnode);
    });
    return nodes;
  }

  getChildren(node: AuditPlaceNode, paginationInfo = { total: 1, page: 1 }) {
    let childrens = [];
    let sIndex = 0;
    let cIndex = 0;
    if (node && this.dataMap) {
      switch (node.level) {
        case 0:
          const statusIndex = this.dataMap.findIndex(data => data.client_name === node.name);
          const status = this.dataMap[statusIndex];
          if (status && status['statuses']) {
            childrens = status['statuses'].map(client => {
              return {
                'name': client.status,
                'count': client.count,
                // 'count': client['locations'].length,
                'placeId': '',
                'id': client.audit_status_cd,
                'parent': node.id,
              };
            });
          }
          break;
        case 1:
          const levelClientIndex = this.dataMap.findIndex(data => data.client_id === node.parent);
          const levelClient = this.dataMap[levelClientIndex];
          sIndex = levelClientIndex;
          if (levelClient && levelClient['statuses']) {
            const statusesIndex = levelClient['statuses'].findIndex(data => data.audit_status_cd === node.id);
            cIndex = statusesIndex;
            const client = levelClient['statuses'][statusesIndex];
            if (paginationInfo['page'] && paginationInfo['total'] && (paginationInfo['page'] <= paginationInfo['total'])) {
              const c = client['locations'].slice((paginationInfo['page'] - 1) * 100, (((paginationInfo['page'] - 1) * 100) + 100));
              childrens = c.map(location => {
                return {
                  'name': location.location_name,
                  'count': 0,
                  'placeId': Number(location.place_id),
                  'id': location.id,
                  'parent': client.client_id
                };
              });
            }
          }
          break;
        default:
          break;
      }
    }
    return { childrens: childrens, cIndex: cIndex, sIndex: sIndex };
  }
  getSiblings(node: AuditPlaceNode) {
    let siblings = [];
    if (node) {
      switch (node.level) {
        case 2:
          const levelStatus = this.dataMap.filter(data => data.status === node.superParent)[0];
          if (levelStatus && levelStatus['clients']) {
            const client = levelStatus['clients'].filter(data => data.client_id === node.parent)[0];
            siblings = client['locations'];
          }
          break;
        default:
          break;
      }
    }
    return siblings;
  }
  isExpandable(node: AuditPlaceNode): boolean {
    // return node.level < 2 && this.getChildren(node)['childrens'].length > 0;
    return node.level < 2 && node.count > 0;
  }
}
/**
 * File database, it can build a tree structured Json object from string.
 * Each node in Json object represents a file or a directory. For a file, it has filename and type.
 * For a directory, it has filename and children (a list of files or directories).
 * The input will be a json object string, and the output is a list of `FileNode` with nested
 * structure.
 */
@Injectable()
export class DynamicDataSource {

  dataChange = new BehaviorSubject<AuditPlaceNode[]>([]);
  childrens = new Subject();
  public paginationInfo = {};
  public treeElement;
  public unSubscribeExpansionModel: Subject<void> = new Subject<void>();
  public data: AuditPlaceNode[] = [];
  /* get data(): AuditPlaceNode[] { return this.dataChange.value; }
  set data(value: AuditPlaceNode[]) {
    this._treeControl.dataNodes = value;
    this.dataChange.next(value);
  } */

  constructor(private _treeControl: NestedTreeControl<AuditPlaceNode>,
    private _database: AuditPlacesDatabase) { }

  connect(collectionViewer: CollectionViewer): Observable<AuditPlaceNode[]> {
    this._treeControl.expansionModel.changed.pipe(takeUntil(this.unSubscribeExpansionModel)).subscribe(change => {
      if ((change as SelectionChange<AuditPlaceNode>).added ||
        (change as SelectionChange<AuditPlaceNode>).removed) {
        this.handleTreeControl(change as SelectionChange<AuditPlaceNode>);
      }
    });
    return merge(collectionViewer.viewChange, this.dataChange).pipe(map(() => this.data));
  }
  getTreeChildrens(): Observable<any> {
    return this.childrens.asObservable();
  }
  /** Handle expand/collapse behaviors */
  handleTreeControl(change: SelectionChange<AuditPlaceNode>) {
    if (change.added) {
      change.added.forEach(node => this.toggleNode(node));
    }
    if (change.removed) {
      change.removed.slice().reverse().forEach(node => this.toggleNode(node));
    }
  }

  /**
   * Toggle the node, remove from display list
   */
  toggleNode(node: AuditPlaceNode) {
    if (node.isExpand) {
      node.isExpand = false;
      return;
    } else {
      if (!node.isExpand && node.children.length > 0) {
        node.isExpand = true;
        $('#parent' + node.id + node.parent).click();
        return;
      }
      if (node.level === 1) {
        node.isExpand = true;
        this.childrens.next(node);
        $('#parent' + node.id + node.parent).click();
      }
      // const index = node.name + '-' + node.parent;
      // let paginationInfo = this.paginationInfo[index];
      // if (!paginationInfo) {
      //   paginationInfo = { total: Math.ceil(node.count / 100), page: 1 };
      // } else {
      //   paginationInfo['page'] = paginationInfo['page'] + 1;
      // }
      // this.paginationInfo[index] = paginationInfo;
      // if (paginationInfo['page'] <= paginationInfo['total']) {
      //   node.isLoading = true;
      //   const children = this._database.getChildren(node, paginationInfo);
      //   console.log('children', children);
      //   if (!children) { // If no children, or cannot find the node, no op
      //     return;
      //   }
      //   const nodes = [];
      //   setTimeout(() => {
      //     children['childrens'].map(data => {
      //       data.level = node.level + 1;
      //       const temp = new AuditPlaceNode(
      //         data.name,
      //         data.count,
      //         data.level,
      //         data.placeId,
      //         data.id,
      //         this._database.isExpandable(data),
      //         false,
      //         data.parent,
      //         node.parent
      //       );
      //       node.children.push(temp);
      //       nodes.push(temp);
      //     });
      //     console.log('asda');
      //     console.log('nodes', nodes);
      //     this.childrens.next(nodes);
      //     node.isLoading = false;
      //     node.isExpand = true;
      //     const tempData = JSON.parse(JSON.stringify(this.data));
      //     this.data = tempData;
      //     this.dataChange.next(tempData);

      //     // setTimeout(() => {
      //     //   console.log('scrol', '#parent' + node.id + node.parent);
      //     //   console.log($('#parent' + node.id + node.parent).scrollTop());
      //     //   $('app-audit-jobs-filter .mat-tree').animate({
      //     //     scrollTop: $('#parent' + node.id + node.parent).scrollTop()
      //     //   });
      //     // }, 2000);
      //     /* $('app-audit-jobs-filter .mat-tree').animate({
      //       scrollTop: event.target.offsetTop
      //     }); */
      //   }, 1000);
      // }
    }
  }
}

/**
 * @title Tree with dynamic data
 */
@Component({
  selector: 'app-audit-jobs-filter',
  templateUrl: './audit-jobs-filter.component.html',
  styleUrls: ['./audit-jobs-filter.component.less'],
  providers: [AuditPlacesDatabase],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditJobsFilterComponent implements OnInit, OnDestroy {
  constructor(
    private database: AuditPlacesDatabase,
    private placesFilterService: PlacesFiltersService,
    private cdRef: ChangeDetectorRef,
    private dialog: MatDialog
  ) {
    this.treeControl = new NestedTreeControl<AuditPlaceNode>(this.getChildren);
    this.dataSource = new DynamicDataSource(this.treeControl, database);
  }
  treeChildren = {};
  dataLoadedAPI = false;
  private unSubscribe: Subject<void> = new Subject<void>();
  public selectedAuditPlaceID: number;
  public selectedAuditNode: AuditPlaceNode;
  treeControl: NestedTreeControl<AuditPlaceNode>;
  // @ViewChild('treeSelector', { static: false }) tree: MatTree<any>;
  dataSource: DynamicDataSource;
  public searchFromCtl = new FormControl('');
  private isEnableNewPlace = false;
  getChildren = (node: AuditPlaceNode): AuditPlaceNode[] => node.children;

  getLevel = (node: AuditPlaceNode) => node.level;

  isExpandable = (node: AuditPlaceNode) => node.expandable;

  hasChild = (_: number, _nodeData: AuditPlaceNode) => _nodeData.expandable;

  ngOnInit() {
    this.loadAuditPlaces();
    this.dataSource.getTreeChildrens().subscribe(data => {
      if (data !== null) {
        this.loadMorePanels(data);
        this.dataSource.childrens.next(null);
      }
    });
    this.placesFilterService.getPlaceAudit().pipe(takeUntil(this.unSubscribe)).subscribe(data => {
      if (data && data.currentPlace) {
        this.selectedAuditPlaceID = Number(data.currentPlace['id'] && data.currentPlace['id'] || data.currentPlace['place_id']);
        this.cdRef.markForCheck();
      } else {
        this.selectedAuditPlaceID = null;
      }
    });
    this.placesFilterService.loadNextPlace().pipe(takeUntil(this.unSubscribe)).subscribe(flag => {
      if (flag) {
        this.placesFilterService.setLoadNextPlace(false);
        this.loadNextPlace();
      }
    });
    this.placesFilterService.reloadAuditPlace().pipe(takeUntil(this.unSubscribe)).subscribe(flag => {
      if (flag) {
        this.placesFilterService.setReloadAuditPlace(false);
        this.loadAuditPlaces();
      }
    });

    this.placesFilterService.getDeleteUdpPlace().pipe(takeUntil(this.unSubscribe))
    .subscribe( data => {
      this.removeDeletedPlace(data);
    });

    this.placesFilterService.getCreateNewPlace().pipe(takeUntil(this.unSubscribe))
      .subscribe(data => {
        if(data && data['open']) {
          this.isEnableNewPlace = true;
        } else {
          this.isEnableNewPlace = false;
        }
    });



    this.searchFromCtl.valueChanges.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      takeUntil(this.unSubscribe),
      tap(() => this.dataLoadedAPI = false),
      switchMap(searchStr => {
       const searchText =  searchStr && searchStr.toString().trim();
       this.dataSource.data = [];
       this.dataSource.unSubscribeExpansionModel.next();
       this.dataLoadedAPI = false;
       this.dataSource.paginationInfo = {};
       this.treeChildren = {};
       this.cdRef.markForCheck();
       this.dataSource.treeElement = this.cdRef;
        return this.placesFilterService.getAuditPlaces(true, 0, null, null, 1, searchText)
          .pipe(catchError(error => {
            console.log(error);
            this.cdRef.markForCheck();
            return of({audited_places: []});
          }));
      }),
      tap(() => this.dataLoadedAPI = true)
    ).subscribe(response => {
      this.dataSource.unSubscribeExpansionModel.next();
      this.database.setData(response['audited_places']);
      this.dataSource.data = this.database.initialData();
      this.cdRef.markForCheck();
    });
  }
  refreshAuditPlaces() {
    this.loadAuditPlaces();
  }

  
  loadAuditPlaces() {
    const searchText =  this.searchFromCtl.value && this.searchFromCtl.value.toString().trim();
    this.dataSource.data = [];
    this.dataSource.unSubscribeExpansionModel.next();
    this.dataLoadedAPI = false;
    this.dataSource.paginationInfo = {};
    this.treeChildren = {};
    this.cdRef.markForCheck();
    this.dataSource.treeElement = this.cdRef;
    this.placesFilterService.getAuditPlaces(true, 0, null, null, 1, searchText).pipe(takeUntil(this.unSubscribe)).subscribe(data => {
      this.dataLoadedAPI = true;
      this.dataSource.unSubscribeExpansionModel.next();
      this.database.setData(data['audited_places']);
      this.dataSource.data = this.database.initialData();
      this.cdRef.markForCheck();
    }, error => {
      this.dataLoadedAPI = true;
      this.database.setData([]);
      this.dataSource.data = [];
      this.cdRef.markForCheck();
    });
  }

  public openPlaceDetails(node: AuditPlaceNode) {
    if (this.isEnableNewPlace) {
      const data: ConfirmationDialog = {
        notifyMessage: false,
        confirmDesc: '<h4 class="confirm-text-icon">Your changes to the place will not be saved. Would you like to continue?</h4>',
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel',
        headerCloseIcon: false
      };
      this.dialog.open(ConfirmationDialogComponent, {
        data: data,
        width: '586px'
      }).afterClosed().subscribe(result => {
        if (result && result.action) {
            this.isEnableNewPlace = false;
            this.openPlaceDetailsPlace(node);
        }
    });
    } else {
      this.openPlaceDetailsPlace(node)
    }
  }

  public openPlaceDetailsPlace(node: AuditPlaceNode): void {
    if (node.level === 2) {
      this.selectedAuditNode = node;
      // resetting  building arear and property area layers toggle state
      this.placesFilterService.resetLayersToggleState();
      const request: Observable<PlaceDetails> = this.placesFilterService
        .getAuditedPlaceByID(node.placeId);
      /* if (!node.placeId) {
        request = this.placesFilterService
          .getUnAuditedPlaceByID(node.id, node.parent);
      } */
      request
        .pipe(map((response: PlaceDetails) => response.place))
        .subscribe((place: Place) => {
          place['status'] = node.parent;
          const newState: PlaceAuditState = {
            currentPlace: place,
            clientId: node.superParent
          };
          this.placesFilterService.setClearPlaseSetFilter({ clear: true });
          this.placesFilterService.setPlaceAudit(newState);

        });
    }
  }

  /**
   * This function remove the deleted place form the list
   */
  removeDeletedPlace(deletePlace) {
    const client_id = deletePlace['client_id'];
    const parent = this.selectedAuditNode['parent'];
    if(this.treeChildren && this.treeChildren[client_id] && parent) {      
     const index = this.treeChildren[client_id][parent].findIndex(place=> place.placeId == deletePlace['place_id']);
      if (index >-1 ) {
        this.treeChildren[client_id][parent].splice(index, 1);
        this.cdRef.markForCheck();
      }
    }
  }


  loadNextPlace() {
    let siblings = [];
    const node = this.selectedAuditNode;
    if (node
      && node.placeId) {
      const levelStatus = this.database.dataMap.filter(data => data.client_id === node.superParent)[0];
      let clients = [];
      let clientIndex;
      let parent;
      let client = null;
      if (levelStatus && levelStatus['statuses']) {
        clients = levelStatus['statuses'];
        clientIndex = clients.findIndex(data => data.audit_status_cd === node.parent);
        client = clients[clientIndex];
      }
      if (this.treeChildren
        && this.treeChildren[node.superParent]
        && this.treeChildren[node.superParent][node.parent]) {
          siblings = this.treeChildren[node.superParent][node.parent];
        }
      let siblingNode;
      if (siblings.length > 0) {
        const siblingIndex = siblings.findIndex(sibling => {
          if (sibling.placeId === this.selectedAuditNode.placeId) {
            return true;
          }
        });
        if (siblingIndex !== -1 && siblings.length > siblingIndex + 1) {
          siblingNode = siblings[siblingIndex + 1];
          parent = this.selectedAuditNode.parent;
          if (siblingNode) {
            this.openPlaceDetails(siblingNode);
          } else {
            this.selectedAuditNode = null;
            this.placesFilterService.setPlaceAudit(null);
          }
        } else {
          let tempClient = null;
          if (client !== null && client['count']) {
            if (client['count'] > siblingIndex + 1) {
              tempClient = new AuditPlaceNode(
                client['status'],
                client['count'],
                1,
                '',
                client['audit_status_cd'],
                true,
                false,
                node.superParent,
                ''
              );
            } else {
              let loop = true;
              while (loop) {
                if (clientIndex !== -1 && clients.length > clientIndex + 1) {
                  clientIndex = clientIndex + 1;
                  const clientDummy = clients[clientIndex];
                  if (this.treeChildren
                    && this.treeChildren[levelStatus.client_id]
                    && this.treeChildren[levelStatus.client_id][clientDummy.audit_status_cd]) {
                    if (this.treeChildren[levelStatus.client_id][clientDummy.audit_status_cd].length > 0) {
                      const dummySiblings = this.treeChildren[levelStatus.client_id][clientDummy.audit_status_cd];
                      this.openPlaceDetails(dummySiblings[0]);
                      loop = false;
                      return false;
                    } else {
                      continue;
                    }
                  } else {
                    tempClient = new AuditPlaceNode(
                      clientDummy['status'],
                      clientDummy['count'],
                      1,
                      '',
                      clientDummy['audit_status_cd'],
                      true,
                      false,
                      levelStatus.client_id,
                      ''
                    );
                    loop = false;
                  }
                } else {
                  loop = false;
                }
              }
              if (tempClient !== null) {
                this.loadMorePanels(tempClient, true);
              } else {
                this.selectedAuditNode = null;
                this.placesFilterService.setPlaceAudit(null);
              }
          }
          /* let loop = true;
          while (loop) {
            if (clientIndex !== -1 && clients.length > clientIndex + 1) {
              clientIndex = clientIndex + 1;
              const client = clients[clientIndex];
              if (client['locations'] && client['locations'].length > 0) {
                const tempSiblings = client['locations'];
                if (tempSiblings.length > 0) {
                  siblingNode = tempSiblings[0];
                  parent = client['client_id'];
                  loop = false;
                }
              }
            } else {
              loop = false;
            }
          } */
        }
        }
      }
    } else {
      this.selectedAuditNode = null;
      this.placesFilterService.setPlaceAudit(null);
    }
  }
  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
    this.dataSource.unSubscribeExpansionModel.next();
    this.dataSource.unSubscribeExpansionModel.complete();
  }

  loadMorePanels(node, fromNextPlace = false) {
    const index = node.name + '-' + node.parent;
    let paginationInfo = this.dataSource.paginationInfo[index];
    if (!paginationInfo) {
      paginationInfo = { total: Math.ceil(node.count / 100), page: 1 };
    } else {
      paginationInfo['page'] = paginationInfo['page'] + 1;
    }
    this.dataSource.paginationInfo[index] = paginationInfo;
    node.isLoading = true;
    const searchText =  this.searchFromCtl.value && this.searchFromCtl.value.toString().trim();
    this.placesFilterService.getAuditPlaces(true, 100, node.parent, node.id, paginationInfo.page, searchText)
      .pipe(
        takeUntil(this.unSubscribe),
        filter(response =>
          typeof response['audited_places'] !== 'undefined'
          && typeof response['audited_places'][0] !== 'undefined'
          && typeof response['audited_places'][0]['statuses'] !== 'undefined'
          && typeof response['audited_places'][0]['statuses'][0] !== 'undefined'
          && typeof response['audited_places'][0]['statuses'][0]['locations'] !== 'undefined'),
        map(response => response['audited_places'][0]['statuses'][0]['locations'])
      )
      .subscribe(children => {
        if (children) {
          if (!this.treeChildren[node.parent]) {
            this.treeChildren[node.parent] = {};
          }
          if (!this.treeChildren[node.parent][node.id]) {
            this.treeChildren[node.parent][node.id] = [];
          }
          children.map(data => {
            data.level = node.level + 1;
            const temp = new AuditPlaceNode(
              data.location_name,
              0,
              data.level,
              Number(data.place_id),
              data.id,
              false,
              false,
              node.id,
              node.parent
            );
            this.treeChildren[node.parent][node.id].push(temp);
          });
          node.isLoading = false;
          if (fromNextPlace) {
            this.loadNextPlace();
          }
          this.cdRef.markForCheck();
        }
      });
  }
}
