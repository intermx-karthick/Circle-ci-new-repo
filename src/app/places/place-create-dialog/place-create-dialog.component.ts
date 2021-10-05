import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PlacesService, ThemeService } from '@shared/services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MarketsSelectorDialogComponent } from '@shared/components/markets-selector-dialog/markets-selector-dialog.component';
import { CreateNewPlace, OpenHours, Hours } from '@interTypes/Place-audit-types';

@Component({
    selector: 'app-place-create-dialog',
    templateUrl: './place-create-dialog.component.html',
    styleUrls: ['./place-create-dialog.component.less']
})
export class PlaceCreateDialogComponent implements OnInit, OnDestroy {
    placeCreateForm: FormGroup;
    clientId;
    themeSettings: any;
    private unSubscribe: Subject<void> = new Subject<void>();

    constructor(
        public dialogRef: MatDialogRef<PlaceCreateDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private placeData: any,
        private fb: FormBuilder,
        private placeService: PlacesService,
        private theme: ThemeService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {}
    public selectedDMA;
    public selectedCounty;
    ngOnInit(): void {
        this.themeSettings = this.theme.getThemeSettings();
        this.clientId = this.themeSettings.clientId;

        const lngLat = this.placeData['placeLatLong'];
        this.placeCreateForm = this.fb.group({
            location_id: [''],
            location_name: ['', Validators.required],
            short_name: [''],
            address: [''],
            city: [''],
            state: [''],
            zip_code: [''],
            phone_number: [''],
            county: [''],
            lat: [lngLat[1]],
            lng: [lngLat[0]],
            dma: [''],
            hours: [null]
        });
    }

    public onSubmit() {
        if (this.placeCreateForm.invalid) {
            return true;
        }
        const formData = this.placeCreateForm.value;
        const reqData: CreateNewPlace = {
          location_name: formData.location_name,
          short_name: this.formatNullorEmpty(formData.short_name),
          city: this.formatNullorEmpty(formData.city),
          address: this.formatNullorEmpty(formData.address),
          state: this.formatNullorEmpty(formData.state),
          zip_code: this.formatNullorEmpty(formData.zip_code),          
          open_hours: this.formatOpenHoursForAPI(formData.hours),
          phone_number: this.formatNullorEmpty(formData.phone_number)
        };

        if (formData.lat && formData.lng) {
          reqData.lat = formData.lat;
          reqData.lng = formData.lng;
          reqData.display_geometry = {
            'type': 'Point',
            'coordinates': [formData.lng, formData.lat]
          };
          reqData.nav_geometry = {
            'type': 'Point',
            'coordinates': [formData.lng, formData.lat]
          };
        }

        const regex = /DMA|CBSA|CNTY/;
        if(this.selectedDMA){          
          reqData['DMA_id'] = this.selectedDMA[0]['id'].replace(regex, '');
          reqData['DMA_name'] = this.selectedDMA[0]['name']
        }

        if(this.selectedCounty){
          reqData['county_id'] = this.selectedCounty[0]['id'].replace(regex, '');
          reqData['county_name'] = this.selectedCounty[0]['name']
        }


        /** Check open hours empty object */
        if (!Object.keys(reqData.open_hours).length) {
          delete reqData.open_hours;
        }

        const formatPlace = this.formatPlaces(reqData);

        this.placeService
            .createNewPlace(formatPlace, this.clientId, true)
            .pipe(takeUntil(this.unSubscribe))
            .subscribe((res) => {
                    this.dialogRef.close(res);
                },
                (error) => {
                  let message = 'Something went wrong, Please try again later.';
                    if (error?.error?.message) {
                        message = error.error.message;
                    }
                    this.snackBar.open(message, '', {
                        duration: 2000
                    });
                }
            );
    }

    formatNullorEmpty(field) {
      if(field && field.toString().trim() && field !== null && field !== ''){
        return field;
      } else {
        return null;
      }
    }


    formatPlaces(place) {
      Object.keys(place).map((key) => {
          if (place[key] == '' || place[key] === null) {
              delete place[key];
          }
      });
      return place;
    }

  /**
   * This function is to format hours data for API submission
   */
    private formatOpenHoursForAPI(hours: OpenHours<Hours>): OpenHours<string> {
      const data: OpenHours<string> = {};
      for (const day in hours) {
        if (hours.hasOwnProperty(day)) {
          if (hours[day]['from']) {
            data[day] = hours[day]['from'];
          }
          if (hours[day]['to']) {
            data[day] += `-${hours[day]['to']}`;
          }
          if (hours[day]['next']) {
            data[day] += ` 0000-${hours[day]['next']}`;
          }
        }
      }
      return data;
    }

  

    public openMarketDialog(type) {
      this.dialog.open(MarketsSelectorDialogComponent, {
        width: '600px',
        data: {'type': type},
      }).afterClosed().subscribe( res =>{
        if (res) {
            switch (type) {
              case 'DMA':
                  this.selectedDMA = [...res['selectedMarkets']];
                  this.placeCreateForm.controls['dma'].patchValue(this.selectedDMA[0]['name'])
                break;
              case 'County':
                this.selectedCounty = [...res['selectedMarkets']];
                this.placeCreateForm.controls['county'].patchValue(this.selectedCounty[0]['name'])
              break;              
              default:
                break;
            }
        }
      });
    }

    public clearMarket(type) {
      switch (type) {
        case 'DMA':
            this.selectedDMA = null;
            this.placeCreateForm.controls['dma'].patchValue('')
          break;
        case 'County':
          this.selectedCounty = null
          this.placeCreateForm.controls['county'].patchValue('')
        break;              
        default:
          break;
      }
    }
    
    ngOnDestroy() {
        this.unSubscribe.next();
        this.unSubscribe.complete();
    }
}
