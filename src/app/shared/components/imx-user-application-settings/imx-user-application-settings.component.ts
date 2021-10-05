import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { CustomValidators } from 'app/validators/custom-validators.validator';
import { InventoryService } from '@shared/services/inventory.service'
import { AuthenticationService } from '../../services/authentication.service';
import { Helper } from 'app/classes';
import { RecordService } from 'app/records-management-v2/record.service';
import { filter, map } from 'rxjs/operators';
import { ImxBaseAudienceDataStorage } from 'app/classes/imx-base-audience-data-storage';
import { CommonService, SnackbarService, ThemeService } from '@shared/services';
import { MatDialog } from '@angular/material/dialog';
import { ImxBaseAudiencePopupComponent } from '../imx-base-audience-popup/imx-base-audience-popup.component';
@Component({
  selector: 'app-imx-user-application-settings',
  templateUrl: './imx-user-application-settings.component.html',
  styleUrls: ['./imx-user-application-settings.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    RecordService,
    ImxBaseAudienceDataStorage
  ]
})
export class ImxUserApplicationSettingsComponent implements OnInit {
  userApplicationForm: FormGroup;
  public timezones = [];
  public dataVersions = [202106, 2021, 2020];
  public audiences = [];
  notifications: { value: string; name: string; }[];
  public userData: any;
  public contactData = {};
  @Output() onSettingClose = new EventEmitter();
  private baseAudiences;
  defaultDataVersion: number;
  selectedDataVersion: any;
  constructor(
    private formBuilder: FormBuilder,
    private inventoryService: InventoryService,
    private authenticationService: AuthenticationService,
    private cdRef: ChangeDetectorRef,
    private imxBaseAudiencesObj: ImxBaseAudienceDataStorage,
    private snackbarService: SnackbarService,
    private dialog: MatDialog,
    private commonService: CommonService,
    private themeService: ThemeService
  ) { }
  ngOnInit(): void {
    const defaultYear = this.themeService.getThemeSettingByName('measuresRelease');
    this.defaultDataVersion = Number(defaultYear);
    const preferences = this.commonService.getUserPreferences();
    const measureVersion = preferences?.measures_release ?? this.defaultDataVersion;
    this.selectedDataVersion = measureVersion;

    this.baseAudiences = this.imxBaseAudiencesObj.getAllItems();
    this.audiences = this.imxBaseAudiencesObj.get(this.selectedDataVersion);
    this.userData = this.authenticationService.getUserData();

    this.userApplicationForm = this.formBuilder.group({
      name: [this.userData?.name, Validators.required],
      mobile: [null, [CustomValidators.telephoneInputValidator]],
      office: [null, [CustomValidators.telephoneInputValidator]],
      ext: [null, [CustomValidators.telephoneInputValidator]],
      timezone: ['est_minus5', Validators.required],
      default_data_source: [this.selectedDataVersion, Validators.required],
      default_data_audience: ['2032', Validators.required],
      default_language: ['eng_us', Validators.required],
      show_notification: ['30', Validators.required],
      address: [null]
    });
    this.authenticationService
      .getCurrentUserContacts(this.userData?.userId)
      .pipe(
        filter((contacts) => contacts['results'] && contacts['results'].length > 0),
        map((contacts) =>  contacts['results'][0])
      )
      .subscribe((contact) => {
        this.contactData = contact;
        this.cdRef.markForCheck();
        // this.userApplicationForm.controls['mobile'].setValue(this.contactData['mobile']);
        this.userApplicationForm.patchValue({
          name: this.userData?.name,
          mobile: Helper.splitValuesInMyTelFormat(this.contactData['mobile']),
          office: Helper.splitValuesInMyTelFormat(this.contactData['office']),
          ext: this.contactData['ext'],
          address: {
            address: this.contactData?.['address']?.line,
            zipCode: this.contactData?.['address']?.zipcode,
            state: this.contactData?.['address']?.state,
            city: this.contactData?.['address']?.city,
          }
        });
    });

    this.timezones = [
      { value: 'est_minus5', name: 'Eastern Standard Time (-5:00 UTC)'}
    ];
    this.notifications = [
      { value: '7', name: '7 days'},
      { value: '14', name: '14 days'},
      { value: '30', name: '30 days'},
    ];
  }
  onDataSourceChange(source) {
    // this.loadBaseAudience(source.value);
    this.audiences = this.imxBaseAudiencesObj.get(source.value).sort(function (a, b) {
      return a.description - b.description;
    });
    this.userApplicationForm.controls.default_data_audience.setValue('2032');
  }
  loadBaseAudience(dataSource = '2021r1') {
    this.inventoryService.getSegmentsSearch(dataSource).subscribe((catelogs) => {
       const uniquecatelogs = [];
       const baseaudiences = [];
       const product_feature_list = [];
       catelogs.forEach((catelog) => {
         uniquecatelogs.push(...catelog.base_population_segment_list);
         if(uniquecatelogs.indexOf(catelog.id) !== -1) {
           baseaudiences.push({
             audienceKey: catelog.id,
             name: catelog.name,
             description: catelog.description,
             category_name: catelog.category_name,
             subcategory_name: catelog.subcategory_name,
             displayname: `(${catelog.category_name}) ${catelog.name}`,
           })
         }
       });
       this.audiences = baseaudiences.sort((a, b) => {return a.description - b.description});
       
       console.log('this.audiences', JSON.stringify(this.audiences));
       this.cdRef.markForCheck()
     });
 
  }
  private getUniqueValues = (value, index, self) => {
    return self.indexOf(value) === index;
  }
  openDataSourceInfo(event) {
    event.stopPropagation();
    return this.dialog
            .open(ImxBaseAudiencePopupComponent, {
                width: '620px',
                maxHeight: '400px',
                data: { baseAudiences: this.baseAudiences },
                panelClass: 'imx-mat-dialog'
            })
            .afterClosed();

  }
  validateFormGroup(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
        const control = formGroup.get(field);
        if (control instanceof FormControl) {
            control.markAsTouched({
                onlySelf: true
            });
        } else if (control instanceof FormGroup) {
            this.validateFormGroup(control);
        }
    });
  }
  onSubmit(formGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
          control.markAsTouched({
              onlySelf: true
          });
      } else if (control instanceof FormGroup) {
          this.validateFormGroup(control);
      }
    });
    if (formGroup.valid) {
     this.submitToServer(formGroup.value);
    }
  }
  submitToServer(formData) {
    const userData = {};
    userData['name'] = formData.name;
   /* const preferences = {
      measures_release: this.userApplicationForm.value['default_data_source'],
      base_audience: this.userApplicationForm.value['default_data_audience']
    };
    this.commonService.setUserPreferences(preferences ?? {});
    this.selectedDataVersion = this.userApplicationForm.value['default_data_source']; */
    
    this.authenticationService.updateNewProfile(userData, this.userData.id).subscribe(data => {
      this.authenticationService.getUserDetailsUsingAuth0Token().subscribe((userData) => {
        const flag = this.authenticationService.setUserData(userData);
        if (flag) {
          this.snackbarService.showsAlertMessage('User profile update successfully.');
        } else {
          this.snackbarService.showsAlertMessage('Oops! Something went wrong, please try again.');
        }
      });
    },
    error => {
    });
  }
  closeUserSettings() {
    this.onSettingClose.emit();
  }
}
