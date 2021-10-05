import {Component, Input, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '@shared/services';

@Component({
  selector: 'app-library-navigation',
  templateUrl: './library-navigation.component.html',
  styleUrls: ['./library-navigation.component.less']
})
export class LibraryNavigationComponent implements OnInit {
  @Input() public activeRoute: string;
  public isExpanded = false;
  public isExploreAllowed = false;
  public isPlacesAllowed = false;
  public isPopulationAllowed;
  public tooltip = '';
  constructor(private route: Router, private auth: AuthenticationService,
    ) { }
  ngOnInit() {
    this.isExploreAllowed = this.auth.getModuleAccess('explore');
    this.isPlacesAllowed = this.auth.getModuleAccess('places');
    this.isPopulationAllowed = this.auth.getModuleAccess('populationLibrary');
    if (this.activeRoute === 'inventory') {
      this.tooltip = 'Inventory Library';
    } else if (this.activeRoute === 'population') {
      this.tooltip = 'Population Library';
    } else if (this.activeRoute === 'places') {
      this.tooltip = 'Places Library';
    }
  }
  public toggleExpansionState() {
    this.isExpanded = !this.isExpanded;
  }
  public navigate(path) {
    this.route.navigate([path]);
  }

}
