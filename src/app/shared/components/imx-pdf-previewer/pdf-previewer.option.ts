export class PdfPreviewerOption {
  title = '';
  downloadFileName = '';
  pdfSrc: string | Blob = ''; // blob or url, tested with these both
  copyURL = '';

  constructor(option: PdfPreviewerOption) {
    this.title = option.title;
    this.copyURL = option.copyURL;
    this.pdfSrc = option.pdfSrc;
    this.downloadFileName = option.downloadFileName;
  }
}
