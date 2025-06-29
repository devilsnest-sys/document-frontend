import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { RegistrationService } from './registration.service';
import { ToastserviceService } from '../../core/services/toastservice.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-registration',
  standalone: false,
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
})
export class RegistrationComponent implements OnInit {
  registrationForm!: FormGroup;
  stages: Array<{ id: number; stageName: string }> = [];
  userList: Array<{ username: string; id?: number; [key: string]: any }> = [];
  isEditMode: boolean = false;
  selectedUserId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private toastservice: ToastserviceService,
    private registrationService: RegistrationService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.fetchStages();
  }

  initializeForm(): void {
    this.registrationForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      HashedPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, this.matchPasswords.bind(this)]],
      MobileNo: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      role: ['', Validators.required],
      designation: ['', Validators.required],
      companyId: ['', Validators.required],
      UserDesignationForstageId: [[], Validators.required],
      userType: 'user',
      salt: ['']
    });
  }

  fetchStages(): void {
    this.registrationService.getStages().subscribe({
      next: (data) => {
        this.stages = data.map((stage) => ({
          id: stage.id,
          stageName: stage.stageName,
        }));
      },
      error: (err) => {
        console.error(err);
        this.toastservice.showToast('error', 'Failed to load stages');
      },
    });
  }

  fetchUsers(): void {
    // Add this method to your RegistrationService to get all users
    this.registrationService.getAllUsers().subscribe({
      next: (data) => {
        this.userList = data;
      },
      error: (err) => {
        console.error(err);
        this.toastservice.showToast('error', 'Failed to load users');
      },
    });
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    
    if (this.isEditMode) {
      this.fetchUsers(); // Load users when entering edit mode
      this.registrationForm.reset(); // Clear form
    } else {
      this.registrationForm.reset(); // Reset form when exiting edit mode
      this.selectedUserId = null;
    }
  }

  onUsernameSelected(username: string): void {
    if (!username) return;

    // Find the selected user
    const selectedUser = this.userList.find(user => user.username === username);
    
    if (selectedUser) {
      this.selectedUserId = selectedUser.id || null;
      
      // Get user details and populate form
      this.registrationService.getUserByUsername(username).subscribe({
        next: (userData) => {
          this.populateForm(userData);
        },
        error: (err) => {
          console.error(err);
          this.toastservice.showToast('error', 'Failed to load user details');
        }
      });
    }
  }

  populateForm(userData: any): void {
    // Convert comma-separated stages back to array if needed
    let stageIds = userData.UserDesignationForstageId;
    if (typeof stageIds === 'string') {
      stageIds = stageIds.split(', ').map((id: string) => parseInt(id.trim()));
    }

    this.registrationForm.patchValue({
      username: userData.username,
      email: userData.email,
      HashedPassword: '', // Don't populate password for security
      confirmPassword: '',
      MobileNo: userData.MobileNo,
      role: userData.role,
      designation: userData.designation,
      companyId: userData.companyId,
      UserDesignationForstageId: stageIds || [],
      userType: userData.userType || 'user',
      salt: userData.salt || ''
    });
  }

  checkEmailExists(email: string, type: string = 'user'): void {
    if (!email || this.isEditMode) return;
  
    this.registrationService.checkEmailExists(email, type).subscribe(
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

  checkUsernameExists(username: string, type: string = 'user'): void {
    if (!username || this.isEditMode) return;
  
    this.registrationService.checkUsernameExists(username, type).subscribe(
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

  matchPasswords(control: AbstractControl): { [key: string]: boolean } | null {
    if (this.registrationForm && control.value !== this.registrationForm.get('HashedPassword')?.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registrationForm.valid) {
      const token = localStorage.getItem('authToken');
      if (!token) {
        this.toastservice.showToast('error', 'Login Failed', 'Invalid credentials. Please try again!');
        return;
      }

      const payload = { ...this.registrationForm.value };

      if (Array.isArray(payload.UserDesignationForstageId)) {
        payload.UserDesignationForstageId = payload.UserDesignationForstageId.join(', ');
      }

      if (this.isEditMode && this.selectedUserId) {
        // Update existing user
        payload.id = this.selectedUserId;
        this.registrationService.updateUser(payload, token).subscribe({
          next: () => {
            this.toastservice.showToast('success', 'User Updated Successfully');
            this.registrationForm.reset();
            this.isEditMode = false;
            this.selectedUserId = null;
          },
          error: (err) => {
            console.error(err);
            this.toastservice.showToast('error', 'Update Failed');
          },
        });
      } else {
        // Create new user
        this.registrationService.registerUser(payload, token).subscribe({
          next: () => {
            this.toastservice.showToast('success', 'Registration Successful');
            this.registrationForm.reset();
          },
          error: (err) => {
            console.error(err);
            this.toastservice.showToast('error', 'Registration Failed');
          },
        });
      }
    } else {
      this.toastservice.showToast('error', 'Form Invalid', 'Please fill all required fields correctly!');
    }
  }
}