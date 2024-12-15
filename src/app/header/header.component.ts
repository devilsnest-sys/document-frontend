import { Component, OnInit, ElementRef } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: false,
  
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
toggleSidebar() {
  alert('test');
}
getTitle() {

}
sidebarToggle() {
  alert('test');
}

}
