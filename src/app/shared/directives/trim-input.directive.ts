import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appTrimInput]',
  standalone: false
})
export class TrimInputDirective {
 constructor(private ngControl: NgControl) {}

  @HostListener('blur', ['$event.target.value'])
  onBlur(value: string) {
    const trimmed = value.trim(); // only trims start and end
    if (value !== trimmed) {
      this.ngControl.control?.setValue(trimmed);
    }
  }

}
