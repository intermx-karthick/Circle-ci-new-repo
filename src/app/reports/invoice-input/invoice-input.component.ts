import {FocusMonitor} from '@angular/cdk/a11y';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  Optional,
  Self,
  ViewChild
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NgControl,
  Validators
} from '@angular/forms';
import {MAT_FORM_FIELD, MatFormField, MatFormFieldControl} from '@angular/material/form-field';
import {Subject} from 'rxjs';

/** Data structure for holding telephone number. */
export class MyTel {
  constructor(
    public initial: string,
    public middle: string,
    public end: string
  ) {}
}
@Component({
  selector: 'app-invoice-input',
  templateUrl: './invoice-input.component.html',
  styleUrls: ['./invoice-input.component.less'],
  providers: [{ provide: MatFormFieldControl, useExisting: InvoiceInputComponent }],
  host: {
    '[class.imx-floating]': 'shouldLabelFloat',
    '[id]': 'id',
  }
})
export class InvoiceInputComponent implements ControlValueAccessor, MatFormFieldControl<MyTel>, OnDestroy {
  static nextId = 0;
  @ViewChild('initial') initialInput: HTMLInputElement;
  @ViewChild('middle') middleInput: HTMLInputElement;
  @ViewChild('end') endInput: HTMLInputElement;

  public parts: FormGroup;
  public stateChanges = new Subject<void>();
  public focused = false;
  public controlType = 'imx-tel-input';
  public id = `imx-tel-input-${InvoiceInputComponent.nextId++}`;
  onChange = (_: any) => {};
  onTouched = () => {};

  get empty() {
    const {
      value: { initial, middle, end }
    } = this.parts;

    return !initial && !middle && !end;
  }

  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  @Input('aria-describedby') userAriaDescribedBy: string;

  @Input()
  get placeholder(): string {
    return this._placeholder;
  }
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }
  private _placeholder: string;

  @Input()
  get required(): boolean {
    return this._required;
  }
  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }
  private _required = false;

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this._disabled ? this.parts.disable() : this.parts.enable();
    this.stateChanges.next();
  }
  private _disabled = false;

  @Input()
  get value(): MyTel | null | any {
    if (this.parts.valid) {
      const {
        value: { initial, middle, end }
      } = this.parts;
      return new MyTel(initial, middle, end);
    }
    return this.isValueHasAtleastOneNumber() ? undefined : "";
  }

  set value(tel: MyTel | null| any) {
    const { initial, middle, end } = tel || new MyTel('', '', '');
    this.parts.setValue({ initial, middle, end });
    this.stateChanges.next();
  }

  get errorState(): boolean {
    return this.parts.invalid && this.isValueHasAtleastOneNumber();
  }

  isValueHasAtleastOneNumber(){
    return (
      this.parts.controls.initial.value.toString().length > 0 ||
      this.parts.controls.middle.value.toString().length > 0 ||
      this.parts.controls.end.value.toString().length > 0
    )
  }

  constructor(
    formBuilder: FormBuilder,
    private _focusMonitor: FocusMonitor,
    private _elementRef: ElementRef<HTMLElement>,
    @Optional() @Inject(MAT_FORM_FIELD) public _formField: MatFormField,
    @Optional() @Self() public ngControl: NgControl) {

    this.parts = formBuilder.group({
      initial: [
        null,
        [Validators.required, Validators.minLength(1), Validators.maxLength(1)]
      ],
      middle: [
        null,
        [Validators.required, Validators.minLength(2), Validators.maxLength(2)]
      ],
      end: [
        null,
        [Validators.required, Validators.minLength(12), Validators.maxLength(12)]
      ]
    });

    _focusMonitor.monitor(_elementRef, true).subscribe(origin => {
      if (this.focused && !origin) {
        this.onTouched();
      }
      this.focused = !!origin;
      this.stateChanges.next();
    });

    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }

  autoFocusNext(control: AbstractControl, nextElement?: HTMLInputElement): void {
    if (!control.errors && nextElement) {
      this._focusMonitor.focusVia(nextElement, 'program');
    }
  }

  autoFocusPrev(control: AbstractControl, prevElement: HTMLInputElement): void {
    if (control.value.length < 1) {
      this._focusMonitor.focusVia(prevElement, 'program');
    }
  }

  ngOnDestroy() {
    this.stateChanges.complete();
    this._focusMonitor.stopMonitoring(this._elementRef);
  }

  setDescribedByIds(ids: string[]) {
    const controlElement = this._elementRef.nativeElement
      .querySelector('.imx-tel-input-container')!;
    controlElement.setAttribute('aria-describedby', ids.join(' '));
  }

  onContainerClick() {
    if (!this.parts.controls.end.valid && !this.parts.controls.middle.valid && !this.parts.controls.initial.valid) {
      this._focusMonitor.focusVia(this.initialInput, 'program');
    }
  }

  writeValue(tel: MyTel | null): void {
    this.value = tel;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  _handleInput(control: AbstractControl, nextElement?: HTMLInputElement): void {
    this.autoFocusNext(control, nextElement);
    this.onChange(this.value);
  }

  static ngAcceptInputType_disabled: boolean | string | null | undefined;
  static ngAcceptInputType_required: boolean | string | null | undefined;

}
