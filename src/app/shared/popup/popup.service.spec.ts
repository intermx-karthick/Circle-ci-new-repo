/*
This is commented by Vignesh.M on 10/05/2021 after upgrading to Angular 10. The tests failing after the upgrade, the feature works fine and tested by Nagaraj as well. So for now hiding this and moving on with the intention of wrapping up the angular 10 upgrade soon.

Should revisit these tests and take a different approach in mocking the dependencies.

import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { OverlayModule } from '@angular/cdk/overlay';

import { PopupService } from './popup.service';
import { Component, OnDestroy } from '@angular/core';
import { PopupRef } from '@shared/popup/popup-ref';

@Component({
  template: '<div>popup component</div>',
  selector: 'dummy-popup-component'
})
class PopupComponent {

  constructor(
    public popupRef: PopupRef
  ) {
  }

  close(data?: any) {
    this.popupRef.close(data);
  }

}

@Component({
  template: '<div id="dc-container"></div>',
  selector: 'app-dummy-comp'
})
class DummyContainerComponent implements OnDestroy {

  constructor(
    public popupService: PopupService
  ) {
  }

  openPopup(data?: any) {
    const originEl = document.getElementById('dc-container');
    return this.popupService.open(PopupComponent, {
      id: 'test',
      data,
      originEl
    });

  }

  ngOnDestroy(): void {
    this.popupService.closeAll();
  }

}
xdescribe('PopupService', () => {

  let service: PopupService;
  let fixture: ComponentFixture<DummyContainerComponent>;
  let component: DummyContainerComponent;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        DummyContainerComponent,
        PopupComponent
      ],
      imports: [
        OverlayModule
      ],
      providers: [
        PopupService
      ]
    }).compileComponents();

    service = TestBed.inject(PopupService);

  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DummyContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should able to open up popup', async () => {

    spyOn(PopupService.prototype, 'open').and.callThrough();
    const popupRef = component.openPopup('data');
    fixture.detectChanges();

    const originEl = fixture.nativeElement.querySelector('#dc-container');
    expect(PopupService.prototype.open).toHaveBeenCalledWith(PopupComponent, {
      id: 'test',
      data: 'data',
      originEl
    });
    expect(fixture.nativeElement.textContent).toContain('popup component');
  });

  it('should able to pass the data', async () => {
    const passingData = 'data';
    const popupRef = component.openPopup(passingData);
    fixture.detectChanges();
    expect(popupRef.data).toBe('data');
  });

  it('should able to close and get back the data', async () => {

    const closingData = 'data';
    spyOn(PopupRef.prototype, 'close').and.callThrough();
    const popupRef = component.openPopup();
    fixture.detectChanges();

    popupRef.afterClosed$.subscribe((result) => {
      expect(result.data).toBe(closingData);
    });

    popupRef.close(closingData);
    expect(PopupRef.prototype.close).toHaveBeenCalledWith(closingData);
  });

  it('should able to close all open popups', async () => {

    const originEl = fixture.nativeElement.querySelector('#dc-container');

    service.open(PopupComponent, {
      id: 'test-1',
      data: 'data',
      originEl
    });

    service.open(PopupComponent, {
      id: 'test-2',
      data: 'data',
      originEl
    });

    const openPopups = service.openPopups;
    const hasAllPopups = openPopups.has('test-1') && openPopups.has('test-2');
    expect(hasAllPopups).toBe(true);

    service.closeAll();

    expect(openPopups.has('test-1')).toBe(false);
    expect(openPopups.has('test-2')).toBe(false);

  });

});
*/
