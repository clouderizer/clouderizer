// import { Directive, forwardRef, Input } from '@angular/core';
// import { NG_VALIDATORS, Validator, AbstractControl } from '@angular/forms';

// @Directive({
//     selector: '[invalidValidator][ngModel],[invalidValidator][formControl],[invalidValidator][formControlName]',
//     providers: [
//         { provide: NG_VALIDATORS, useExisting: forwardRef(() => invalidValidatorDirective), multi: true }
//     ]
// })
// // Class definition for Custom Validator
// export class invalidValidatorDirective implements Validator {
//     @Input('invalidValidator') allowed: string;
//     validate(ctrl: AbstractControl): { [key: string]: boolean } | null {
//         console.log(ctrl.value);
//         console.log(this.allowed);
//         if (ctrl.value != ''){
//             return this.allowed.includes(ctrl.value) ? null : { 'invalidValue': true }  ;
//         }
//         else{
//             return null
//         }
//     }
// }

import { AbstractControl, ValidatorFn } from '@angular/forms';

export function invalidValueValidator(allowed): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
        if(control.value != '' && allowed.length > 0){
            console.log("space is not there");
            if(!allowed.includes(control.value)){
                console.log(allowed);
                console.log(control.value);
            }
            return allowed.includes(control.value) ? null: {'invalidValue': true}
        }
        else{
            console.log("space is there");
            return null
        }
    };
}