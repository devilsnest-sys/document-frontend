import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-error-not-found',
  templateUrl: './error-not-found.component.html',
  styleUrls: ['./error-not-found.component.css'],
  standalone: false
})
export class ErrorNotFoundComponent implements OnInit {
  errorMessage: string = 'Page Not Found';
  errorCode: string = '404';
    stars: Array<any> = [];

  constructor(
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    // Check if there's error state passed from navigation
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.errorMessage = navigation.extras.state['message'] || this.errorMessage;
      this.errorCode = navigation.extras.state['code'] || this.errorCode;
    }
        this.stars = this.generateStars(30);
    setInterval(() => {
      this.stars = [...this.stars.slice(-20), ...this.generateStars(10)];
    }, 4000);
  }
  generateStars(count: number): Array<any> {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 2 + 1, // 1-3px
      top: `${Math.random() * 50}%`,
      left: `${Math.random() * 100}%`,
      duration: Math.random() * 3 + 4,
      delay: Math.random() * 4,
      direction: Math.random() > 0.5 ? 'topLeft' : 'topRight',
    }));
  }
  goBack(): void {
    this.location.back();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}