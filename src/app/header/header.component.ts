import { Component, OnInit, ElementRef } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: false,
  
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  logoUrl!: string;
  headerTitle!: string;

  constructor() {}


  ngOnInit(): void {
    this.logoUrl = 'assets/images/envato-logo-small.svg';
    this.headerTitle = 'Document Dashboard';
  }

}
