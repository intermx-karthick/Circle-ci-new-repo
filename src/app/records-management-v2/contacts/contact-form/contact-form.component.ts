import { UserActionPermission } from './../../../Interfaces/user-permission';
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  forwardRef,
  ViewChild,
  OnDestroy,
  ChangeDetectorRef,
  EventEmitter,
  Output,
  ViewChildren
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  FormGroup,
  NgForm,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Subject, BehaviorSubject } from 'rxjs';
import { CustomValidators } from 'app/validators/custom-validators.validator';
import { filter, takeUntil } from 'rxjs/operators';

import { RecordsPagination } from '@interTypes/pagination';
import { ContactType } from '@interTypes/records-management/contacts';
import { RecordService } from 'app/records-management-v2/record.service';
import { ContactAbstract } from '../contact-abstract';
import { MyTel } from 'app/records-management-v2/telephone/telephone-input/telephone-input.component';
import { Patterns } from '@interTypes/enums';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ActivatedRoute, Router } from '@angular/router';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { forbiddenNamesValidator } from '@shared/common-function';
import { CkEditorConfig } from '@constants/ckeditor-config';


/**
 * @description
 *  This is the reusable contact form component. use it
 *  possible places.
 *
 *  @example
 *     <app-contact-form formControlName="contacts"></app-contact-form>
 */
@Component({
  selector: 'app-contact-form',
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ContactFormComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ContactFormComponent),
      multi: true
    }
  ]
})
export class ContactFormComponent extends ContactAbstract
  implements OnInit, OnDestroy, ControlValueAccessor {
  public contactTypes: ContactType[] = [];
  @Input() submitForm$: Subject<void> = new Subject<void>();
  @Input() public isEditForm = false;
  @Input() public enableDuplicate = false;
  // Set default orginazation if available
  @Input() public organization;
  @Input() public moduleContactId;
  public contactForm: FormGroup;
  @ViewChild('contactFormRef') contactFormRef: NgForm;
  private unsubscribe: Subject<void> = new Subject();
  public contactTypePagination: RecordsPagination = {
    perPage: 10,
    page: 1
  };
  public isContactTypesLoading = false;
  public panelCompanyContainer: string;
  public selectedCompany: any = {};
  public contsctNoteId$ = new BehaviorSubject(null);
  public moduleName = 'contact';
  public parentCompanyName = '';
  @Output() public contactNoteUpdateEmit = new EventEmitter();
  @Input() public containerScrolling$: Subject<string>;
  @ViewChild('companyInputRef', {read: MatAutocompleteTrigger})
  public companyAutoCompleteTrigger: MatAutocompleteTrigger;
  @Input() public scrollingContainer:string;
  @ViewChild('contactFormAddress') contactFormAddress;
  @Input() userPermission: UserActionPermission;
  
public showEditor = false;
  public editorConfig = CkEditorConfig;
  constructor(
    private fb: FormBuilder,
    public cdRef: ChangeDetectorRef,
    public recordService: RecordService,
    private activeRoute:ActivatedRoute,
    private router: Router,
  ) {
    super(recordService, cdRef);
  }

  public ngOnInit(): void {
    this.buildForm();
    this.loadContactTypes();
    this.loadCompanies();
    this.listenForContainerScroll();
    this.setFilterCompanySubscribtion(this.contactForm, 'company', () => {
      this.selectedCompany = {};
      this.parentCompanyName = '';
      this.cdRef.markForCheck();
    });
    this.submitForm$.pipe(takeUntil(this.unsubscribe)).subscribe(() => {
      this.contactFormRef.onSubmit(undefined);
      this.cdRef.markForCheck();
    });

    this.activeRoute.params.pipe(
      takeUntil(this.unsubscribe)
    ).subscribe((params) => {
      if(params?.['id']){
        this.contsctNoteId$.next(params['id']);
      }else if(this.organization && this.moduleContactId){
        if(this.organization?.organizationType == 'Vendor'){
          this.moduleName = 'vendorContact';
        }else if(this.organization?.organizationType == 'Client'){
          this.moduleName = 'clientContact';
        }else if(this.organization?.organizationType == 'Agency'){
          this.moduleName = 'agencyContact';
        }

        const noteDetails = {
          type: 'moduleContact',
          organizationId: this.organization?._id,
          contactId: this.moduleContactId,
          moduleName: this.moduleName
        };
         this.contsctNoteId$.next(noteDetails);
      }

    });
  }

  ngAfterViewInit() {
    if (!!this.isEditForm && !this.userPermission?.edit) {
      this.contactForm?.disable();
      this.contactFormAddress?.formGroup?.disable();
    }
  }

  private buildForm() {
    this.contactForm = this.fb.group({
      firstName: [
        null,
        [Validators.required, CustomValidators.noWhitespaceValidator(true), Validators.maxLength(64)]
      ],
      lastName: [
        null,
        [Validators.required, CustomValidators.noWhitespaceValidator(true), Validators.maxLength(64)]
      ],
      companyType: [null],
      company: [null, Validators.required, forbiddenNamesValidator],
      type: [null],
      title: [null, [CustomValidators.noWhitespaceValidator(false)]],
      email: [
        null,
        [
          CustomValidators.multipleEmailValidate,
          CustomValidators.noWhitespaceValidator(false)
        ]
      ],
      mobile: [null, [CustomValidators.telephoneInputValidator]],
      office: [null, [CustomValidators.telephoneInputValidator]],
      ext: [
        null,
        [Validators.pattern(Patterns.EXT_PATTERN), Validators.maxLength(6)]
      ],
      fax: [null, [CustomValidators.telephoneInputValidator]],
      address: [null],
      current: [null],
      note: [null, [Validators.minLength(1), Validators.maxLength(2000), CustomValidators.noWhitespaceValidator(false)]]
    });

    /** Set organization if exist  */
    if(this.organization) {
      this.contactForm['controls']?.['company'].disable();
    }

  }

  public registerOnChange(fn: any): void {
    this.contactForm.valueChanges.subscribe(fn);
  }

  public registerOnTouched(fn: any): void {
    this.contactForm.valueChanges.subscribe(fn);
  }

  public writeValue(contact: any): void {
    this.contactForm.patchValue({
      firstName: contact.firstName,
      lastName: contact.lastName,
      companyType: contact.companyType,
      company: contact.company,
      type: contact.type?.['_id'],
      title: contact.title,
      email: contact.email,
      mobile: this.splitValuesInMyTelFormat(contact.mobile),
      office: this.splitValuesInMyTelFormat(contact.office),
      ext: contact.ext,
      fax: this.splitValuesInMyTelFormat(contact.fax),
      current: contact?.current ?? false,
      address: {
        address: contact?.address?.address,
        zipCode: contact?.address?.zipcode,
        city: contact?.address?.city,
        state: contact?.address?.state
      },
      note: contact.note
    });

    if (contact?.parentCompanyName) {
      this.parentCompanyName = contact.parentCompanyName;
    }
  }

  splitValuesInMyTelFormat(value) {
    if (!value) {
      return new MyTel('', '', '');
    }
    const tempVal = value.toString();
    return new MyTel(
      tempVal.slice(0, 3),
      tempVal.slice(3, 6),
      tempVal.slice(6, 10)
    );
  }
  validate(c: AbstractControl): ValidationErrors | null {
    return this.contactForm.valid
      ? null
      : {
          invalidForm: { valid: false, message: 'Contact fields are invalid' }
        };
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  public updateCompanyContainer() {
    this.panelCompanyContainer = '.company-list-autocomplete';
  }

  public companyDisplayWithFn(company) {
    return company?.name ?? '';
  }

  public companyTrackByFn(idx: number, company) {
    return company?._id ?? idx;
  }

  public onCompanySelection(event) {
    this.selectedCompany = event.option.value;
    this.parentCompanyName = this.selectedCompany?.parentCompany ?? '';
    this.updateAddressBasedOnSelectingCompany();
  }

  public updateAddressBasedOnSelectingCompany(){

    if(!this.selectedCompany || !this.isAddNewContactPage) return;

    this.contactForm.patchValue({address: {
        address: this.selectedCompany?.address?.line ?? null,
        zipCode: this.selectedCompany?.address?.zipcode ?? null,
        state: this.selectedCompany?.address?.state ?? null,
        city: this.selectedCompany?.address?.city ?? null,
      },
      office: this.splitValuesInMyTelFormat(this.selectedCompany?.['phone']),
      fax: this.splitValuesInMyTelFormat(this.selectedCompany?.['fax'])
    });
  }

  private get isAddNewContactPage(){
    return /records-management-v2\/contacts\/add$/.test(this.router.url);
  }
  public noteUpdateEmit(event){
    this.contactNoteUpdateEmit.emit(event);
  }

  public listenForContainerScroll() {
    this.containerScrolling$.pipe(takeUntil(this.unsubscribe)).subscribe((res) => {
      this.companyAutoCompleteTrigger.closePanel();
    });
  }

  public showEditorFunc() {
    this.showEditor = true;
    this.cdRef.markForCheck();
  }


  public tabLinkHandler(type: string) {
    const organizationTypeId = this.contactForm.controls?.['company']?.value
      .organizationTypeId;

    switch (type) {
      case 'Vendor': {
        const url = `${location.origin}/records-management-v2/vendors/${organizationTypeId}`;
        window.open(url, '_blank');
        break;
      }
      case 'Client': {
        const url = `${location.origin}/records-management-v2/clients/${organizationTypeId}`;
        window.open(url, '_blank');
        break;
      }
      case 'Agency': {
        const url = `${location.origin}/records-management-v2/agencies/${organizationTypeId}`;
        window.open(url, '_blank');
        break;
      }
    }

  }
}
