import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { ClassLike, MenuOption } from '@interTypes/population-intelligence-types';
import { Options as SliderOptions } from '@angular-slider/ngx-slider'

type ValueLike = number | boolean | string
interface ValueRange {
  min: ValueLike,
  max: ValueLike
}

@Component({
  selector: 'menu-slider',
  template: `
    <div class="menu-slider-wrapper" [ngClass]="wrapperClass" [class.hide-labels]="hideValueLabel">
      <label *ngIf="label" [ngClass]="labelClass || 'light-label'">
        {{ label }}
      </label>
      <ngx-slider
        *ngIf="ranged"
        [ngClass]="{animated: animated, animating: animating, ranged: ranged}"
        [value]="_value.min"
        (valueChange)="updateLocalSide($event, 'min')"
        [highValue]="_value.max"
        (highValueChange)="updateLocalSide($event, 'max')"
        [options]="sliderOptions"
        (userChangeStart)="onChangeStart($event)"
        (userChangeEnd)="onChangeEnd($event)"
      ></ngx-slider>
      <ngx-slider
        *ngIf="!ranged"
        [ngClass]="{animated: animated, animating: animating, ranged: ranged}"
        [value]="_value.min"
        (valueChange)="updateLocalValue($event)"
        [options]="sliderOptions"
        (userChangeStart)="onChangeStart($event)"
        (userChangeEnd)="onChangeEnd($event)"
      ></ngx-slider>
    </div>
  `,
  styleUrls: ['./menu-slider.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuSliderComponent implements OnInit, OnChanges, OnDestroy {
  @Input() wrapperClass: ClassLike = null
  @Input() sliderclass: ClassLike = null
  @Input() label: string = null
  @Input() labelClass: ClassLike = null
  @Input() minValue: number = null
  @Input() maxValue: number = null
  @Input() value: ValueLike | ValueRange = null
  @Input() hideValueLabel: boolean = false
  _value: { min: number, max: number } = { min: 0, max: 0 }

  @Input() steps: MenuOption[] = null
  @Input() animated: boolean = false
  @Input() animating: boolean = false
  @Input() animationDelay: number = 450
  @Input() ranged: boolean = false
  @Input() minDistance: number = null
  @Input() maxDistance: number = null
  @Input() disabled: boolean = false

  @Output() valueChange = new EventEmitter<ValueLike | ValueRange>()
  @Output() animatingChange = new EventEmitter<boolean>()
  @Output() onResize = new EventEmitter<Event>()
  @Output() onClick = new EventEmitter<void>()
  @Output() onValueChange = new EventEmitter<ValueLike | ValueRange>()
  @Output() onAnimationStart = new EventEmitter<void>()
  @Output() onAnimationEnd = new EventEmitter<void>()

  @ViewChild('slider') slider

  private get CLICK_THRESHOLD() {
    return 175
  }
  private animationInterval: ReturnType<typeof setInterval> | null = null
  private sliderStartTime: number = 0
  private sliderStartValue: number = 0

  sliderOptions: SliderOptions = null

  private updateSliderOptions() {
    let steps = this.steps ? this.steps.map((o, i) => ({ value: i, legend: o.text })) : null
    this.sliderOptions = {
      enforceRange: true,
      bindIndexForStepsArray: true,
      ceil: this.maxValue || 1,
      disabled: this.disabled,
      draggableRange: this.ranged,
      floor: this.minValue || 0,
      maxLimit: this.maxValue || 1,
      maxRange: this.maxDistance,
      minLimit: this.minValue || 0,
      minRange: this.minDistance,
      stepsArray: steps,
      translate: d => this.steps ? this.steps[d].value as string : d.toString()
    }
  }

  private updateValue(newValue: any, from: string = null) {
    this.valueChange.emit(newValue)
    this.onValueChange.emit(newValue)
  }

  /**
   * enforces the minDistance and min/max bounds for the slider (specifically on startup)
   *
   * can recurse a maximum of 3 times when fitting the minDistance bounds if broken (left bounds hit, right bounds hit, no bounds left to hit, give up)
   */
  private fixValue() {
    let { min, max } = this._value
    // first ensure min/max are within their outer bounds
    if (min < this.minValue) {
      this._value.min = min = this.minValue
    } else if (max > this.maxValue) {
      this._value.max = max = this.maxValue
    }
    // then, if ranged, ensure we're within the minimum distance
    let neededDistance = (max - min - this.minDistance) * -1
    if (neededDistance > 0) {
      if (max < this.maxValue) {
        if (max + neededDistance <= this.maxValue) {
          this._value.max = max = max + neededDistance
        } else {
          this._value.max = max = this.maxValue
          return this.fixValue()
        }
      } else if (min > this.minValue) {
        if (min - neededDistance >= this.minValue) {
          this._value.min = min = min - neededDistance
        } else {
          this._value.min = min = this.minValue
          return this.fixValue()
        }
      }
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.value && !this.valueMatches(changes.value.currentValue)) {
      this.updateLocalValue(changes.value.currentValue, false)
    }
  }

  valueMatches(otherValue: ValueLike | ValueRange) {
    if (typeof this.value != typeof otherValue || !!this.value != !!otherValue) {
      return false
    } else if (this.value && typeof this.value === 'object' && otherValue && typeof otherValue === 'object') {
      return this.value.min == otherValue.min && this.value.max == otherValue.max
    } else {
      return this.value == otherValue
    }
  }


  private localCache = { // updates on a ranged animated slider come in too fast
    // we'll cache each side individually and then mash them together in an update via a timeout
    min: this._value.min,
    max: this._value.max
  }
  private updateTimeout = null
  updateLocalSide(sideValue: number, side: string = 'min') {
    this.localCache[side] = sideValue
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout)
    }
    this.updateTimeout = setTimeout(() => {
      this.updateLocalValue(this.localCache)
      this.updateTimeout = null
    }, 10)
  }

  private holding: boolean = false
  /**
   * updates the this._value with a newValue, emitting it back to this.value if needed
   *
   * @param newValue new index-based value. number for singular, min/max for ranged
   * @param update emit an update to this.value?
   */
  updateLocalValue(newValue: ValueLike | ValueRange, update: boolean = true) {
    let updatedValue = this.value
    let [min, max] = newValue && typeof newValue === 'object' ? [newValue.min, newValue.max] : [newValue, newValue]
    if (this.steps) {
      let minIndex = this.steps.findIndex(o => o.value === min)
      let maxIndex = this.steps.findIndex(o => o.value === max)
      this._value = { min: minIndex, max: maxIndex }

      this.fixValue()
      if (this.ranged) {
        updatedValue = { min: this.steps[this._value.min]?.value, max: this.steps[this._value.max]?.value }
      } else {
        updatedValue = this.steps[this._value.min]?.value
      }
    } else {
      this._value = { min: min as number, max: max as number }
      this.fixValue()
      if (this.ranged) {
        updatedValue = { min: this._value.min, max: this._value.max }
      } else {
        updatedValue = this._value.min
      }
    }

    if (update) {
      this.localCache = { min: this._value.min, max: this._value.max }
      this.updateValue(updatedValue, 'update local')
    }
  }

  ngOnInit() {
    if (!this.maxValue && this.steps) {
      this.maxValue = this.steps.length
    }
    this.updateSliderOptions()
    this.updateLocalValue(this.value, false)
    if (this.animated && this.animating) {
      this.startAnimating()
    }
  }

  ngOnDestroy() {
    this.stopAnimating() // clear interval if exists
  }

  onChangeStart(evt) {
    this.sliderStartTime = performance.now()
    this.holding = true
    this.sliderStartValue = evt.value
  }

  onChangeEnd(evt) {
    let duration = performance.now() - this.sliderStartTime
    if (duration <= this.CLICK_THRESHOLD && evt.value === this.sliderStartValue) {
      this.onClick.emit()
      if (this.animated) {
        this.animating ? this.stopAnimating() : this.startAnimating()
      }
    }
    this.holding = false
  }

  startAnimating() {
    if (this.animated && (!this.animating || !this.animationInterval)) {
      if (this.animationInterval) {
        clearInterval(this.animationInterval)
      }
      this.animatingChange.emit(true)
      this.onAnimationStart.emit()
      this.animationInterval = setInterval(() => {
        if (this.holding) {
          return
        }
        if (this.ranged) {
          let distance = this._value.max - this._value.min
          if ((this._value.max + 1) > this.maxValue) {
            this.updateLocalValue({ min: this.minValue, max: this.minValue + distance })
          } else {
            this.updateLocalValue({ min: this._value.min + 1, max: this._value.max + 1 })
          }
        } else {
          let nextValue = (this._value.min + 1 - (this.minValue || 0)) % ((this.maxValue || 0) - (this.minValue || 0) + 1) + (this.minValue || 0)
          this.updateLocalValue(nextValue)
        }
      }, this.animationDelay)
    }
  }
  stopAnimating() {
    if (this.animated && (this.animating || this.animationInterval)) {
      this.animatingChange.emit(false)
      clearInterval(this.animationInterval)
      this.animationInterval = null
      this.onAnimationEnd.emit()
    }
  }
}
