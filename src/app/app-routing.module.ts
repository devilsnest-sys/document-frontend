import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { RegistrationComponent } from './features/registration/registration.component';
import { DashboardMainComponent } from './features/dashboard/dashboard-main/dashboard-main.component';
import { OrderacknowledgementComponent } from './dashboard/orderacknowledgement/orderacknowledgement.component';
import { MasterstagingComponent } from './dashboard/masterstaging/masterstaging.component';
import { MasterdocumentComponent } from './features/dashboard/masterdocument/masterdocument.component';
import { MasteraddfieldComponent } from './dashboard/masteraddfield/masteraddfield.component';
import { AdditionalfieldComponent } from './features/dashboard/additionalfield/additionalfield.component';
import { AdditionalfieldselectionComponent } from './features/dashboard/additionalfieldselection/additionalfieldselection.component';
import { DocumentselectionComponent } from './features/dashboard/documentselection/documentselection.component';
import { VendorRegistrationComponent } from './features/vendor-registration/vendor-registration.component';
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
  // { path: 'master', component: MasterstagingComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' }, 
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
