import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { RegistrationComponent } from './features/registration/registration.component';
import { DashboardMainComponent } from './features/dashboard/dashboard-main/dashboard-main.component';
import { OrderacknowledgementComponent } from './features/dashboard/orderacknowledgement/orderacknowledgement.component';
import { MasterstagingComponent } from './features/dashboard/masterstaging/masterstaging.component';
import { MasterdocumentComponent } from './features/dashboard/masterdocument/masterdocument.component';
import { MasteraddfieldComponent } from './dashboard/masteraddfield/masteraddfield.component';
import { AdditionalfieldComponent } from './features/dashboard/additionalfield/additionalfield.component';
import { AdditionalfieldselectionComponent } from './features/dashboard/additionalfieldselection/additionalfieldselection.component';
import { DocumentselectionComponent } from './features/dashboard/documentselection/documentselection.component';
import { VendorRegistrationComponent } from './features/vendor-registration/vendor-registration.component';
import { StageStep1Component } from './stage-steps/stage-step1/stage-step1.component';
import { StageStep2Component } from './stage-steps/stage-step2/stage-step2.component';
import { StageStep3Component } from './stage-steps/stage-step3/stage-step3.component';
import { StageStep4Component } from './stage-steps/stage-step4/stage-step4.component';
import { StageStep5Component } from './stage-steps/stage-step5/stage-step5.component';
import { DocumentUploadComponent } from './shared/components/document-upload/document-upload.component';
import { CreateincotermsComponent } from './features/dashboard/createincoterms/createincoterms.component';
import { CreatePoTypeComponent } from './features/dashboard/create-po-type/create-po-type.component';
import { TermsandconditionComponent } from './shared/components/termsandcondition/termsandcondition.component';
import { PasswordResetComponent } from './features/password-reset/password-reset.component';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registration', component: RegistrationComponent },
  { path: 'dashboard', component: DashboardMainComponent, canActivate: [AuthGuard] },
  { path: 'orderAcknowledgement', component: OrderacknowledgementComponent, canActivate: [AuthGuard] },
  { path: 'master', component: MasterstagingComponent, canActivate: [AuthGuard] },
  { path: 'masterDocument', component: MasterdocumentComponent, canActivate: [AuthGuard] },
  { path: 'masterAddField', component: MasteraddfieldComponent, canActivate: [AuthGuard] },
  { path: 'additionalField', component: AdditionalfieldComponent, canActivate: [AuthGuard] },
  { path: 'additionalFieldSelection', component: AdditionalfieldselectionComponent, canActivate: [AuthGuard] },
  { path: 'documentSelection', component: DocumentselectionComponent, canActivate: [AuthGuard] },
  { path: 'vendorRegistration', component: VendorRegistrationComponent},
  { path: 'stages/1/:poNumber', component: StageStep1Component },
  { path: 'stages/2/:poNumber', component: StageStep2Component },
  { path: 'stages/3/:poNumber', component: StageStep3Component },
  { path: 'stages/4/:poNumber', component: StageStep4Component },
  { path: 'stages/5/:poNumber', component: StageStep5Component },
  // { path: 'DocumentUploadComponent', component: DocumentUploadComponent },
  { path: 'incoterms', component: CreateincotermsComponent },
  { path: 'potype', component: CreatePoTypeComponent },
  { path: 'tnc', component: TermsandconditionComponent },
  { path: 'resetpassword', component: PasswordResetComponent },
  // { path: 'master', component: MasterstagingComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' }, 
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
