import { Injectable, Injector } from '@angular/core';
import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationDialog } from '@interTypes/workspaceV2';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { HttpStatusCode } from '@interTypes/enums';
import { AuthService } from 'app/auth/auth.service';
import { AuthenticationService } from '@shared/services';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class ErrorHandlerInterceptor implements HttpInterceptor {
    private dialogRef;
    constructor(
        private dialog: MatDialog,
        private injector: Injector,
        private snackBar: MatSnackBar
    ) {}
    intercept(
        request: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            tap(
                (event) => {},
                (error: HttpErrorResponse) => {
                  if (error.status === HttpStatusCode.UNAUTHORIZED) {
                      this.snackBar.open(`Your session has expired.`, 'OK', {
                        duration: 3000
                      }).afterDismissed().subscribe(() => {
                        const auth = this.injector.get(AuthenticationService);
                        auth.logout();
                      });
                    }

                    // To show the popup when the request quota limit exceeded.
                    if (error.status === HttpStatusCode.TOO_MANY_REQUESTS) {
                        if (!this.dialogRef) {
                            const dialogData: ConfirmationDialog = {
                                notifyMessage: true,
                                confirmTitle: 'Info',
                                messageText:
                                    'Request Quota Limit Exceeded. Please try after sometime.'
                            };
                            this.dialogRef = this.dialog
                                .open(ConfirmationDialogComponent, {
                                    data: dialogData,
                                    width: '450px'
                                })
                                .afterClosed()
                                .pipe(
                                    finalize(() => (this.dialogRef = undefined))
                                );
                        }
                    }
                }
            )
        );
    }
}
