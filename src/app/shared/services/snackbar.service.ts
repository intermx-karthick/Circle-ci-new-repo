import { MatSnackBarConfig, MatSnackBar } from '@angular/material/snack-bar';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  constructor(private matSnackBar: MatSnackBar) {}

  private getSnackBarConfig(): MatSnackBarConfig {
    return {
      duration: 5000
    };
  }

  public showsAlertMessage(msg: string): void {
    const config = this.getSnackBarConfig();
    this.matSnackBar.open(msg, 'close', {
      ...config
    });
  }
}
