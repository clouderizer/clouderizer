import { Component, OnInit, forwardRef, Input, OnChanges } from '@angular/core';
import { FormControl, ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';


export function createCounterRangeValidator(maxValue, minValue) {
  return (c: FormControl) => {
    let err = {
      rangeError: {
        given: c.value,
        max: maxValue || 10,
        min: minValue || 0
      }
    };

  return (c.value > +maxValue || c.value < +minValue) ? err: null;
  }
}

@Component({
  selector: 'counter-input',
  template: `
  <span class="plus-minus" [class.disabled]="isLimit"><img
  src="assets/images/subscriptionplans/minus-thick.svg" (click)="decrease()" /></span>
<input type="text" class="form-control input-number" value="{{ counterValue }}">
<span class="plus-minus"><img
  src="assets/images/subscriptionplans/plus-thick.svg" (click)="increase()" /></span>
  `,
  styles: [`
  .disabled {
    pointer-events: none; 
    display: none;
  }
  `],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CounterInputComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => CounterInputComponent), multi: true }
  ]
})
export class CounterInputComponent implements ControlValueAccessor, OnChanges {

  public isLimit:boolean = true;

  propagateChange:any = () => {};
  validateFn:any = () => {};
  
  @Input('counterValue') _counterValue = 0;
  @Input() counterRangeMax;
  @Input() counterRangeMin;

  get counterValue() {
    return this._counterValue;
  }
  
  set counterValue(val) {
    this._counterValue = val;
    this.propagateChange(val);
  }

  ngOnChanges(inputs) {
    if (inputs.counterRangeMax || inputs.counterRangeMin) {
      this.validateFn = createCounterRangeValidator(this.counterRangeMax, this.counterRangeMin);
    }
  }

  writeValue(value) {
    if (value) {
      this.counterValue = value;
    }
  }

  registerOnChange(fn) {
    this.propagateChange = fn;
  }

  registerOnTouched() {}

  increase() {
    this.isLimit = false;
    this.counterValue++;
  }

  decrease() {
    this.counterValue--;
    if (this.counterValue < 2){
        this.isLimit = true;
    }
  }

  validate(c: FormControl) {
    return this.validateFn(c);
  }
}