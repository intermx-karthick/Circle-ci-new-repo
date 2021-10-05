import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { CdkOverlayOrigin, ConnectionPositionPair } from '@angular/cdk/overlay';
import { fromEvent, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-filter-overlay',
  templateUrl: './filter-overlay.component.html',
  styleUrls: ['./filter-overlay.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterOverlayComponent implements OnInit, OnDestroy {
  @Input() CdkOverlayOrigin: CdkOverlayOrigin;
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<any>();
  @Output() open = new EventEmitter<any>();
  @Input() cdkClassName = null;
  @Input() cdkPosition = [];
   public panelClass = ['imx-cdk-dropdown'];
  @ViewChild('dialog') dialog: ElementRef;
  protected unSubscribe: Subject<void> = new Subject<void>();
  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  // TODO: Need to create service like popup service for better functionality
  ngOnInit(): void {
    if(this.cdkClassName){
      this.panelClass.push(this.cdkClassName);
    }
    fromEvent<MouseEvent>(document, 'click')
      .pipe(
        filter(() => this.isOpen),
        filter((event) => {
          const CdkOverlayOriginEl = this.CdkOverlayOrigin.elementRef
            .nativeElement;
          const clickTarget = event.target as HTMLElement;
          return !(
            CdkOverlayOriginEl.contains(clickTarget) ||
            this.dialog?.nativeElement.contains(clickTarget)
          );
        }),
        takeUntil(this.unSubscribe)
      )
      .subscribe(() => this.changeState(false));
  }

  connectedOverlayDetach() {
    this.changeState(false);
  }

  private changeState(isOpen: boolean) {
    this.isOpen = isOpen;
    isOpen ? this.open.emit() : this.close.emit();
    this.changeDetectorRef.markForCheck();
  }

  ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }
}
