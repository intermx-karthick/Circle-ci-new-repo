import { catchError, concatMap, filter } from 'rxjs/operators';
import { EMPTY, Observable, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppConfig } from 'app/app-config.service';
import { MatDialog } from '@angular/material/dialog';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { DeleteConfirmationDialogData } from '../Interfaces/delete-confirmation-dialog-data';
import { HttpErrorHandlerService } from '@shared/services/http-error-handler.service';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';


export interface GenericAssociation {
    _id: string;
    [key: string]: any;
}

export interface GenericAssociations {
    [associationName: string]: GenericAssociation[];
}

export interface GenricAssociationsResponse<T> {
    id: string;
    associations: T;
}

@Injectable()
export class AssociationsIdentifier {

    private baseUrlV1: string = this.config.envSettings['API_ENDPOINT'];

    private dialogueData = {
        title: 'Attention',
        description: 'Please <b>Confirm</b> This record has already been used on a Campaign or Contract. Please double-check all relationships before deleting.',
        confirmBtnText: 'OK',
        cancelBtnText: 'CANCEL',
        displayCancelBtn: true,
        displayIcon: true,
    };
    constructor(
        private dialog: MatDialog,
        private config: AppConfig,
        private http: HttpClient,
        private matSnackBar: MatSnackBar,
        private httpErrorHandler: HttpErrorHandlerService,
    ) {
    }

    public static associationsCount(res: GenricAssociationsResponse<any>): Number {
        return !!res && res.associations ? Object.keys(res?.associations)?.length : -1;
    }

    public static isValueHasAssociations(res: GenricAssociationsResponse<any>): boolean {
        return AssociationsIdentifier.associationsCount(res) > 0;
    }

    validateAssociationAndCallFunction<T>(path: string, callbackFunction: Function, dialogData: DeleteConfirmationDialogData, noLoader = false): void {
        this.getAssociations<T>(path, dialogData, noLoader)
            .pipe(
                filter(res => res && (res['action'] || res['hasNoAssociation']))
            )
            .subscribe((res) => {
                if (callbackFunction && typeof callbackFunction === 'function') {
                    callbackFunction();
                }
            });
    }

    getAssociations<T>(path: string, dialogData: DeleteConfirmationDialogData, noLoader = false): Observable<{ action?: boolean, hasNoAssociation?: boolean }> {

        let URL = `${this.baseUrlV1}${path}`;

        let headers: HttpHeaders;
        if (noLoader) {
            headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
        }

        return this.http.get<GenricAssociationsResponse<T>>(URL, { headers })
            .pipe(
                catchError((errorRes) => {
                    this.alertOnError(errorRes);
                    return of(null);
                }),
                concatMap((res) => {
                    if (AssociationsIdentifier.isValueHasAssociations(res)) {
                        return this.openConfirmationDialog(dialogData);
                    } else if (AssociationsIdentifier.associationsCount(res) === 0) {
                        return of({ hasNoAssociation: true });
                    }

                    return EMPTY;
                })
            );
    }

    private openConfirmationDialog(dialogData: DeleteConfirmationDialogData): Observable<{ action: boolean }> {
        return this.dialog
            .open(NewConfirmationDialogComponent, {
                width: '400px',
                maxHeight: '470px',
                minHeight: '260px',
                data: { ...this.dialogueData, ...dialogData},
                panelClass: 'imx-mat-dialog'
            })
            .afterClosed();
    }

    private showsAlertMessage(msg) {
        const config: MatSnackBarConfig = {
            duration: 3000
        };

        this.matSnackBar.open(msg, '', config);
    }

    private alertOnError(errorRes) {
        if (errorRes?.error?.message) {
            this.showsAlertMessage(errorRes?.error?.message);
        } else {
            this.showsAlertMessage(errorRes?.message);
        }
    }

}
