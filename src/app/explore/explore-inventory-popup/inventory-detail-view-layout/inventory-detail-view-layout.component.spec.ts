import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InventoryDetailViewLayoutComponent } from './inventory-detail-view-layout.component';

describe('InventoryDetailViewLayoutComponent', () => {
  let component: InventoryDetailViewLayoutComponent;
  let fixture: ComponentFixture<InventoryDetailViewLayoutComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ InventoryDetailViewLayoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryDetailViewLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /* it('should create', () => {
    expect(component).toBeTruthy();
  }); */
});
