import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { VendorService } from './vendor-registration.service';
import { ToastserviceService } from '../../core/services/toastservice.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-vendor-registration',
  standalone: false,
  templateUrl: './vendor-registration.component.html',
  styleUrl: './vendor-registration.component.css'
})
export class VendorRegistrationComponent implements OnInit {
  registrationForm!: FormGroup;
  isSubmitting = false;
  selectedFile: File | null = null;
  vendorList: Array<{ username: string; id?: number; [key: string]: any }> = [];
  isEditMode: boolean = false;
  selectedVendorId: number | null = null;

  constructor(
    private fb: FormBuilder, 
    private vendorService: VendorService, 
    private toastservice: ToastserviceService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.registrationForm = this.fb.group({
      vendorCode: ['', Validators.required],
      companyName: ['', Validators.required],
      mailingAddress: ['', Validators.required],
      telephone: ['', Validators.required],
      fax: [''],
      email: ['', [Validators.required, Validators.email]],
      website: [''],
      contactNameTitle: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone1: ['', Validators.required],
      contactPhone2: [''],
      generalDetails: [''],
      username: ['', Validators.required],
      HashedPassword: ['', [Validators.required, Validators.minLength(6)]],
      userType: "vendor",
      salt: ['']
    });
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    
    if (this.isEditMode) {
      this.fetchVendors(); // Load vendors when entering edit mode
      this.registrationForm.reset(); // Clear form
      this.initializeForm(); // Reinitialize form
    } else {
      this.registrationForm.reset(); // Reset form when exiting edit mode
      this.selectedVendorId = null;
      this.initializeForm(); // Reinitialize form
    }
  }

  fetchVendors(): void {
    this.vendorService.getAllVendors().subscribe({
      next: (data) => {
        this.vendorList = data;
      },
      error: (err) => {
        console.error(err);
        this.toastservice.showToast('error', 'Failed to load vendors');
      },
    });
  }

  onUsernameSelected(username: string): void {
    if (!username) return;

    // Find the selected vendor
    const selectedVendor = this.vendorList.find(vendor => vendor.username === username);
    
    if (selectedVendor && selectedVendor.id) {
      this.selectedVendorId = selectedVendor.id;
      
      // Get vendor details by ID and populate form
      this.vendorService.getVendorById(selectedVendor.id).subscribe({
        next: (vendorData) => {
          this.populateForm(vendorData);
          this.setFieldsDisabled(); // Disable non-editable fields
        },
        error: (err) => {
          console.error(err);
          this.toastservice.showToast('error', 'Failed to load vendor details');
        }
      });
    }
  }

  populateForm(vendorData: any): void {
    this.registrationForm.patchValue({
      vendorCode: vendorData.vendorCode,
      companyName: vendorData.companyName,
      mailingAddress: vendorData.mailingAddress,
      telephone: vendorData.telephone,
      fax: vendorData.fax || '',
      email: vendorData.email,
      website: vendorData.website || '',
      contactNameTitle: vendorData.contactNameTitle,
      contactEmail: vendorData.contactEmail,
      contactPhone1: vendorData.contactPhone1,
      contactPhone2: vendorData.contactPhone2 || '',
      generalDetails: vendorData.generalDetails || '',
      username: vendorData.username,
      HashedPassword: '', // Don't populate password for security
      userType: vendorData.userType || 'vendor',
      salt: vendorData.salt || ''
    });
  }

  setFieldsDisabled(): void {
    // Disable most fields in edit mode, keep only editable ones enabled
    this.registrationForm.get('vendorCode')?.disable();
    this.registrationForm.get('companyName')?.disable();
    this.registrationForm.get('mailingAddress')?.disable();
    this.registrationForm.get('contactNameTitle')?.disable();
    this.registrationForm.get('contactEmail')?.disable();
    this.registrationForm.get('contactPhone1')?.disable();
    this.registrationForm.get('contactPhone2')?.disable();
    this.registrationForm.get('generalDetails')?.disable();
    this.registrationForm.get('username')?.disable();
    this.registrationForm.get('HashedPassword')?.disable();
    this.registrationForm.get('userType')?.disable();
    this.registrationForm.get('salt')?.disable();
    
    // Keep these fields enabled for editing
    this.registrationForm.get('telephone')?.enable();
    this.registrationForm.get('fax')?.enable();
    this.registrationForm.get('email')?.enable();
    this.registrationForm.get('website')?.enable();
  }

  onSubmit(): void {
    if (this.registrationForm.valid || (this.isEditMode && this.isEditFormValid())) {
      this.isSubmitting = true;
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        this.toastservice.showToast('error', 'Authentication Failed', 'Please login again!');
        this.isSubmitting = false;
        return;
      }

      const payload = { ...this.registrationForm.getRawValue() }; // Use getRawValue() to get disabled fields too

      if (this.isEditMode && this.selectedVendorId) {
        // Update existing vendor
        payload.id = this.selectedVendorId;
        
        this.vendorService.updateVendor(payload, token).subscribe({
          next: (response) => {
            console.log('Vendor updated successfully:', response);
            this.isSubmitting = false;
            this.toastservice.showToast('success', 'Vendor Updated Successfully');
            this.registrationForm.reset();
            this.initializeForm();
            this.isEditMode = false;
            this.selectedVendorId = null;
          },
          error: (error) => {
            console.error('Error updating vendor:', error);
            this.isSubmitting = false;
            this.toastservice.showToast('error', 'Update Failed');
          }
        });
      } else {
        // Create new vendor
        this.vendorService.registerVendor(payload).subscribe(
          (response) => {
            console.log('Vendor registered successfully:', response);
            this.isSubmitting = false;
            this.toastservice.showToast('success', 'Registration Successful');
            this.registrationForm.reset();
            this.initializeForm();
          },
          (error) => {
            console.error('Error registering vendor:', error);
            this.isSubmitting = false;
            this.toastservice.showToast('error', 'Registration Failed');
          }
        );
      }
    } else {
      console.log('Form is invalid');
      this.toastservice.showToast('error', 'Form Invalid', 'Please fill all required fields correctly!');
    }
  }

  // Helper method to check if edit form is valid (only editable fields)
  isEditFormValid(): boolean {
    const telephoneControl = this.registrationForm.get('telephone');
    const emailControl = this.registrationForm.get('email');
    
    return !!(telephoneControl?.valid && emailControl?.valid && this.selectedVendorId);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }
  
  checkEmailExists(email: string, type: string = 'vendor'): void {
    if (!email || this.isEditMode) return;
   
    this.vendorService.checkEmailExists(email, type).subscribe(
      response => {
        if (response.exists) {
          this.registrationForm.controls['email'].setErrors({ emailTaken: true });
        }
      },
      error => {
        console.error('Error checking email:', error);
      }
    );
  }

  get emailControl() {
    return this.registrationForm.get('email');
  }

  checkUsernameExists(username: string, type: string = 'vendor'): void {
    if (!username || this.isEditMode) return;
  
    this.vendorService.checkUsernameExists(username, type).subscribe(
      response => {
        if (response.exists) {
          this.registrationForm.controls['username'].setErrors({ usernameTaken: true });
        }
      },
      error => {
        console.error('Error checking username:', error);
      }
    );
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      this.toastservice.showToast('error', 'Upload Failed', 'Please select a file first.');
      return;
    }
  
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to upload this file? This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Upload',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.vendorService.bulkRegisterVendors(this.selectedFile as File).subscribe(
          (response) => {
            console.log('Bulk upload successful:', response);
            this.toastservice.showToast('success', 'Bulk Upload Successful');
          },
          (error) => {
            console.error('Error in bulk upload:', error);
            this.toastservice.showToast('error', 'Bulk Upload Failed');
          }
        );
      }
    });
  }
}