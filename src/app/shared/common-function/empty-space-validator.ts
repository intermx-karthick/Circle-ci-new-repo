import { AbstractControl } from '@angular/forms';

export function emptySpaceValidator(control: AbstractControl) {
    const value: any = control.value;
    if (value && typeof value === 'string' && value.trim().length > 0) {
        return null;
    } else {
        return { invalid: true };
    }
}
