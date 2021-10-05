import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IMXPDFPreviewerComponent } from '@shared/components/imx-pdf-previewer/imx-pdf-previewer.component';
import { PdfPreviewerOption } from '@shared/components/imx-pdf-previewer/pdf-previewer.option';

@Injectable({
  providedIn: 'root'
})
export class PdfPreviewerService {

  constructor(
    public dialog: MatDialog
  ) {
  }

  open(option: PdfPreviewerOption){
    return this.dialog
      .open(IMXPDFPreviewerComponent, {
        data: option,
        disableClose: true,
        closeOnNavigation: true,
        panelClass: ['imx-pdf-previewer-dialog']
      })
      .afterClosed();
  }
}
