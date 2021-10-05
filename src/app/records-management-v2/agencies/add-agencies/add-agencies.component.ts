import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Helper } from 'app/classes';
import { filter, takeUntil } from 'rxjs/operators';
import { RecordService } from '../../record.service';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { MatSnackBarConfig } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Subject } from 'rxjs';


@Component({
  selector: 'app-add-agencies',
  templateUrl: './add-agencies.component.html',
  styleUrls: ['./add-agencies.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddAgenciesComponent implements OnInit, OnDestroy {
  public scrollContent: number;
  public agencyForm;
  private unSubscribe: Subject<void> = new Subject<void>();
  public submitForm$: Subject<void> = new Subject<void>();
  public agencyDetails = {};
  public agencyDetails$ = new BehaviorSubject(null);
  public type = 'add';
  public scrolling$ = new Subject();

  constructor(
    private cdRef: ChangeDetectorRef,
    private route: Router,
    private recordService: RecordService,
    private matSnackBar: MatSnackBar,
    private activeRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.reSize();
    if (this.activeRoute.snapshot.queryParams['agencyId']) {
      this.type = 'duplicate';
      this.loadAgency(this.activeRoute.snapshot.queryParams['agencyId']);
    }
  }

    private loadAgency(agencyId) {
    this.recordService
      .getAgencyById(agencyId)
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((response) => {
        if (response?._id) {
          this.agencyDetails$.next(response);
          this.agencyDetails = response;
          this.reSize();
        } else {
          this.route.navigateByUrl(`/records-management-v2/agencies`);
          let message = 'Something went wrong, Please try again Later';
          if (response?.error?.message) {
            message = response['error']['message'];
          }
          this.showsAlertMessage(message);
        }
      });
  }

  public reSize() {
    if(window.innerWidth < 1100 && this.type === 'duplicate'){
      this.scrollContent = window.innerHeight - 320;
    }else if(this.type === 'duplicate'){
      this.scrollContent = window.innerHeight - 300;
    }else{
      this.scrollContent = window.innerHeight - 260;
    }

  }

  public agencyFormChanges(event) {
    this.agencyForm = event;
    this.cdRef.markForCheck();
  }

  public submitAgency() {
    // TODO: Add agency form submit
    if (this.agencyForm.valid) {
      const payload = this.buildAddAgencyAPIPayload();

      this.recordService
        .createAgency(this.formatPayLoad(payload), false)
        .pipe(
          filter((response: any) => {
            if (!response) {
              this.showsAlertMessage(
                'Something went wrong, Please try again Later'
              );
              return false;
            }

            return true;
          })
        )
        .subscribe(
          (response) => {
            if (response['status'] === 'success') {
              this.showsAlertMessage('Agency created Successfully!');
              this.route.navigateByUrl(
                `/records-management-v2/agencies/${response.data.id}`
              );
            } else if (response['error']?.['message']) {
              this.showsAlertMessage(response['error']['message']);
            }
          },
          (errorResponse) => {
            if (errorResponse.error?.message) {
              this.showsAlertMessage(errorResponse.error?.message);
              return;
            }else if(errorResponse.error?.error){
              this.showsAlertMessage(errorResponse.error?.error);
              return;
            }
            this.showsAlertMessage(
              'Something went wrong, Please try again Later'
            );
          }
        );
    }else{
      this.submitForm$.next();
    }
  }
  private formatPayLoad(payloadData) {
    // Check vendor data & set null if empty
    Object.keys(payloadData).forEach((element) => {
      if (
        typeof payloadData[element] === 'string' &&
        payloadData[element].trim() === ''
      ) {
        payloadData[element] = null;
      }
    });
    return payloadData;
  }
  /**
   * @description
   *  This method is used to build the vendor creation api
   *  request payload
   */
  private buildAddAgencyAPIPayload() {
    const payload = Helper.deepClone(this.agencyForm.value);
    payload.parentAgency = payload.parentAgency?._id ?? null;
    /* payload.type =
      payload.type && !Array.isArray(payload.type)
        ? [payload.type]
        : payload.type; */
    // payload.organizationId = '5fb554c4a1ba8b1896021e1f';
    if (payload.address) {
      payload.address.state = payload.address.state?._id;
      payload.address.zipcode = payload.address.zipCode?.ZipCode ?? '';
      payload.address.line = payload.address?.address;
      delete payload.address.zipCode;
      delete payload.address.address;
    }
    if (payload.managedBy?.id) {
      payload.managedBy = payload.managedBy['id'];
    } else {
      payload.managedBy = null;
    }
    payload.isActive = true;
    payload.diversityOwnership =
      payload.diversityOwnership && !Array.isArray(payload.diversityOwnership)
        ? [payload.diversityOwnership]
        : payload.diversityOwnership;

    if (payload.retirementDate) {
      const retDate = new Date(payload.retirementDate);
      payload.retirementDate = format(retDate, 'MM/dd/yyyy', {
        locale: enUS
      });
    }

    if (payload.phone) {
      const phone = payload.phone;
      payload.phone = `${phone.area}${phone.exchange}${phone.subscriber}`;
    }

    if (payload.fax) {
      const fax = payload.fax;
      payload.fax = `${fax.area}${fax.exchange}${fax.subscriber}`;
    }
    if (payload.billing?.media) {
      payload.billing['media'] = Number(payload.billing?.media).toString();
    }
    if (payload.oohRevenue?.media) {
      payload.oohRevenue['media'] = Number(payload.oohRevenue?.media).toString();
    }
    if (payload?.install) {
      payload.install = Number(payload.install).toString();
    }
    if (payload?.OIRev) {
      payload.OIRev = Number(payload.OIRev).toString();
    }
    return payload;
  }

  private showsAlertMessage(msg) {
    const config = {
      duration: 5000
    } as MatSnackBarConfig;
    this.matSnackBar.open(msg, '', config);
  }

  public navigateToAgencyList() {
    this.route.navigateByUrl('/records-management-v2/agencies');
  }
  ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  public handleScroll(){
    this.scrolling$.next();
  }
}
