import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environment/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';

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
    private router: Router,
    private route: ActivatedRoute
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
    this.submitForm.markAllAsTouched();
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Please accept the terms and conditions to continue!',
    });
    return;
  }

  this.isSubmitting = true;

  const token = localStorage.getItem('authToken');

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  const poId = this.route.snapshot.paramMap.get('poNumber');
  const stageId = this.stageNumber;
  const tncAccepted = this.submitForm.get('termsAccepted')?.value;

  if (!poId || isNaN(+poId) || !stageId || isNaN(stageId)) {
    this.isSubmitting = false;
    Swal.fire({
      icon: 'error',
      title: 'Invalid Input',
      text: 'Invalid PO Number or Stage Number.',
    });
    return;
  }

  // API Call to validate submission
  this.http.get(`${environment.apiUrl}/v1/StageStatus/validate-submission/${+poId}/${stageId}?TncSelected=${tncAccepted}`, { headers })
    .subscribe({
      next: (response: any) => {
        if (response?.canSubmit) {
          this.isSubmitting = false;
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: response.Message || 'Stage submitted successfully.',
            confirmButtonText: 'Go to Dashboard'
          }).then(() => {
            this.router.navigate(['/dashboard']);
          });
        } else {
          this.isSubmitting = false;
          Swal.fire({
            icon: 'error',
            title: 'Submission Failed',
            text: response.Message || 'Stage cannot be submitted.',
          });
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Error validating the submission. Please try again.',
        });
        console.error('Validation error:', error);
      }
    });
}

  // onSubmit(): void {
  //   if (this.submitForm.invalid) {
  //     // Highlight the form errors
  //     this.submitForm.markAllAsTouched();
  //     this.snackBar.open('Please accept the terms and conditions to continue', 'Close', {
  //       duration: 3000,
  //       panelClass: 'error-snackbar'
  //     });
  //     return;
  //   }
  
  //   this.isSubmitting = true;
  
  //   // Get the auth token from localStorage
  //   const token = localStorage.getItem('authToken');
    
  //   // Prepare the headers
  //   const headers = new HttpHeaders({
  //     'Authorization': `Bearer ${token}`,
  //     'Content-Type': 'application/json',
  //     'Accept': 'application/json'
  //   });
  
  //   // Extract the required parameters
  //   const poId = this.route.snapshot.paramMap.get('poNumber');
  //   const stageId = this.stageNumber;
  //   const tncAccepted = this.submitForm.get('termsAccepted')?.value;
  
  //   if (!poId || isNaN(+poId) || !stageId || isNaN(stageId)) {
  //     this.isSubmitting = false;
  //     this.snackBar.open('Invalid PO Number or Stage Number.', 'Close', {
  //       duration: 3000,
  //       panelClass: 'error-snackbar'
  //     });
  //     return;
  //   }
  
  //   // API Call to validate submission
  //   this.http.get(`${environment.apiUrl}/v1/StageStatus/validate-submission/${+poId}/${stageId}?TncSelected=${tncAccepted}`, { headers })
  //     .subscribe({
  //       next: (response: any) => {
  //         if (response?.canSubmit) {
  //           this.isSubmitting = false;
  //           this.snackBar.open(response.Message || 'Stage Submitted Suceesfully.', 'Close', {
  //             duration: 3000,
  //             panelClass: 'success-snackbar'
  //           });
  
  //           // Optionally navigate to another page or refresh
  //           // this.router.navigate(['/next-stage']);
  //         } else {
  //           this.isSubmitting = false;
  //           this.snackBar.open(response.Message || 'Stage cannot be submitted.', 'Close', {
  //             duration: 5000,
  //             panelClass: 'error-snackbar'
  //           });
  //         }
  //       },
  //       error: (error) => {
  //         this.isSubmitting = false;
  //         this.snackBar.open('Error validating the submission. Please try again.', 'Close', {
  //           duration: 5000,
  //           panelClass: 'error-snackbar'
  //         });
  //         console.error('Validation error:', error);
  //       }
  //     });
  // }
  
  // onSubmit(): void {
  //   if (this.submitForm.invalid) {
  //     // Highlight the form errors
  //     this.submitForm.markAllAsTouched();
  //     this.snackBar.open('Please accept the terms and conditions to continue', 'Close', {
  //       duration: 3000,
  //       panelClass: 'error-snackbar'
  //     });
  //     return;
  //   }

  //   this.isSubmitting = true;
    
  //   // Get the auth token from localStorage
  //   const token = localStorage.getItem('authToken');
    
  //   // Prepare the headers
  //   const headers = new HttpHeaders({
  //     'Authorization': `Bearer ${token}`,
  //     'Content-Type': 'application/json',
  //     'Accept': 'text/plain'
  //   });
    
  //   // Prepare the request body
  //   const requestBody = {
  //     id: 0,
  //     poId: this.route.snapshot.paramMap.get('poNumber'), // You might want to make this dynamic based on your application state
  //     stageId: this.stageNumber, // You might want to make this dynamic based on your application state
  //     tncAccepted: this.submitForm.get('termsAccepted')?.value,
  //     status: "Complete",
  //     updatedAt: new Date().toISOString()
  //   };
    
  //   // Make the API call
  //   this.http.post(`${environment.apiUrl}/v1/StageStatus/`, requestBody, { headers })
  //     .subscribe({
  //       next: (response) => {
  //         this.isSubmitting = false;
  //         this.snackBar.open('Successfully submitted!', 'Close', {
  //           duration: 3000,
  //           panelClass: 'success-snackbar'
  //         });
          
  //         // Reset the form after successful submission
  //         this.submitForm.reset();
          
  //         // Optionally navigate to another page
  //         // this.router.navigate(['/next-stage']);
  //       },
  //       error: (error) => {
  //         this.isSubmitting = false;
  //         this.snackBar.open('Error submitting the form. Please try again.', 'Close', {
  //           duration: 5000,
  //           panelClass: 'error-snackbar'
  //         });
  //         console.error('Submission error:', error);
  //       }
  //     });
  // }

  get termsControl() {
    return this.submitForm.get('termsAccepted');
  }
}