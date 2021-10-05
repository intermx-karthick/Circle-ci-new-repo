import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { Component, Injector, OnDestroy } from '@angular/core';
import { ComponentPortal, PortalInjector, PortalModule } from '@angular/cdk/portal';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DynamicOverlayContainerService } from '@shared/services/dynamic-overlay/dynamic-overlay-container.service';
import { DynamicOverlayRef } from '@shared/services/dynamic-overlay/dynamic-overlay.ref';
import { DynamicOverlayService } from './dynamic-overlay.service';

describe('DynamicOverlayService', () => {

  let dynamicOverlay: DynamicOverlayService;
  let dcContainer: DynamicOverlayContainer;

  let fixture: ComponentFixture<DynamicOverlayContainer>;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        DynamicOverlayContainer,
        DynamicOverlayComponent
      ],
      imports: [
        NoopAnimationsModule,
        OverlayModule,
        PortalModule
      ],
      providers: [
        DynamicOverlayService,
        DynamicOverlayContainerService
      ]
    }).compileComponents();
    dynamicOverlay = TestBed.inject(DynamicOverlayService);
  }));

  beforeEach(()=>{
    fixture = TestBed.createComponent(DynamicOverlayContainer);
    dcContainer = fixture.componentInstance;
    fixture.detectChanges();
  });


  afterEach(fakeAsync(()=>{
    dcContainer.ngOnDestroy();
  }));


  it('should be created', () => {
    expect(dynamicOverlay).toBeTruthy();
  });

  it('should open with container', () => {

    const containerEl = fixture.nativeElement.querySelector('#do-container');
    dynamicOverlay.setContainerElement(containerEl);
    const {overlayRef, componentPortal} =  dcContainer.openPopup();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('overlay component');
    expect(componentPortal.instance instanceof DynamicOverlayComponent).toBe(true);

  });

  it('should be able to pass in data', ()=> {

    const containerEl = fixture.nativeElement.querySelector('#do-container');
    dynamicOverlay.setContainerElement(containerEl);
    const passingData = 'data';
    const { overlayRef, componentPortal } = dcContainer.openPopup(passingData);
    fixture.detectChanges();

    expect(componentPortal.instance.dynamicOverlayRef.data).toContain(passingData)
  });

  it('should close and get back a result', ()=>{

    const containerEl = fixture.nativeElement.querySelector('#do-container');
    dynamicOverlay.setContainerElement(containerEl);
    const {overlayRef, componentPortal} =  dcContainer.openPopup();
    fixture.detectChanges();

    const closingData = 'data';
    componentPortal.instance.dynamicOverlayRef.afterClosed().subscribe((data: any)=>{
      expect(data.data).toContain(closingData)
    });

    componentPortal.instance.close(closingData);
  })

});

// stub components

@Component({ template: '<div>overlay component</div>' })
class DynamicOverlayComponent {
  constructor(
    public dynamicOverlayRef: DynamicOverlayRef
  ) {
  }

  close(data?:any){
    this.dynamicOverlayRef.close(data);
  }
}

@Component({ template: '<div id="do-container"></div>' })
class DynamicOverlayContainer implements OnDestroy{

  overlayRef: OverlayRef;

  constructor(
    private dynamicOverlay: DynamicOverlayService,
    private injector: Injector,
  ) {
  }

  openPopup(data?: any){

    const overlayRef = this.dynamicOverlay.create({
      hasBackdrop: false,
      maxWidth: '270px',
      maxHeight: '270px',
      positionStrategy: this.dynamicOverlay.position().global().centerHorizontally().centerVertically()
    });

    const dynamicOverlayRef = new DynamicOverlayRef(overlayRef, data);
    const token = new WeakMap([[DynamicOverlayRef, dynamicOverlayRef]]);
    const componentPortal = overlayRef.attach(new ComponentPortal(
      DynamicOverlayComponent,
      null,
      new PortalInjector(this.injector, token)
      )
    );

    dynamicOverlayRef.afterClosed().subscribe(()=>{
      overlayRef.detach();
      overlayRef.dispose();
    });

    this.overlayRef = overlayRef;

    return {overlayRef, componentPortal};

  }

  ngOnDestroy(): void {
    this.overlayRef?.detach?.();
    this.overlayRef?.dispose?.();
  }

}

