import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './dashboard/login/login.component';
import { RegistrationComponent } from './dashboard/registration/registration.component';
import { DashboardMainComponent } from './dashboard/dashboard-main/dashboard-main.component';
import { OrderacknowledgementComponent } from './dashboard/orderacknowledgement/orderacknowledgement.component';
import { MasterstagingComponent } from './dashboard/masterstaging/masterstaging.component';

import { AuthGuard } from './services/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registration', component: RegistrationComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: DashboardMainComponent, canActivate: [AuthGuard] },
  { path: 'orderAcknowledgement', component: OrderacknowledgementComponent, canActivate: [AuthGuard] },
  { path: 'master', component: MasterstagingComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' }, 
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
