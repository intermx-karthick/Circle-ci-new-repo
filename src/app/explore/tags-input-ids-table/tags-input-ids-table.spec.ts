import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { TagsInputIdsTableComponent } from './tags-input-ids-table.component';

describe('TagsInputIdsTableComponent', () => {
    let component: TagsInputIdsTableComponent;
    let fixture: ComponentFixture<TagsInputIdsTableComponent>;
    let dialog: any;

    beforeEach(waitForAsync(() => {
        dialog = jasmine.createSpyObj('dialog', [
            'open'
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
            declarations: [TagsInputIdsTableComponent],
            providers: [{provide: MatDialog, useValue: dialog}]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TagsInputIdsTableComponent);
        component = fixture.componentInstance;
        component.allEnteredIds = {
                                    data: {GeopanelIds: [1234], plantIds: ['98789, 9878']},
                                    geoPanelId: ['1234'],
                                    plantUnitIds: ['98789, 9878']
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('checking valid IDs', () => {
        fixture.detectChanges();
        const geoPanelId = [12234];
        const plantId = ['12234', '234234'];
        const expectedOutput = ['234234'];
        expect(component.checkingInvalidIDs(geoPanelId, plantId)).toBeTruthy(expectedOutput);
    });

    it('when passing empty array in checkingInvalidIDs function', () => {
        fixture.detectChanges();
        expect(component.checkingInvalidIDs([], [])).toBeTruthy([]);
    });

    it('remove Invalid IDs', () => {
        fixture.detectChanges();
        expect(component.removedIDsStatus).toBe(false, 'at first time');
        component.removeInvalidIDs();
        expect(component.removedIDsStatus).toBe(true, 'at second time');
    });


});
