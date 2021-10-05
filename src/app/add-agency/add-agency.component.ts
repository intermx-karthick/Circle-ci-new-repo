import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-add-agency',
  templateUrl: './add-agency.component.html',
  styleUrls: ['./add-agency.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddAgencyComponent implements OnInit {

  dropdown = [{name: 'Devloper', _id: '9'}, {name: 'Tester', _id: '9'}, {name: 'Hacker', _id: '9'}]
  constructor() { }

  ngOnInit(): void {
  }

}
