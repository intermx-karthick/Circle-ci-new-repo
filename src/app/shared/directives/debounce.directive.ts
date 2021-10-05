import { Directive, Input, Output, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, takeUntil} from 'rxjs/operators';

@Directive({
  selector: '[ngModel][debounce]',
})
export class DebounceDirective implements OnInit, OnDestroy {
  @Output()
  public onDebounce = new EventEmitter<any>();

  @Input('debounce')
  public debounceTime = 500;

  private isFirstChange = true;
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  constructor(public model: NgControl) {
  }

  ngOnInit() {
    this.model.valueChanges.pipe(
      takeUntil(this.ngUnsubscribe),
      debounceTime(this.debounceTime))
      .subscribe(modelValue => {
        if (this.isFirstChange) {
          this.isFirstChange = false;
        } else {
          this.onDebounce.emit(modelValue);
        }
      });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
