import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-masterdocument',
  standalone: false,
  
  templateUrl: './masterdocument.component.html',
  styleUrl: './masterdocument.component.css'
})
export class MasterdocumentComponent {
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
