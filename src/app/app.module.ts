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
import { MatAutocompleteModule } from '@angular/material/autocomplete';


import { AgGridModule } from '@ag-grid-community/angular';
import { HeaderComponent } from './shared/header/header.component';
import { SidenavbarComponent } from './shared/sidenavbar/sidenavbar.component';
import { LoginComponent } from './features/login/login.component';
import { RegistrationComponent } from './features/registration/registration.component';
import { DashboardMainComponent } from './features/dashboard/dashboard-main/dashboard-main.component';

import { HttpClientModule,HTTP_INTERCEPTORS  } from '@angular/common/http';
import { LoaderInterceptor } from './core/services/loader.interceptor';
import { FooterComponent } from './shared/footer/footer.component';
import { OrderacknowledgementComponent } from './features/dashboard/orderacknowledgement/orderacknowledgement.component';
import { MasterstagingComponent } from './features/dashboard/masterstaging/masterstaging.component';
import { MasterdocumentComponent } from './features/dashboard/masterdocument/masterdocument.component';
import { MasteraddfieldComponent } from './dashboard/masteraddfield/masteraddfield.component';
import { AdditionalfieldComponent } from './features/dashboard/additionalfield/additionalfield.component';
import { AdditionalfieldselectionComponent } from './features/dashboard/additionalfieldselection/additionalfieldselection.component';
import { DocumentselectionComponent } from './features/dashboard/documentselection/documentselection.component';
import { VendorRegistrationComponent } from './features/vendor-registration/vendor-registration.component';
import { VendorPoCardComponent } from './shared/components/vendor-po-card/vendor-po-card.component';
import { StageStep1Component } from './stage-steps/stage-step1/stage-step1.component';
import { StageStep2Component } from './stage-steps/stage-step2/stage-step2.component';
import { DocumentUploadComponent } from './shared/components/document-upload/document-upload.component';
import { CreateincotermsComponent } from './features/dashboard/createincoterms/createincoterms.component';
import { CreatePoTypeComponent } from './features/dashboard/create-po-type/create-po-type.component';
import { PasswordResetComponent } from './features/password-reset/password-reset.component';
import { UserRoleDirective } from './shared/directives/user-role.directive';
import { StageStep3Component } from './stage-steps/stage-step3/stage-step3.component';
import { StageStep4Component } from './stage-steps/stage-step4/stage-step4.component';
import { StageStep5Component } from './stage-steps/stage-step5/stage-step5.component';
import { AdditionalFieldFlowComponent } from './shared/components/additional-field-flow/additional-field-flow.component';


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
    StageStep1Component,
    StageStep2Component,
    DocumentUploadComponent,
    CreateincotermsComponent,
    CreatePoTypeComponent,
    PasswordResetComponent,
    UserRoleDirective,
    StageStep3Component,
    StageStep4Component,
    StageStep5Component,
    AdditionalFieldFlowComponent,
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
    MatMenuModule,
    MatAutocompleteModule
  ],
  providers: [
    provideAnimationsAsync(),
    { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
