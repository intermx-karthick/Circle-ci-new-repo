import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-places-simple-popup',
  templateUrl: './places-simple-popup.component.html',
  styleUrls: ['./places-simple-popup.component.less']
})
export class PlacesSimplePopupComponent implements OnInit {
  public placeDetail: any;

  constructor() { }

  ngOnInit() {
  }
}
