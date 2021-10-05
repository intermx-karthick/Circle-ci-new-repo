import { OnInit, OnDestroy } from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  Input
} from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-phone-number-input',
  templateUrl: './phone-number-input.component.html',
  styleUrls: ['./phone-number-input.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneNumberInputComponent),
      multi: true
    }
  ]
})
export class PhoneNumberInputComponent
  implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() public inputPlaceholder: string;
  @Input() public preferredCountries: string[] = ['us', 'gb'];
  @Input() public enableSearch = true;
  @Input() public format: 'national' | 'international' = 'national';

  public phoneNumber = new FormControl('');
  public subscribtion: Subscription;

  public onChange: any = () => {};
  public onTouched: any = () => {};

  public writeValue(value: any[]): void {
    if (!value) {
      return;
    }
  }

  public ngOnInit() {
    this.subscribtion = this.phoneNumber.valueChanges.subscribe((val) => {
      this.onChange(val);
    });
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public ngOnDestroy() {
    this.subscribtion.unsubscribe();
  }
}
