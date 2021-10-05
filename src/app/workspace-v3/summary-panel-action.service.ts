import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SummaryPanelActionService {
  private operatorData = new Subject();
  private mediaData = new Subject();
  private thresholdsType = new Subject();
  private mediaAtrribute = new Subject();
  private removeLocation = new Subject();
  private removePackage = new Subject();
  constructor() { }
  public triggerDeleteOperator(operator) {
    this.operatorData.next(operator);
  }
  public deleteOperator(): Observable<any> {
    return this.operatorData.asObservable();
  }
  public triggerDeleteMedia(media) {
    this.mediaData.next(media);
  }
  public deleteMedia(): Observable<any> {
    return this.mediaData.asObservable();
  }
  public triggerDeleteThresholds(type) {
    this.thresholdsType.next(type);
  }
  public deleteThresholds(): Observable<any> {
    return this.thresholdsType.asObservable();
  }
  public triggerDeleteMediaAttr(type) {
    this.mediaAtrribute.next(type);
  }
  public deleteMediaAttr(): Observable<any> {
    return this.mediaAtrribute.asObservable();
  }
  public triggerDeleteLocation(type) {
    this.removeLocation.next(type);
  }
  public deleteLocation(): Observable<any> {
    return this.removeLocation.asObservable();
  }
  public triggerDeletePackage(type) {
    this.removePackage.next(type);
  }
  public deletePackage(): Observable<any> {
    return this.removePackage.asObservable();
  }
  public triggerSpotIDFilter(type) {
    this.removePackage.next(type);
  }
  public deleteSpotIDFilter(): Observable<any> {
    return this.removePackage.asObservable();
  }
}
