import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal, PortalModule } from '@angular/cdk/portal';

import { PopupComponent } from './popup.component';
import { Component } from '@angular/core';


describe('PopupComponent', () => {
  let component: PopupComponent;
  let fixture: ComponentFixture<PopupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupComponent, PortalComponent ],
      imports: [
        MatIconModule,
        OverlayModule,
        PortalModule,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should able to attach component', ()=>{
    const componentPortal = new ComponentPortal(PortalComponent, null, null);
    component.attachComponent(componentPortal);
    expect(fixture.nativeElement.textContent).toContain('portal component');
  });

});

@Component({template: '<div>portal component</div>'})
class PortalComponent {

}
