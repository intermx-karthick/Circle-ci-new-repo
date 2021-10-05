import { Component, Input, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CityCastApiService } from '../services/city-cast-api.service';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-city-cast-metrics',
  templateUrl: './city-cast-metrics.component.html',
  styleUrls: ['./city-cast-metrics.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CityCastMetricsComponent implements OnInit{
  @Input() scenarioId = '';
  @Input() castMetrics = {};
  metrics = [];
  extensions = {
    csv: 'text/csv',
    json: 'application/json',
    gz: 'application/gzip'
  };
  constructor(private ccAPIService: CityCastApiService) {}
  ngOnInit(): void {
    this.metrics = this.castMetrics['files'].slice(0, 10);
  }
  trackByFileName(index: number, row: any): string {
    return row['file'];
  }

  downloadMetrics(basepath, file) {
    const extn = this.extensions[this.getFileExtension(file)];
    this.ccAPIService
      .getDataFromS3URL(basepath + '/' + file, false, extn)
      .subscribe(
        (data) => {
          const blob = new Blob([data.body], {
            type: 'application/json;charset=utf-8'
          });
          saveAs(blob, file);
        },
        (error) => {
        }
      );
  }
  getFileExtension(filename) {
    return filename.split('.').pop();
  }
}
