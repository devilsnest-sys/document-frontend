import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl  } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-registration',
  standalone: false,
  
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css'
})
export class RegistrationComponent {
  registrationForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.registrationForm = this.fb.group({
      username: ['', Validators.required],
      // email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, this.matchPasswords.bind(this)]],
      // mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      // role: ['', Validators.required],
      // designation: ['', Validators.required],
      // companyId: ['', Validators.required]
    });
  }

  matchPasswords(control: AbstractControl): { [key: string]: boolean } | null {
    if (control.value !== this.registrationForm?.get('password')?.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registrationForm.valid) {
      // You can handle form submission logic here (e.g., sending data to a backend)
      Swal.fire('Success!', 'Your registration was successful.', 'success');
      this.registrationForm.reset();
    } else {
      Swal.fire('Error', 'Please fill out all required fields correctly.', 'error');
    }
  }
}
