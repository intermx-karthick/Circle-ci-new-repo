import { Component, OnInit, Input, OnDestroy, ChangeDetectionStrategy, Output, EventEmitter, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { LayersService } from 'app/explore/layer-display-options/layers.service';
import { PlacesFiltersService } from 'app/places/filters/places-filters.service';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PopulationDataService } from '@shared/services/population-data.service';
import { applyLayers } from '@interTypes/layers';
import {Helper} from '../../../classes';

@Component({
  selector: 'app-custom-text-layer',
  templateUrl: './custom-text-layer.component.html',
  styleUrls: ['./custom-text-layer.component.less'],
 changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomTextLayerComponent implements OnInit, OnDestroy , AfterViewInit{
  public showCustomText: any = true;
  public showDraggedText = true;
  public displayTextInfo = {};
  public resizingInProcess = false;
  public enableDraggable = true;
  @Input() customTextStyle: object = {};
  @Input() activeDraggableTextPosition = { x: 0, y: 0 };
  @Input() mapWidthHeight = {};
  @Input() layerDisplayOptions: any = {};
  @Input() mapDivBlock;
  inBounds = true;
  dummyTextStyle = {};
  private unSubscribe: Subject<void> = new Subject<void>();
  @Input() layerType;
  @Input() module;
  @Output() layerChanges = new EventEmitter();
  @Input() mapId;
  @Input() applydisplay: Observable<applyLayers>;
  constructor(
    private layersService: LayersService,
    private placeFilterService: PlacesFiltersService,
    private populationDataService: PopulationDataService,
    private cdRef: ChangeDetectorRef) { }

  ngOnInit() {
  }

  ngAfterViewInit(){
    this.applydisplay.pipe(takeUntil(this.unSubscribe)).subscribe(applyLayer =>{
      if(Object.keys(applyLayer).length && applyLayer.flag){
        this.loadText();
      } else{
        this.removeText();
      }
    });
  }
  public loadText() {
    const layersSession = this.layersService.getlayersSession(this.layerType);

    if (layersSession && layersSession['display'] && typeof layersSession['display']['isTextEnabled'] !== 'undefined') {
      this.showCustomText = layersSession['display']['isTextEnabled'];
    }
    if (layersSession && layersSession['display']) {

      this.layerDisplayOptions = layersSession['display'];
      if (layersSession['display']['text'] && layersSession['display']['text']['text']) {
        this.displayTextInfo = {
          text: layersSession['display']['text']['text'], backgroundWhite: layersSession['display']['text']['backgroundWhite']
        };
        if (layersSession['display']['text']['position']) {
          this.customTextStyle['top'] = layersSession['display']['text']['position']['top'] + 'px';
          this.customTextStyle['left'] = layersSession['display']['text']['position']['left'] + 'px';
          if (layersSession['display']['text']['size']) {
            this.customTextStyle['width'] = layersSession['display']['text']['size']['width'] + 'px';
            this.customTextStyle['height'] = layersSession['display']['text']['size']['height'] + 'px';
          }
          this.activeDraggableTextPosition = {
            x: layersSession['display']['text']['position']['left'],
            y: layersSession['display']['text']['position']['top']
          };
        } else {
          this.customTextStyle['width'] = '200px';
          setTimeout(() => {
            let element;
            if (this.module === 'places') {
              element = document.getElementById('map-div-block');
            } else if (this.module === 'population') {
              element = document.getElementById(this.mapId);
            }
            const textElement = document.getElementById('customTextElement_'+ this.layerType)
            let dummyTop = 0;
            let dummyLeft = 0;
            if (element && textElement) {
              const containerHeight = element.clientHeight;
              const containerWidth = element.clientWidth;
              const height = textElement.clientHeight > 350 ? 350 : textElement.clientHeight + 20;
              this.customTextStyle['height'] = height + 'px';
              const top = (containerHeight - height - 50);
              const left = (containerWidth - 200 - 20);
              this.customTextStyle['top'] = top + 'px';
              this.customTextStyle['left'] = left + 'px';
              this.dummyTextStyle['width'] = '200px';
              this.dummyTextStyle['top'] = top + 'px';
              this.dummyTextStyle['left'] = left + 'px';
              this.dummyTextStyle['height'] = height + 'px';
              dummyTop = top;
              dummyLeft = left;
              // Commented on 1-aug-2018 due to custom test wrong postion
              /*this.activeDraggableTextPosition = {
                x: left,
                y: top
              };*/
              this.layerDisplayOptions['text']['position'] = {
                'top': top,
                'left': left
              };
              this.layerDisplayOptions['text']['size'] = {
                'width': 200,
                'height': height
              };
              //this.layersService.setDisplayOptions(this.layerDisplayOptions);
              this.layerChanges.emit(this.layerDisplayOptions);

              this.addResizeIcon();
              this.cdRef.markForCheck();
            }
            this.activeDraggableTextPosition = {
              x: dummyLeft,
              y: dummyTop
            };
            this.customTextStyle = this.dummyTextStyle;
          }, 200);
        }
      }
    }
    this.cdRef.markForCheck();
  }
  public editText() {
    if (this.module === 'places') {
      this.placeFilterService.setFilterSidenav({ open: true, tab: 'layers' });
    } else if (this.module === 'population') {
      this.populationDataService.setFilterSideNav({open: true, tab: 'layers'});
    }
  }
  public onDragging(event) {
    this.resizingInProcess = true;
    this.cdRef.markForCheck();

  }
  public onDragStop(event) {
    if (!this.enableDraggable) {
      return true;
    }
    const layersSession = this.layersService.getlayersSession(this.layerType);
    this.resizingInProcess = false;
    const activeDraggableTextPosition = Helper.deepClone(this.activeDraggableTextPosition);
    activeDraggableTextPosition['x'] += event['x'];
    activeDraggableTextPosition['y'] += event['y'];
    this.customTextStyle['top'] = activeDraggableTextPosition['y'] + 'px';
    this.customTextStyle['left'] = activeDraggableTextPosition['x'] + 'px';
    this.activeDraggableTextPosition = activeDraggableTextPosition;
    this.layerDisplayOptions['text']['position'] = {
      'top': this.activeDraggableTextPosition['y'],
      'left': this.activeDraggableTextPosition['x']
    };
    this.layerDisplayOptions['screen'] = this.mapWidthHeight;
    //this.layersService.setDisplayOptions(this.layerDisplayOptions);
    layersSession['display'] = this.layerDisplayOptions;
    this.layerChanges.emit(this.layerDisplayOptions);

    this.layersService.saveLayersSession(layersSession, this.layerType);
    this.showDraggedText = false;
    setTimeout(() => {
      this.showDraggedText = true;
      this.addResizeIcon();
      this.cdRef.markForCheck();

    }, 20);
  }
  public onResizing(event) {
    this.resizingInProcess = true;
    this.cdRef.markForCheck();

  }
  public onResizeStop(event) {
    this.resizingInProcess = false;
    const layersSession = this.layersService.getlayersSession(this.layerType);
    this.customTextStyle['width'] = `${event.size.width}px`;
    this.customTextStyle['height'] = `${event.size.height}px`;
    if (typeof this.layerDisplayOptions['text'] === 'undefined') {
      this.layerDisplayOptions['text'] = {};
    }
    this.layerDisplayOptions['text']['size'] = {
      width: event.size.width,
      height: event.size.height
    };
    // this.layersService.setDisplayOptions(this.layerDisplayOptions);
    layersSession['display'] = this.layerDisplayOptions;
    this.layersService.saveLayersSession(layersSession, this.layerType);
    this.layerChanges.emit(this.layerDisplayOptions);
    this.cdRef.markForCheck();

  }
  public removeText() {
    this.layersService.setRemoveLogoAndText({
      type: this.layerType,
      value: 'text'
    });
    this.displayTextInfo = {};
    this.customTextStyle = {};
    this.enableDraggable = true;
    this.activeDraggableTextPosition = { x: 0, y: 0 };
    this.cdRef.markForCheck();

  }

  private addResizeIcon() {
    setTimeout(() => {
      const elements = document.getElementsByClassName('ng-resizable-se');
      if (elements.length > 0) {
        for (let i = 0; i < elements.length; i++) {
          // tslint:disable-next-line: max-line-length
          elements[i].innerHTML = '<svg style="width:24px;height:24px" viewBox="0 0 24 24" class="extand-img"> <path fill="#000000" d="M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z" /></svg>';
        }
      }
    }, 200);
  }

  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }
}
