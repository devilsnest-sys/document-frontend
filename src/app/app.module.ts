import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';

import { HeaderComponent } from './header/header.component';
import { SidenavbarComponent } from './sidenavbar/sidenavbar.component';
import { LoginComponent } from './dashboard/login/login.component';
import { RegistrationComponent } from './dashboard/registration/registration.component';
import { DashboardMainComponent } from './dashboard/dashboard-main/dashboard-main.component';

import { HttpClientModule,HTTP_INTERCEPTORS  } from '@angular/common/http';
import { LoaderInterceptor } from './services/loader.interceptor';
import { FooterComponent } from './footer/footer.component';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SidenavbarComponent,
    LoginComponent,
    RegistrationComponent,
    DashboardMainComponent,
    FooterComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatIconModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [
    provideAnimationsAsync(),
    { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
