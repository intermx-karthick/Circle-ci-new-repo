import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { ReportsAPIService } from '../services/reports-api.service';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class TableauVisualiserResolver implements Resolve<any> {
    constructor(private reportsAPIService: ReportsAPIService) {}
    resolve(route: ActivatedRouteSnapshot) {
        return this.reportsAPIService.getTableauVisualURLs().pipe(
            catchError(() => {
                return EMPTY;
            })
        );
    }
}
