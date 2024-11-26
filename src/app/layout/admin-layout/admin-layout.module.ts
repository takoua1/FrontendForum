import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminLayoutRoutes } from './admin-layout.routing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomeComponent } from '../../home/home.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CommentComponent } from '../../shared/comment/comment.component';

import { MatDialogModule } from '@angular/material/dialog';
import { PosteService } from '../../services/poste.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PosteComponent } from '../../shared/poste/poste.component';
import { JeuxComponent } from '../../jeux/jeux.component';
import { MusiqueComponent } from '../../musique/musique.component';
import { PolitiqueComponent } from '../../politique/politique.component';
import { EducationComponent } from '../../education/education.component';
import { SportComponent } from '../../sport/sport.component';
import { ProfileComponent } from '../../profile/profile.component';
import { ChatComponent } from '../../chat/chat.component';

import { MessageCardComponent } from '../../shared/message-card/message-card.component';
import { NotificationComponent } from '../../notification/notification.component';
import { ChatService } from '../../services/chat.service';





@NgModule({
 
  declarations: [],
  imports: [
   
    CommonModule,
  
    RouterModule .forChild(AdminLayoutRoutes),
    FormsModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatPaginatorModule,
  
 
  ]
 
})
export class AdminLayoutModule { }
