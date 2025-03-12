import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environment/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-stage-submit',
  standalone: false,
  templateUrl: './stage-submit.component.html',
  styleUrl: './stage-submit.component.css'
})
export class StageSubmitComponent {
  @Input() stageNumber!: number;
  submitForm!: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.submitForm = this.fb.group({
      termsAccepted: [false, Validators.requiredTrue]
    });
  }

  onSubmit(): void {
    if (this.submitForm.invalid) {
      // Highlight the form errors
      this.submitForm.markAllAsTouched();
      this.snackBar.open('Please accept the terms and conditions to continue', 'Close', {
        duration: 3000,
        panelClass: 'error-snackbar'
      });
      return;
    }

    this.isSubmitting = true;
    
    // Get the auth token from localStorage
    const token = localStorage.getItem('authToken');
    
    // Prepare the headers
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'text/plain'
    });
    
    // Prepare the request body
    const requestBody = {
      id: 0,
      poId: 1, // You might want to make this dynamic based on your application state
      stageId: 4, // You might want to make this dynamic based on your application state
      tncAccepted: this.submitForm.get('termsAccepted')?.value,
      status: "Complete",
      updatedAt: new Date().toISOString()
    };
    
    // Make the API call
    this.http.post(`${environment.apiUrl}/v1/StageStatus`, requestBody, { headers })
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.snackBar.open('Successfully submitted!', 'Close', {
            duration: 3000,
            panelClass: 'success-snackbar'
          });
          
          // Reset the form after successful submission
          this.submitForm.reset();
          
          // Optionally navigate to another page
          // this.router.navigate(['/next-stage']);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.snackBar.open('Error submitting the form. Please try again.', 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
          console.error('Submission error:', error);
        }
      });
  }

  get termsControl() {
    return this.submitForm.get('termsAccepted');
  }
}