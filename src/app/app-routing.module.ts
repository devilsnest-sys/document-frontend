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
import { StageStep6Component } from './stage-steps/stage-step6/stage-step6.component';
import { StageStep7Component } from './stage-steps/stage-step7/stage-step7.component';
import { StageStep8Component } from './stage-steps/stage-step8/stage-step8.component';
import { StageStep9Component } from './stage-steps/stage-step9/stage-step9.component';
import { StageStep10Component } from './stage-steps/stage-step10/stage-step10.component';
import { StageStep11Component } from './stage-steps/stage-step11/stage-step11.component';
import { StageStep12Component } from './stage-steps/stage-step12/stage-step12.component';
import { StageStep13Component } from './stage-steps/stage-step13/stage-step13.component';
import { StageStep14Component } from './stage-steps/stage-step14/stage-step14.component';
import { StageStep15Component } from './stage-steps/stage-step15/stage-step15.component';
import { DocumentUploadComponent } from './shared/components/document-upload/document-upload.component';
import { CreateincotermsComponent } from './features/dashboard/createincoterms/createincoterms.component';
import { CreatePoTypeComponent } from './features/dashboard/create-po-type/create-po-type.component';
import { TermsandconditionComponent } from './shared/components/termsandcondition/termsandcondition.component';
import { PasswordResetComponent } from './features/password-reset/password-reset.component';
import { AuthGuard } from './core/guards/auth.guard';
import { ReportsComponent } from './features/reports/reports.component';

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
  { path: 'reports', component: ReportsComponent},
  { path: 'stages/1/:poNumber', component: StageStep1Component },
  { path: 'stages/2/:poNumber', component: StageStep2Component },
  { path: 'stages/3/:poNumber', component: StageStep3Component },
  { path: 'stages/4/:poNumber', component: StageStep4Component },
  { path: 'stages/5/:poNumber', component: StageStep5Component },
  { path: 'stages/6/:poNumber', component: StageStep6Component },
  { path: 'stages/7/:poNumber', component: StageStep7Component },
  { path: 'stages/8/:poNumber', component: StageStep8Component },
  { path: 'stages/9/:poNumber', component: StageStep9Component },
  { path: 'stages/10/:poNumber', component: StageStep10Component },
  { path: 'stages/11/:poNumber', component: StageStep11Component },
  { path: 'stages/12/:poNumber', component: StageStep12Component },
  { path: 'stages/13/:poNumber', component: StageStep13Component },
  { path: 'stages/14/:poNumber', component: StageStep14Component },
  { path: 'stages/15/:poNumber', component: StageStep15Component },
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
