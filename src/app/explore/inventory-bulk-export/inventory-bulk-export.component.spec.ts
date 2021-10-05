import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InventoryBulkExportComponent } from './inventory-bulk-export.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {MatDialogModule} from '@angular/material/dialog';
import {ExploreService} from '@shared/services';
import { of } from 'rxjs';

import { MatRadioModule } from '@angular/material/radio';



describe('InventoryBulkExportComponent', () => {
  let component: InventoryBulkExportComponent;
  let fixture: ComponentFixture<InventoryBulkExportComponent>;
  let exploreService: ExploreService;
  const response = {
    status: 200
  };
  beforeEach(waitForAsync(() => {
    exploreService = jasmine.createSpyObj('ExploreService', [
      'inventoriesBulkExport'
    ]);
    (<jasmine.Spy>exploreService.inventoriesBulkExport).and.returnValue(of(response));
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        MatRadioModule,
        MatDialogModule
      ],
      providers: [
        { provide: ExploreService, useValue: exploreService },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} }
      ],
      declarations: [ InventoryBulkExportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryBulkExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
  });

  it('should able to export pdf file', () => {
    fixture.detectChanges();
    spyOn(component, 'exportPDF');
    const exportBTN = fixture.nativeElement.querySelector('.test-inv-submit-btn') as HTMLButtonElement;
    exportBTN.click();
    component.data = {
      'aud': 'pf_pop',
      'aud_name': 'Persons 0+ yrs',
      'orientation': 'portrait',
      'panel_id': ['401808', '402189', '401823'],
      'type': 'inventory_details'
    };
    expect(component.exportPDF).toHaveBeenCalled();
  });
});

// TODO(2/4/2019) - Have to write test case for changeOrientation once implementation is done for changing orientation.
