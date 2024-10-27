

import { Routes } from '@angular/router';
import { HomeComponent } from '../../home/home.component';
import { JeuxComponent } from '../../jeux/jeux.component';
import { MusiqueComponent } from '../../musique/musique.component';
import { PolitiqueComponent } from '../../politique/politique.component';
import { EducationComponent } from '../../education/education.component';
import { SportComponent } from '../../sport/sport.component';
import { ProfileComponent } from '../../profile/profile.component';
import { ChatComponent } from '../../chat/chat.component';
import { NotificationComponent } from '../../notification/notification.component';
import { BoiteReceptionComponent } from '../../boite-reception/boite-reception.component';
import { SuccessComponent } from '../../success/success.component';
import { ErrorComponent } from '../../error/error.component';

export const AdminLayoutRoutes: Routes = [

    { path: 'home',  component: HomeComponent},
    {path: '',  component: HomeComponent},
    {path: 'game',  component: JeuxComponent},
    {path: 'music',  component: MusiqueComponent},
    {path: 'policy',  component: PolitiqueComponent},
    {path: 'education',  component: EducationComponent},
    {path: 'sport',  component: SportComponent},
    {path: 'profile/:id',  component: ProfileComponent},
    {path:'chat',component:ChatComponent},
    {path:'notification',component:NotificationComponent},
    {
     path:'mail',component:BoiteReceptionComponent   
    },


];
