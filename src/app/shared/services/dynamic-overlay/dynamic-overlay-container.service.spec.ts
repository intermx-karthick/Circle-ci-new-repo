import { TestBed } from '@angular/core/testing';
import { OverlayModule } from '@angular/cdk/overlay';

import { DynamicOverlayContainerService } from './dynamic-overlay-container.service';

describe('DynamicOverlayContainerService', () => {
  let service: DynamicOverlayContainerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        OverlayModule,
      ],
      providers: [
        DynamicOverlayContainerService
      ]
    });
    service = TestBed.inject(DynamicOverlayContainerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have given container Element', () => {

    const elementMock = {
      id: 'test',
      innerHTML: 'my string'
    };
    document.getElementById = jasmine.createSpy('HTML Element').and.returnValue(elementMock);
    service.setContainerElement(document.getElementById('test'));

    expect(service?.getContainerElement()?.id).toBe(elementMock.id);

  });

});
