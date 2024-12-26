import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-main',
  standalone: false,
  
  templateUrl: './dashboard-main.component.html',
  styleUrl: './dashboard-main.component.css'
})
export class DashboardMainComponent {
  steps = Array(5).fill(0);
  currentStep = 3;
}
