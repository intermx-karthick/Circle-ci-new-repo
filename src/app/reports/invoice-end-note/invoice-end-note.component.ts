import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-invoice-end-note',
  templateUrl: './invoice-end-note.component.html',
  styleUrls: ['./invoice-end-note.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceEndNoteComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
