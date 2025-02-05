import { CUSTOM_ELEMENTS_SCHEMA, NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { PosteService } from './services/poste.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { CommentComponent } from './shared/comment/comment.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { authInterceptorProviders } from './services/security/auth-interceptor.service';
import { TokenStorageService } from './services/token-storage.service';
import { AuthService } from './services/auth.service';
import { ChatComponent } from './chat/chat.component';
import { ChatService } from './services/chat.service';
import { GroupService } from './services/group.service';
import { NotificationService } from './services/notification.service';
import { NotificationComponent } from './notification/notification.component';
import { PosteComponent } from './shared/poste/poste.component';
import { JeuxComponent } from './jeux/jeux.component';
import { MusiqueComponent } from './musique/musique.component';
import { PolitiqueComponent } from './politique/politique.component';
import { EducationComponent } from './education/education.component';
import { SportComponent } from './sport/sport.component';
import { MessageCardComponent } from './shared/message-card/message-card.component';
import { SignaleService } from './services/signale.service';
import { BoiteReceptionComponent } from './boite-reception/boite-reception.component';
import { MessageMailService } from './services/message-mail.service';
import { EmojiPickerComponent } from './shared/emoji-picker/emoji-picker.component';

import { CommonModule, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { RouterModule } from '@angular/router';
import { SuccessComponent } from './success/success.component';
import { ErrorComponent } from './error/error.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { DetailPosteComponent } from './detail-poste/detail-poste.component';
import { NativeHttpInterceptor } from './services/interceptors/nativeHttp.service';
import { TechnologieComponent } from './technologie/technologie.component';
import { AnimaleComponent } from './animale/animale.component';
import { ArtComponent } from './art/art.component';
import { CuisineComponent } from './cuisine/cuisine.component';
import { CultureComponent } from './culture/culture.component';
import { EnvironnementComponent } from './environnement/environnement.component';
import { HistoireComponent } from './histoire/histoire.component';
import { SanteComponent } from './sante/sante.component';
import { ScienceComponent } from './science/science.component';
import { VoyageComponent } from './voyage/voyage.component';




registerLocaleData(localeFr);

@NgModule({ declarations: [
        AppComponent,
        LoginComponent,
        CommentComponent,
        NavbarComponent,
        SidebarComponent,
        AdminLayoutComponent,
        NotificationComponent,
        PosteComponent,
        HomeComponent,
        JeuxComponent,
        MusiqueComponent,
        PolitiqueComponent,
        EducationComponent, SportComponent, ProfileComponent, ChatComponent, MessageCardComponent, BoiteReceptionComponent, EmojiPickerComponent,
        SuccessComponent, ErrorComponent, ResetPasswordComponent, DetailPosteComponent,TechnologieComponent,
        AnimaleComponent,ArtComponent,CuisineComponent,CultureComponent,EnvironnementComponent,HistoireComponent,SanteComponent,
        ScienceComponent,VoyageComponent
    ],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [BrowserModule,
        AppRoutingModule,
        
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        CommonModule,
        RouterModule,
        BrowserAnimationsModule], providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }, PosteService, authInterceptorProviders, { provide: HTTP_INTERCEPTORS, useClass: NativeHttpInterceptor, multi: true },TokenStorageService, AuthService, ChatService, NotificationService, SignaleService, MessageMailService, provideHttpClient(withInterceptorsFromDi())] })
export class AppModule { }
