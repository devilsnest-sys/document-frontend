import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './dashboard/login/login.component';
import { RegistrationComponent } from './dashboard/registration/registration.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registration', component: RegistrationComponent },
  // { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirect to login as the default route
  // { path: '**', redirectTo: '/login' } // Redirect unknown routes to login
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
