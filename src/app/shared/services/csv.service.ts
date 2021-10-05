import {Injectable} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppConfig } from '../../app-config.service';
@Injectable()
export class CSVService {

  constructor(
    private http: HttpClient,
    private config: AppConfig) {
  }
  private csvData;
  public build(headerData, jsonData, showLabel) {
    const arrData: any = [];
    const headerDataPart: any = [];
    for (let i = 0; i < jsonData.length; i++) {
      arrData[i] = typeof jsonData[i] !== 'object' ? JSON.parse(jsonData[i]) : jsonData[i];
    }
    for (let i = 0; i < headerData.length; i++) {
      headerDataPart[i] = typeof headerData[i] !== 'object' ? JSON.parse(headerData[i]) : headerData[i];
    }
    this.csvData = '';
    // Set Report title in first row or line
    if (showLabel) {
      for (let i = 0; i < headerDataPart.length; i++) {
        let row = '';

        for (let index in headerDataPart[i]) {
          row += '"' + headerDataPart[i][index] + '",';
        }
        row.slice(0, -1);
        // add a line break after each row
        this.csvData += row + '\r\n';
      }
    }

    for (let i = 0; i < arrData.length; i++) {
      let row = '';
      for (let index in arrData[i]) {
        row += '"' + arrData[i][index] + '",';
      }

      row.slice(0, row.length - 1);
      // add a line break after each row
      this.csvData += row + '\r\n';
    }
    return this;
  }

  public download(fname = 'InventoryExport', exportFormat = 'csv') {
    if (this.csvData === '') {
      return;
    }
    const fileName = fname;
    if (navigator.msSaveOrOpenBlob) {
      const blob = new Blob([this.csvData], {type: 'data:text/csv;charset=utf-8'});
      navigator.msSaveBlob(blob, 'InventoryExport.csv');

    } else {
      const uri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(this.csvData);
      const link = document.createElement('a');
      link.href = uri;
      link.style.visibility = 'hidden';
      link.download = fileName + '.' + exportFormat;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }


  public getSampleCSV(noLoader = false) {
    let reqHeaders =  new HttpHeaders();
    if (noLoader) {
      reqHeaders = reqHeaders.set('hide-loader', 'hide-loader');
    }
    reqHeaders = reqHeaders.set('Accept', 'text/csv');
    const url = `${this.config.envSettings['API_ENDPOINT']}workflows/scenarios/spot_schedule/fields`;
    return this.http.get(url, { observe: 'response', responseType: 'blob', headers: reqHeaders });
  }
}
