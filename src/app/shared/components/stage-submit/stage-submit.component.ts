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

  get termsControl() {
    return this.submitForm.get('termsAccepted');
  }
}