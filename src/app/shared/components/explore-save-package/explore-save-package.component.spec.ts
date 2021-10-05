import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { ExploreSavePackageComponent } from './explore-save-package.component';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
  CommonService,
  WorkSpaceService,
  WorkSpaceDataService
} from '@shared/services';
import { RouterTestingModule } from '@angular/router/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ShowErrorsComponent } from '@shared/components/show-errors/show-errors.component';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';

describe('ExploreSavePackageComponent', () => {
  let component: ExploreSavePackageComponent;
  let fixture: ComponentFixture<ExploreSavePackageComponent>;
  let common: CommonService;
  let workSpaceService: WorkSpaceService;
  let workSpaceDataService: WorkSpaceDataService;
  let dialogRef;
  let dialogData;
  let matSnackBar;

  beforeEach(waitForAsync(() => {
    common = jasmine.createSpyObj('CommonService', [
      'setBreadcrumbs',
      'setWorkSpaceState',
      'validateFormGroup'
    ]);
    workSpaceService = jasmine.createSpyObj('WorkSpaceService', [
      'getExplorePackages',
      'saveExplorePackage',
    ]);
    workSpaceDataService = jasmine.createSpyObj('WorkSpaceDataService', [
      'setPackages',
      'setSelectedPackage',
    ]);
    dialogRef = jasmine.createSpyObj('MatDialogRef', [
      'data'
    ]);
    dialogData = jasmine.createSpyObj('MAT_DIALOG_DATA', [
      ''
    ]);

    matSnackBar = jasmine.createSpyObj('MatSnackBar', [
      ''
    ]);

    
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([]),
      ],
      declarations: [
        ExploreSavePackageComponent,
        ShowErrorsComponent,
        TruncatePipe
      ],
      providers: [
        { provide: CommonService, useValue: common },
        { provide: WorkSpaceService, useValue: workSpaceService },
        { provide: WorkSpaceDataService, useValue: workSpaceDataService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        {provide: MatSnackBar, useValue: matSnackBar}
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExploreSavePackageComponent);
    component = fixture.componentInstance;
    component.data = {
      'from': 'explore',
      'inventories': [{ 'fid': 30695230, 'selected': true }, { 'fid': 30556586, 'selected': false }],
      'saveFromFilter': false,
      'type': 'add'
    };
    const packages = {
      'description': 'test description',
      'inventory': [],
      'name': 'test name',
      'owner': '5afd1dfee8c630e6d5f054f8',
      '_id': '5b72799666269f3cdf68d209'
    };
    (<jasmine.Spy>workSpaceService.getExplorePackages).and.returnValue(of(packages));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it(`should have as title 'Save Spots as Inventory Set'`, () => {
    const title = fixture.nativeElement.querySelector('.test-package-title') as HTMLLinkElement;
    expect(title.innerText).toBe('Save Spots as Inventory Set');
  });
  /** Component code changed  */
  /*it(`should be a Type Package Name 'Input Field'`, () => {
    const packageInputField = fixture.nativeElement.querySelector('input.test-package-name') as HTMLInputElement;
    expect(packageInputField.value).toBe('');
  });


  it(`should be a Add Notes 'textarea Field'`, () => {
    const addNoteField = fixture.nativeElement.querySelector('textarea.form-control') as HTMLTextAreaElement;
    expect(addNoteField.value).toBe('');
  });

  it(`form invalid when empty`, () => {
    expect(component.workspaceForm.invalid).toBe(true);
  });

  it('should be create a new inventory set', () => {
    const name = fixture.nativeElement.querySelector('#defaultForm-name') as HTMLInputElement;
    name.value = 'inventory set name';
    name.dispatchEvent(new Event('input'));
    const description = fixture.nativeElement.querySelector('.test-package-description') as HTMLTextAreaElement;
    description.value = 'inventory set description';
    description.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    fixture.nativeElement
      .querySelector('.test-inv-submit-btn').click();
    fixture.detectChanges();
    const packageName = component.workspaceForm.value['name'];
    const packageDescription = component.workspaceForm.value['description'];
    expect(packageName).toEqual(name.value);
    expect(packageDescription).toEqual(description.value);
  });

  it(`should have update 'Existing Inventory Set'`, () => {
    component.type = 'exist';
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.test-package-title') as HTMLLinkElement;
    expect(title.innerText).toBe('Save to Existing Inventory Set');
  });*/
});
