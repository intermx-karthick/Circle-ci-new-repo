import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-places-popup',
  templateUrl: './places-popup.component.html',
  styleUrls: ['./places-popup.component.less']
})
export class PlacesPopupComponent implements OnInit {

  public placeDetail: any;

  constructor() { }

  ngOnInit() {
  }
}
