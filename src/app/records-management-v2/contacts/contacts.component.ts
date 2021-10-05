import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';

import { RecordService } from '../record.service';
import { ContactAbstract } from './contact-abstract';
import { State } from '@interTypes/vendor/state';
import { forbiddenNamesValidator } from '@shared/common-function';
import { AuthenticationService } from '@shared/services';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactsComponent extends ContactAbstract implements OnInit, AfterViewInit {
  public contactSearchForm: FormGroup;
  panelStateContainer: string;
  companyTypes = ['Vendor', 'Client', 'Agency'];
  public searchParams$: Subject<any> = new Subject<any>();
  public exportCSV$: Subject<any> = new Subject<any>();
  public panelCompanyContainer: string;
  @ViewChild('companyTypeRef', { read: ElementRef }) companyTypeRef: ElementRef;
  public companyTypeTooltipText = '';
  public searchFilterApplied = false;

  constructor(
    public recordService: RecordService,
    public cdRef: ChangeDetectorRef,
    private router: Router,
    private fb: FormBuilder,
    public auth: AuthenticationService
  ) {
    super(recordService, cdRef);
  }

  public ngOnInit(): void {
    const sessionFilter = this.recordService.getContactListLocalSession();
    if (sessionFilter?.filtersInfo) {
      this.buildForm(sessionFilter.filtersInfo);
    } else {
      this.buildForm({});
    }

    if (sessionFilter?.filtersInfo) {
      const filtersData = this.removeEmptyorNull(sessionFilter.filtersInfo);
      if (Object.keys(filtersData).length > 0) {
        this.searchFilterApplied = true;
      }
    }

    this.loadCompanies();
    this.setFilterCompanySubscribtion(this.contactSearchForm, 'company');
    this.loadAllStates();
    //TODO: For now UI side added search. If need API side enable below code
    //this.setFilterStateSubscribtion(this.contactSearchForm, 'state');
  }

  removeEmptyorNull(searchData) {

    if(!searchData) return null;

    // Delete null or empty string from the search data;
    Object.keys(searchData).map((key) => {
      if (searchData[key] == '' || searchData[key] === null || (typeof searchData[key] === 'string' && searchData[key].trim() == '')) {
        delete searchData[key];
      }
    });
    return searchData;
  }

  public companyNameDisplayWithFn(companyName: any) {
    return companyName?.companyName ?? '';
  }

  public companyNameTrackByFn(companyName: any, index) {
    return index;
  }

  public addContact() {
    this.router.navigateByUrl('records-management-v2/contacts/add');
  }

  public exportCSV() {
    this.exportCSV$.next();
  }

  private buildForm(contactSearch) {
    this.contactSearchForm = this.fb.group({
      name: [contactSearch?.name ?? null],
      company: [contactSearch?.company?._id ? contactSearch.company : null, null, forbiddenNamesValidator],
      companyType: [contactSearch?.companyType ?? null],
      state: [contactSearch?.state?._id ? contactSearch?.state : null, null, forbiddenNamesValidator],
      city: [contactSearch?.city ?? null],
      currentFlag: [contactSearch?.currentFlag ?? false]
    });
  }

  public search(csv = false) {
    const searchInfo = this.recordService.formConatctSearchFiltersForAPI(
      this.contactSearchForm.value
    );
    this.recordService.setContactListLocalSession(
      'filtersInfo',
      this.contactSearchForm.value
    );
    this.searchParams$.next(searchInfo);

    if (searchInfo?.search?.length > 0 || searchInfo?.filter) {
      this.searchFilterApplied = true;
    } else {
      this.searchFilterApplied = false;
    }
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

  public stateDisplayWithFn(state: State) {
    return state?.name ? (state?.short_name + ' - ' + state?.name) : '';
  }

  public stateTrackByFn(idx: number, state: State) {
    return state?._id ?? idx;
  }

  ngAfterViewInit() {
    this.getCompanyTypetext();
  }
  public changeCompanyType() {
    this.getCompanyTypetext();
  }

  private getCompanyTypetext() {
    // Tested different scenario so that added setTimeout here
    setTimeout(() => {
      this.companyTypeTooltipText = (this.companyTypeRef?.nativeElement)?.querySelector('.mat-select-value-text span')?.innerText;
    }, 500);
  }
  public onResetForm() {
    this.contactSearchForm.reset();
    this.searchText = '';
    this.loadCompanies();
    this.search();
  }
}
