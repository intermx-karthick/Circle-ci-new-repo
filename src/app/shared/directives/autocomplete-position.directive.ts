import { Directive, Input, OnDestroy } from '@angular/core';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';

@Directive({
  selector: '[autocompletePosition]'
})
export class AutocompletePositionDirective {
private matAutocompleteTrigger: MatAutocompleteTrigger;
  private scrollContent;
  private isAutoCompleteMovingEnable = false;
  private documentContainer:any;
  @Input() set autocompletePosition(value: MatAutocompleteTrigger) {
    this.matAutocompleteTrigger = value;
    this.setScrollContainer(this.scrollContent);
   //window.addEventListener('scroll', this.scrollEvent, true);
  }

  @Input() set scrollContainer(value: string) {
    this.scrollContent = value;
    this.setScrollContainer(this.scrollContent);
  }


  setScrollContainer(scrollContent){
    if(scrollContent){
      this.documentContainer = null;
      this.scrollContent = scrollContent;
      setTimeout(() => {
        this.documentContainer = document.getElementById(this.scrollContent);
        if(this.documentContainer){
          this.documentContainer?.addEventListener('scroll', this.scrollEvent, true);
        }        
      }, 1000);
    }
  }

  @Input() set isAutoCompleteMoving(value:boolean) {
   this.isAutoCompleteMovingEnable = value
  }

  private scrollEvent = (): void => {
    if (this.matAutocompleteTrigger == null) {
      return;
    }
    if (this.matAutocompleteTrigger.panelOpen) {
      if(this.isAutoCompleteMovingEnable){
        this.matAutocompleteTrigger.updatePosition();
      }else{
        this.matAutocompleteTrigger.closePanel();
      }
    }
  };

  ngOnDestroy() {
    //window.removeEventListener('scroll', this.scrollEvent, true);
    this.documentContainer?.addEventListener('scroll', this.scrollEvent, true);
  }
}
