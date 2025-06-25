import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

interface UserRoleStageConfig {
  roles: string[] | string;
  stage: number;
}

@Directive({
  selector: '[appHideForVendorStages]',
  standalone: false
})
export class UserRoleStageDirective {
  private vendorHiddenStages = [9, 10, 11, 12, 13, 14, 15];

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}

  @Input() set appHideForVendorStages(stage: number) {
    const userType = localStorage.getItem('userType');
    
    const shouldHide =
      userType === 'vendor' && this.vendorHiddenStages.includes(stage);

    this.viewContainer.clear(); // Always clear first
console.log('Directive Check:', { stage, userType });

    if (!shouldHide) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      console.log('Directive Check:', { stage, userType });

      // Show only if NOT hidden
    }
  }
}
