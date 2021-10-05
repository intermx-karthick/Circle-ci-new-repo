import { Component, OnInit, OnDestroy } from '@angular/core';
@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit, OnDestroy {

  bodyClasses = 'skin-black sidebar-mini';
  body: HTMLBodyElement = document.getElementsByTagName('body')[0];

  constructor(
  ) { }

  ngOnInit() {
    const self = this;
    this.body.classList.add('skin-black');
    this.body.classList.add('sidebar-mini');
  }

  ngOnDestroy() {
    // remove the the body classes
    this.body.classList.remove('skin-black');
    this.body.classList.remove('sidebar-mini');
    // this.body.classList.remove('sidebar-collapse');
  }

}
