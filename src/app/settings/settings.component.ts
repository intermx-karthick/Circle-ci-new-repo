import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.less']
})
export class SettingsComponent implements OnInit {
  subscripeComp: any;
  type: any;
  constructor(
    private route: ActivatedRoute
  ) {}
  ngOnInit() {
    this.subscripeComp = this.route.params.subscribe(params => {
    const type = params['type'];
    if (type !== ''){
      this.type = 'theme';
    } else {
      this.type = type;
    }
    });
  }
  ngOnDestroy() {
    this.subscripeComp.unsubscribe();
  }
}
