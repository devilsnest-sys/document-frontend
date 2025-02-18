import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Directive({
  selector: '[appUserRole]',
  standalone: false
})
export class UserRoleDirective {
  private currentUserType: string | null = null;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {
    // Subscribe to userType changes
    this.authService.getUserTypeState().subscribe((userType) => {
      this.currentUserType = userType;
      // console.log('Updated userType in directive:', userType);
      this.updateView();
    });
  }

  private roles: string[] = [];

  @Input() set appUserRole(allowedRoles: string[] | string) {
    this.roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    this.updateView();
  }

  private updateView() {
    // console.log('UserRoleDirective: Checking userType:', this.currentUserType);
    // console.log('Allowed roles:', this.roles);
  
    if (this.roles.includes(this.currentUserType || '')) {
      // console.log('UserRoleDirective: Showing element');
      this.viewContainer.createEmbeddedView(this.templateRef); // Show element
    } else {
      // console.log('UserRoleDirective: Hiding element');
      this.viewContainer.clear(); // Hide element
    }
  }
  
}
