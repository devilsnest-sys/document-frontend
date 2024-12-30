import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';

import { FormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';

import { AgGridModule } from '@ag-grid-community/angular';
import { HeaderComponent } from './header/header.component';
import { SidenavbarComponent } from './sidenavbar/sidenavbar.component';
import { LoginComponent } from './dashboard/login/login.component';
import { RegistrationComponent } from './dashboard/registration/registration.component';
import { DashboardMainComponent } from './dashboard/dashboard-main/dashboard-main.component';

import { HttpClientModule,HTTP_INTERCEPTORS  } from '@angular/common/http';
import { LoaderInterceptor } from './services/loader.interceptor';
import { FooterComponent } from './footer/footer.component';
import { OrderacknowledgementComponent } from './dashboard/orderacknowledgement/orderacknowledgement.component';
import { MasterstagingComponent } from './dashboard/masterstaging/masterstaging.component';
import { MasterdocumentComponent } from './dashboard/masterdocument/masterdocument.component';
import { MasteraddfieldComponent } from './dashboard/masteraddfield/masteraddfield.component';
import { AdditionalfieldComponent } from './dashboard/additionalfield/additionalfield.component';
import { AdditionalfieldselectionComponent } from './dashboard/additionalfieldselection/additionalfieldselection.component';
import { DocumentselectionComponent } from './dashboard/documentselection/documentselection.component';
import { VendorRegistrationComponent } from './dashboard/vendor-registration/vendor-registration.component';
import { VendorPoCardComponent } from './dashboard/vendor-po-card/vendor-po-card.component';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SidenavbarComponent,
    LoginComponent,
    RegistrationComponent,
    DashboardMainComponent,
    FooterComponent,
    OrderacknowledgementComponent,
    MasterstagingComponent,
    MasterdocumentComponent,
    MasteraddfieldComponent,
    AdditionalfieldComponent,
    AdditionalfieldselectionComponent,
    DocumentselectionComponent,
    VendorRegistrationComponent,
    VendorPoCardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatIconModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    AgGridModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatSidenavModule,
    MatListModule,
    MatExpansionModule,
    MatMenuModule
  ],
  providers: [
    provideAnimationsAsync(),
    { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
