import { Component, Output, EventEmitter } from "@angular/core";
import { TravelerCountData } from "src/modules/map/interfaces/map-types";

@Component({
  selector: 'prizm-segmentation-page',
  template: `
    <div class="prizm-segmentation-container">
      <h3 class="insights-title">
        INSIGHTS //  Prizm Segmentation
      </h3>
      <h1 class="data-byte-title">
        Prizm Segmentation
      </h1>
      <p class="data-byte-description">
        For every zip code, report the breakdown of the top Prizm Segments that are in the zipcode overnight
        defined as 3am on the date, then the person-nights aggregated for the week
        Monday (Sunday night) - Sunday (Saturday Night)
        <br><br>
        This is currently using the unique count coming from
        /anytimepop/dma/dma(dmaID)/nonlocal/stats/historical/wd1234567.json
        <br>
        which is grouped by DMA, not zip code, and does not provide the weekday of arrival, or duration of stay. This data is also not limited to a specific time range.
        <br><br>
        It probably will need to be changed to use
        <br>
        /anytimepop/dma/dma(dmaID)/tradearea/zip/dates(dateRange)/(segment)/pl(zipCode)_wd1234567_hrs.json
        <br>
        Which will be grouped by zip code, provide weekday of arrival, and duration of stay to more accurately represent the description above.
      </p>
      <prizm-segmentation [withBar]="true" (onDataLoad)="onDataLoad.emit($event)"></prizm-segmentation>
    </div>
  `,
  styleUrls: ['./prizm-segmentation.component.less']
})
export class PrizmSegmentationPageComponent {
  @Output() onDataLoad = new EventEmitter<TravelerCountData>()
}
