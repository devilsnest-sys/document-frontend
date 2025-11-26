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
  generatedPassword: string = ''; // Store generated password internally
  

  constructor(
    private fb: FormBuilder,
    private toastservice: ToastserviceService,
    private registrationService: RegistrationService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.fetchStages();
    // Auto-generate username and password on initialization
    if (!this.isEditMode) {
      this.generateUserCredentials();
    }
  }

  initializeForm(): void {
    this.registrationForm = this.fb.group({
      username: [{ value: '', disabled: true }], // Always disabled, auto-generated
      email: ['', [Validators.required, Validators.email]],
      MobileNo: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      role: ['', Validators.required],
      designation: ['', Validators.required],
      companyId: ['', Validators.required],
      UserDesignationForstageId: [[], Validators.required],
      userType: 'user',
      salt: [''],
      HashedPassword: [''], // Hidden from UI, used internally
      confirmPassword: [''] // Hidden from UI, used internally
    });
  }

  /**
   * Generate random password
   */
  private generateRandomPassword(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Fetch user code from API
   */
  private fetchUserCodeFromAPI(): void {
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.toastservice.showToast('error', 'Authentication token not found');
      return;
    }

    const apiUrl = 'https://localhost:44347/api/v1/users/generate-next-user-code';
    
    this.http.get<string>(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      responseType: 'text' as 'json' // Handle plain text response
    }).subscribe({
      next: (userCode) => {
        this.registrationForm.patchValue({
          username: userCode
        });
      },
      error: (err) => {
        console.error('Error fetching user code:', err);
        this.toastservice.showToast('error', 'Failed to generate username');
        // Fallback to local generation if API fails
        const fallbackUsername = this.generateUserCode();
        this.registrationForm.patchValue({
          username: fallbackUsername
        });
      }
    });
  }

  /**
   * Fallback: Generate user code locally (if API fails)
   */
  private generateUserCode(): string {
    const timestamp = Date.now().toString().slice(-6); // take last 6 digits for compactness
    return `USER00${timestamp}`;
  }

  /**
   * Generate username and password for new user
   */
  generateUserCredentials(): void {
    // Fetch username from API
    this.fetchUserCodeFromAPI();
    
    // Generate password
    const password = this.generateRandomPassword();
    
    this.generatedPassword = password; // Store for internal use only
    
    this.registrationForm.patchValue({
      HashedPassword: password,
      confirmPassword: password
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
      this.initializeForm(); // Reinitialize form
      this.generatedPassword = ''; // Clear generated password
      this.enableEditModeFields();
    } else {
      this.registrationForm.reset(); // Reset form when exiting edit mode
      this.selectedUserId = null;
      this.initializeForm(); // Reinitialize form
      this.generateUserCredentials(); // Generate new credentials for create mode
    }
  }

  enableEditModeFields(): void {
    // In edit mode, only username dropdown should be enabled initially
    this.registrationForm.get('username')?.enable();
    this.registrationForm.get('email')?.disable();
    this.registrationForm.get('MobileNo')?.disable();
    this.registrationForm.get('role')?.disable();
    this.registrationForm.get('designation')?.disable();
    this.registrationForm.get('companyId')?.disable();
    this.registrationForm.get('UserDesignationForstageId')?.disable();
  }

  onUsernameSelected(username: string): void {
    if (!username) return;

    // Find the selected user
    const selectedUser = this.userList.find(user => user.username === username);
    
    if (selectedUser && selectedUser.id) {
      this.selectedUserId = selectedUser.id;
      
      // Get user details by ID and populate form
      this.registrationService.getUserById(selectedUser.id).subscribe({
        next: (userData) => {
          this.populateForm(userData);
          this.setFieldsDisabled(); // Disable non-editable fields
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
    let stageIds = userData.userDesignationForstageId;
    if (typeof stageIds === 'string') {
      stageIds = stageIds.split(', ').map((id: string) => parseInt(id.trim()));
    }

    this.registrationForm.patchValue({
      username: userData.username,
      email: userData.email,
      HashedPassword: '', // Don't populate password for security
      confirmPassword: '',
      MobileNo: userData.mobileNo, // Updated field name to match API
      role: userData.role,
      designation: userData.designation,
      companyId: userData.companyId,
      UserDesignationForstageId: stageIds || [],
      userType: userData.userType || 'user',
      salt: userData.salt || ''
    });
  }

  setFieldsDisabled(): void {
    // Disable all fields except email, phone, and stages
    this.registrationForm.get('username')?.disable();
    this.registrationForm.get('role')?.disable();
    this.registrationForm.get('designation')?.disable();
    this.registrationForm.get('companyId')?.disable();
    this.registrationForm.get('userType')?.disable();
    this.registrationForm.get('salt')?.disable();
    
    // Keep email, MobileNo, and stages enabled
    this.registrationForm.get('email')?.enable();
    this.registrationForm.get('MobileNo')?.enable();
    this.registrationForm.get('UserDesignationForstageId')?.enable();
  }

  toggleAllSelection(): void {
    const currentValue = this.registrationForm.get('UserDesignationForstageId')?.value || [];
    
    if (this.isAllSelected()) {
      // Deselect all
      this.registrationForm.get('UserDesignationForstageId')?.setValue([]);
    } else {
      // Select all stages
      const allStageIds = this.stages.map(stage => stage.id);
      this.registrationForm.get('UserDesignationForstageId')?.setValue(allStageIds);
    }
  }

  /**
   * Check if all stages are selected
   */
  isAllSelected(): boolean {
    const currentValue = this.registrationForm.get('UserDesignationForstageId')?.value || [];
    return currentValue.length === this.stages.length && this.stages.length > 0;
  }

  /**
   * Check if selection is indeterminate (some but not all selected)
   */
  isIndeterminate(): boolean {
    const currentValue = this.registrationForm.get('UserDesignationForstageId')?.value || [];
    return currentValue.length > 0 && currentValue.length < this.stages.length;
  }

  /**
   * Check if a specific stage is selected
   */
  isStageSelected(stageId: number): boolean {
    const currentValue = this.registrationForm.get('UserDesignationForstageId')?.value || [];
    return currentValue.includes(stageId);
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

  onSubmit(): void {
    if (this.registrationForm.valid || (this.isEditMode && this.isEditFormValid())) {
      const token = localStorage.getItem('authToken');
      if (!token) {
        this.toastservice.showToast('error', 'Login Failed', 'Invalid credentials. Please try again!');
        return;
      }

      const payload = { ...this.registrationForm.getRawValue() }; // Use getRawValue() to get disabled fields too

      // Convert array to comma-separated string for API
      if (Array.isArray(payload.UserDesignationForstageId)) {
        payload.userDesignationForstageId = payload.UserDesignationForstageId.join(', ');
      }

      // Update field names to match API
      payload.mobileNo = payload.MobileNo;
      payload.hashedPassword = payload.HashedPassword;

      // Remove form-specific fields
      delete payload.MobileNo;
      delete payload.HashedPassword;
      delete payload.confirmPassword;
      delete payload.UserDesignationForstageId;

      if (this.isEditMode && this.selectedUserId) {
        // Update existing user
        const editPayload = {
          id: this.selectedUserId,
          username: payload.username,
          hashedPassword: payload.hashedPassword || '', // Keep existing or empty
          role: payload.role,
          userType: payload.userType,
          email: payload.email,
          mobileNo: payload.mobileNo,
          designation: payload.designation,
          companyId: payload.companyId,
          createdAt: new Date().toISOString(),
          salt: payload.salt || '',
          userDesignationForstageId: payload.userDesignationForstageId
        };

        this.registrationService.updateUser(editPayload, token).subscribe({
          next: () => {
            this.toastservice.showToast('success', 'User updated successfully');
            this.clearFormAndReset();
          },
          error: (err) => {
            console.error(err);
            this.toastservice.showToast('error', 'Update Failed');
          },
        });
      } else {
        // Create new user - don't show credentials in toast
        this.registrationService.registerUser(payload, token).subscribe({
          next: () => {
            this.toastservice.showToast('success', 'User registered successfully');
            this.clearFormAndReset();
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

  /**
   * Clear form and reset to initial state
   */
  clearFormAndReset(): void {
    this.registrationForm.reset();
    this.selectedUserId = null;
    this.generatedPassword = '';
    this.isEditMode = false;
    this.initializeForm();
    this.generateUserCredentials(); // Generate new credentials for next registration
  }

  // Helper method to check if edit form is valid (only editable fields)
  isEditFormValid(): boolean {
    const emailControl = this.registrationForm.get('email');
    const mobileControl = this.registrationForm.get('MobileNo');
    const stagesControl = this.registrationForm.get('UserDesignationForstageId');
    
    return !!(emailControl?.valid && mobileControl?.valid && stagesControl?.valid && this.selectedUserId);
  }
}