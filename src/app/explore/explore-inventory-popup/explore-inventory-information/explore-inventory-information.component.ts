import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-explore-inventory-information',
  templateUrl: './explore-inventory-information.component.html',
  styleUrls: ['./explore-inventory-information.component.less']
})
export class ExploreInventoryInformationComponent implements OnInit {

  public inventoryInformation: any;
  public informationClasses = 'z-depth-2 mapPopUpBlk loadingPopup detailed inventory-info';
  public contentHeight: number;
  @Input() infoContent = false;
  copyrightYear: number;
  constructor() { }

  ngOnInit() {
    this.contentHeight = window.innerHeight - 270;
    this.copyrightYear = new Date().getFullYear();
    if (!this.infoContent &&this.inventoryInformation.fileType === 'pdf') {
      this.informationClasses = 'z-depth-2 mapPopUpBlk detailedPdf loadingPopup hide-shadow-pdf';
    }
  }
  onResize() {
    this.contentHeight = window.innerHeight - 270;
  }
}
