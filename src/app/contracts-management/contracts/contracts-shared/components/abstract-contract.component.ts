import { ChangeDetectorRef, Component, OnDestroy } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { PlacementType } from "@interTypes/inventory";
import { MediaDetailsService } from "app/contracts-management/services/media-details.service";
import { Observable, of, Subject } from "rxjs";
import { filter, takeUntil } from "rxjs/operators";

interface ContractLineItemDropDown {
  // Set the placement type initial load
  setUpPlacementType();
  // set the placement search form details
  searchPlacementType(formGroupName: FormGroup, fieldname: string);
}
@Component({
  template: ''
})
export abstract class AbstractContractComponent implements OnDestroy, ContractLineItemDropDown {

  public unsubscribe$: Subject<void> = new Subject();

  constructor(public cdRef: ChangeDetectorRef, private mediaService: MediaDetailsService) { }

  public placementType: PlacementType[] = [];
  public filteredplacement: Observable<PlacementType[]>;

  /**
   * This method used to get the placement type from API
   */
  public setUpPlacementType() {
    this.mediaService.getPlacementTypes().subscribe(res => {
      if (res.placement_types.length) {
        this.filteredplacement = of([...res.placement_types]);
        this.placementType = [...res.placement_types];
      }
    });
  }

  /**
   * This method used to watch the placementType search
   * @param formGroupName FormGroup name
   * @param fieldname placementType name
   */
  public searchPlacementType(formGroupName: FormGroup, fieldname: string) {
    formGroupName.controls[fieldname].valueChanges
      .pipe(
        takeUntil(this.unsubscribe$),
        filter(res => typeof res === 'string')
      ).subscribe(res => this._placemanetfilter(res));
  }

  /**
   * This method used to set the placement search filter obserable result
   * @param value search text
   */
  private _placemanetfilter(value: string) {
    const filterValue = value.toLowerCase();
    this.filteredplacement = of(this.placementType.filter(option => option.name.toLowerCase().includes(filterValue)));
  }

  /**
   * To clear the subscribe memort when leave the component or module
   */
  public ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}