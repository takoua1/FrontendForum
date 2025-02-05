

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
import { TechnologieComponent } from 'src/app/technologie/technologie.component';
import { AnimaleComponent } from 'src/app/animale/animale.component';
import { ArtComponent } from 'src/app/art/art.component';
import { CuisineComponent } from 'src/app/cuisine/cuisine.component';
import { CultureComponent } from 'src/app/culture/culture.component';
import { EnvironnementComponent } from 'src/app/environnement/environnement.component';
import { HistoireComponent } from 'src/app/histoire/histoire.component';
import { SanteComponent } from 'src/app/sante/sante.component';
import { ScienceComponent } from 'src/app/science/science.component';
import { VoyageComponent } from 'src/app/voyage/voyage.component';
export const AdminLayoutRoutes: Routes = [

    { path: 'home',  component: HomeComponent},
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    
    {path: 'game',  component: JeuxComponent},
    {path: 'music',  component: MusiqueComponent},
    {path: 'policy',  component: PolitiqueComponent},
    {path: 'education',  component: EducationComponent},
     {path:'animal',component:AnimaleComponent},
     {path:'art', component:ArtComponent},
     {path:'kitchen',component:CuisineComponent},
     {path:'culture',component:CultureComponent},
     {path:'environment',component:EnvironnementComponent},
     {path:'history',component:HistoireComponent},
     {path:'health',component:SanteComponent},
     {path:'science',component:ScienceComponent},
     {path:'Travel',component:VoyageComponent},
    {path: 'sport',  component: SportComponent},
    {path:'technology',component:TechnologieComponent},
    {path: 'profile/:id',  component: ProfileComponent, canActivate:  [AuthGuard]},
    {path:'chat',component:ChatComponent ,canActivate:  [AuthGuard]},
    {path:'notification',component:NotificationComponent,canActivate:  [AuthGuard]},
    {
     path:'mail',component:BoiteReceptionComponent ,canActivate:  [AuthGuard]
    },
    { path: 'detail/:id', component: DetailPosteComponent ,canActivate:  [AuthGuard]},
    { path: '**', redirectTo: '' }

];
