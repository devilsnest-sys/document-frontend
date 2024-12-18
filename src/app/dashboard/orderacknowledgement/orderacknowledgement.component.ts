import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-orderacknowledgement',
  standalone: false,
  
  templateUrl: './orderacknowledgement.component.html',
  styleUrl: './orderacknowledgement.component.css'
})
export class OrderacknowledgementComponent {
  poForm: FormGroup;

  constructor(private fb: FormBuilder) {
      this.poForm = this.fb.group({
          poDescription: ['', Validators.required],
          poType: ['', Validators.required],
          incoterms: ['', Validators.required],
          shipmentDate: ['', Validators.required],
          proofOfDelivery: ['', Validators.required],
          contactPersonName: ['', Validators.required],
          contactPersonEmail: ['', [Validators.required, Validators.email]],
          alternateEmailId: ['', Validators.email],
      });
  }

  onSubmit(): void {
      if (this.poForm.valid) {
          console.log('Form Submitted:', this.poForm.value);
      } else {
          console.log('Form is invalid');
      }
  }
}
