

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
import { AuthGuard } from '../../services/security/auth-guard.service';
import { DetailPosteComponent } from '../../detail-poste/detail-poste.component';

export const AdminLayoutRoutes: Routes = [

    { path: 'home',  component: HomeComponent},
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    
    {path: 'game',  component: JeuxComponent},
    {path: 'music',  component: MusiqueComponent},
    {path: 'policy',  component: PolitiqueComponent},
    {path: 'education',  component: EducationComponent},
    {path: 'sport',  component: SportComponent},
    {path: 'profile/:id',  component: ProfileComponent, canActivate:  [AuthGuard]},
    {path:'chat',component:ChatComponent ,canActivate:  [AuthGuard]},
    {path:'notification',component:NotificationComponent,canActivate:  [AuthGuard]},
    {
     path:'mail',component:BoiteReceptionComponent ,canActivate:  [AuthGuard]
    },
    { path: 'detail/:id', component: DetailPosteComponent ,canActivate:  [AuthGuard]},
    { path: '**', redirectTo: '' }

];
