import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TagsInputIdsDialogComponent } from './tags-input-ids-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';

describe('TagsInputIdsDialogComponent', () => {
    let component: TagsInputIdsDialogComponent;
    let fixture: ComponentFixture<TagsInputIdsDialogComponent>;
    let dialogRef: any;
    let dialogData: any;
    let matSort: any;
    let matTableDataSource: any;
    const data = { ids: ['987', '87567'] };

    beforeEach(waitForAsync(() => {
        dialogRef = jasmine.createSpyObj('MatDialogRef', [
            'data',
        ]);
        dialogData = jasmine.createSpyObj('MAT_DIALOG_DATA', [
            ''
        ]);
        matSort = jasmine.createSpyObj('MatSort', [
            'sort'
        ]);
        matTableDataSource = jasmine.createSpyObj('MatTableDataSource', [
            'dataSource'
        ]);
        TestBed.configureTestingModule({
            imports: [
                BrowserModule,
                BrowserAnimationsModule,
                RouterTestingModule.withRoutes([]),
                HttpClientModule,
                MatDialogModule,
                MatSortModule,
                MatTableModule,
                MatIconModule
            ],
            declarations: [TagsInputIdsDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: dialogRef },
                { provide: MAT_DIALOG_DATA, useValue: data },
                { provide: MatSort, useValue: matSort },
                { provide: MatTableDataSource, useValue: matTableDataSource }
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TagsInputIdsDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('#clicked() copied all Ids', () => {
        fixture.detectChanges();
        expect(component.copiedStatus).toBe(false, 'false at first time');
        component.selectBox = '98789, 9788';
        component.copyAllIds();
        expect(component.copiedStatus).toBe(true, 'true at second time');
    });


});
