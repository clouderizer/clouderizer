import { Directive, forwardRef, Input } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl } from '@angular/forms';

@Directive({
    selector: '[KeywordValidator][ngModel],[KeywordValidator][formControl],[KeywordValidator][formControlName]',
    providers: [
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => KeywordValidatorDirective), multi: true }
    ]
})
// Class definition for Custom Validator
export class KeywordValidatorDirective implements Validator {
    @Input('KeywordValidator') Keywords: any[];
    validate(ctrl: AbstractControl): { [key: string]: boolean } | null {
        console.log(ctrl.value);
        return this.Keywords.includes(ctrl.value)? null: { 'invalidValue': true };
    }
}