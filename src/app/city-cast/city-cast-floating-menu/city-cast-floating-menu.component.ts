import { Component, OnInit, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CCSidebarMenuType, CCCastStatuses} from '../classes';

@Component({
    selector: 'app-city-cast-floating-menu',
    templateUrl: './city-cast-floating-menu.component.html',
    styleUrls: ['./city-cast-floating-menu.component.less']
})
export class CityCastFloatingMenuComponent implements OnInit, OnChanges {
    settingsMenu: boolean;
    menuWidth: number;
    @Output() sideNavigation = new EventEmitter();
    @Input() sidePanelData = {};
    @Input() selectedCast;
    @Input() isOpenedSidenav;
    mainmap = CCSidebarMenuType.EXPLORER;
    submap = CCSidebarMenuType.TRACT_NETWORK;
    selectedMenu = '';
    sidebarMenuType = CCSidebarMenuType;
    castStatuses = CCCastStatuses;
    constructor() {}

    ngOnInit() {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes.sidePanelData && changes.sidePanelData.currentValue) {
            this.selectedMenu = changes.sidePanelData.currentValue['type'];
            if (changes.sidePanelData.currentValue['submap']) {
                this.submap = changes.sidePanelData.currentValue['submap'];
            }
        }
        if (changes.selectedCast && changes.selectedCast.currentValue) {
            if (this.selectedCast['status'] !== CCCastStatuses.PUBLISHED){
                this.mainmap = CCSidebarMenuType.EXPLORER;
                this.submap =  CCSidebarMenuType.ROAD_NETWORK;
            }
        }
      }
    /**
     * this is to open side nav with content for selected menu
     * @param {*} selection is which menu is clicked
     * @memberof CityCastFloatingMenuComponent
     */
    openSidePanel(selection, type = 'sidebar') {
        if (this.selectedCast && this.selectedCast['outputAssets']) {
            switch (type) {
                case 'mainmap':
                    this.mainmap = selection;
                    if (selection === CCSidebarMenuType.EXPLORER) {
                        this.submap = CCSidebarMenuType.TRACT_NETWORK;
                    } else {
                        this.submap = CCSidebarMenuType.ROAD_NETWORK;
                    }
                    break;
                case 'submap':
                    this.submap = selection;
                    break;
                default:
                    this.selectedMenu = selection;
                    break;
            }
            this.sideNavigation.emit({
                type: selection,
                menuType: type
            });
        }
    }
}
