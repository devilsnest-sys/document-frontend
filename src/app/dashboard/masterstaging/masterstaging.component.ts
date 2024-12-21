import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-masterstaging',
  standalone: false,
  
  templateUrl: './masterstaging.component.html',
  styleUrl: './masterstaging.component.css'
})
export class MasterstagingComponent {
  stageForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.stageForm = this.fb.group({
      stageName: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  onSubmit(): void {
    if (this.stageForm.valid) {
      console.log('Form Submitted', this.stageForm.value);
    }
  }

  onCancel(): void {
    this.stageForm.reset();
  }
}
