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
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { Subject } from 'rxjs';
import { fromEvent } from 'rxjs';
import {
  filter,
  switchMap,
  startWith,
  debounceTime,
  takeUntil,
  share,
  switchMapTo
} from 'rxjs/operators';

@Component({
  selector: 'app-imx-dropdown',
  templateUrl: './imxdropdown.component.html',
  styleUrls: ['./imxdropdown.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImxdropdownComponent implements OnInit, OnDestroy {
  @Input() CdkOverlayOrigin: CdkOverlayOrigin;
  @Output() close = new EventEmitter<any>();
  @Output() open = new EventEmitter<any>();

  @ViewChild('dialog') dialog: ElementRef;
  isOpen = false;
  destroy$ = new Subject<any>();
  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    const CdkOverlayOriginEl = this.CdkOverlayOrigin.elementRef.nativeElement;
    // open popup if mouse stopped in CdkOverlayOriginEl (for short time).
    // If user just quickly got over CdkOverlayOriginEl element - do not open

    const open$ = fromEvent(CdkOverlayOriginEl, 'mouseenter').pipe(
      filter(() => !this.isOpen),
      switchMap((enterEvent) => {
        return fromEvent(document, 'mousemove').pipe(
          startWith(enterEvent),
          debounceTime(300),
          filter((event) => {
            if (CdkOverlayOriginEl === event['target']) {
              return true;
            } else {
              if (this.isOpen) {
                this.changeState(
                  this.isMovedOutside(CdkOverlayOriginEl, this.dialog, event)
                );
              }
            }
          })
        );
      }),
      share()
    );
    open$.subscribe((res) => {
      this.changeState(true);
    });

    // close if mouse left the CdkOverlayOriginEl and dialog(after short delay)

    const close$ = fromEvent(document, 'mouseenter').pipe(
      debounceTime(100),
      filter(() => this.isOpen),
      filter((event) => {
        this.isMovedOutside(CdkOverlayOriginEl, this.dialog, event);
        return true;
      }),
      takeUntil(this.destroy$)
    );

    open$.pipe(switchMapTo(close$)).subscribe(() => {
      this.changeState(false);
    });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  connectedOverlayDetach() {
    this.changeState(false);
  }

  private changeState(isOpen: boolean) {
    this.isOpen = isOpen;
    isOpen ? this.open.emit() : this.close.emit();
    this.changeDetectorRef.markForCheck();
  }

  private isMovedOutside(CdkOverlayOriginEl, dialog, event): boolean {
    return (
      CdkOverlayOriginEl.contains(event['target']) ||
      dialog.nativeElement.contains(event['target'])
    );
  }
}
