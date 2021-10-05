import {
	ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, OnChanges
} from '@angular/core';
import { Options, LabelType } from '@angular-slider/ngx-slider';
import { IMXNgxSliderRange} from './imx-ngx-slider.model';
import { ConvertPipe } from '@shared/pipes/convert.pipe';

@Component({
	selector: 'imx-ngx-slider',
	templateUrl: './imx-ngx-slider.component.html',
	styleUrls: ['./imx-ngx-slider.component.less'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [ConvertPipe],
})
export class IMXNgxSliderComponent implements  OnChanges {
	@Input() disabled: boolean;
	@Input() sliderRange: IMXNgxSliderRange; 
	@Input() sliderOptions: Options = {
		floor: 0,
		ceil: 100,
		minLimit: 0,
		step: 1,
		noSwitching: true,
	};
	@Output() sliderRangeHandler = new EventEmitter<any>();

	public floorText: string = "";
	public ceilText: string = "";

	public manualRefresh: EventEmitter<void> = new EventEmitter<void>();

	constructor(private convertPipe: ConvertPipe) {
	}

	ngOnChanges(changes: any): void {
		if (changes.sliderRange?.currentValue) {
			this.sliderRange = changes.sliderRange?.currentValue
		}
		if (changes.disabled != undefined) {
			this.sliderOptions = Object.assign({}, this.sliderOptions, { disabled: this.disabled });
		}
		if (changes.sliderOptions?.currentValue) {
			this.sliderOptions = Object.assign({}, changes.sliderOptions?.currentValue, { disabled: this.disabled });
			this.updateLabels();
		}
	}

	updateLabels(): void {
		const {floor, ceil, translate} = this.sliderOptions;
		this.floorText = translate ? translate(floor, LabelType.Floor) : floor.toString();
		this.ceilText = translate ? translate(ceil, LabelType.Ceil) : ceil.toString();
	}

	changeEndHandler(changedValue: any): void {
		const { highValue, value } = changedValue;
		this.sliderRangeHandler.emit({ highValue, value } as IMXNgxSliderRange);
	}

}