import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output,
  ViewChild
} from '@angular/core';
import {CdkOverlayOrigin} from '@angular/cdk/overlay';
// import {fromEvent} from 'rxjs/Observable';
import {Subject, fromEvent, Observable} from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { CommonService } from '@shared/services';
@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownComponent implements OnInit , OnDestroy {
  @Input() overlayOrigin: CdkOverlayOrigin;
  @Input() dialogClass: string;
  @Output() close = new EventEmitter<any>();
  @Output() open = new EventEmitter<any>();
  @ViewChild('dialog') dialog: ElementRef;
  isOpened = false;
  unSubscribe = true;
  public customClass = '';

  constructor(private changeDetectorRef: ChangeDetectorRef, private common: CommonService) {
  }

  ngOnInit(): void {
    this.customClass = this.dialogClass;
    const overlayOriginEl = this.overlayOrigin.elementRef.nativeElement;
    this.common
    .getDropdownState()
    .pipe(takeWhile(() => this.unSubscribe))
    .subscribe(state => {
      this.changeState(state);
    });
    const doc$ = fromEvent(document, 'click');
    doc$.subscribe(element => {
      if (this.dialog) {
        const event = this.isMovedOutside(overlayOriginEl, this.dialog, element);
        if (event) {
          this.changeState(false);
        }
      }
    });
  }

  ngOnDestroy(): void {
  this.unSubscribe = false;
  }

  connectedOverlayDetach() {
    this.changeState(false);
  }

  private changeState(isOpened: boolean) {
    this.isOpened = isOpened;
    isOpened ? this.open.emit() : this.close.emit();
    this.changeDetectorRef.markForCheck();
  }

  private isMovedOutside(overlayOriginEl, dialog, event): boolean {

    // to avoid datepicker close on while date range selection
    if (dialog.nativeElement.classList.contains('imx-add-audit-hours')) {
      if (event['target'].className.includes('mat-calendar-body-cell-content')
      || event['target'].className.includes('mat-calendar-body-cell') ) {
        return dialog.nativeElement.contains(event['target']);
      }
    }

    return !(overlayOriginEl.contains(event['target']) || dialog.nativeElement.contains(event['target']));
  }

}
