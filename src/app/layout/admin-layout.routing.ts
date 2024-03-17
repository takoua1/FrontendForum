

import { Routes } from '@angular/router';
import { HomeComponent } from "src/app/home/home.component";


export const AdminLayoutRoutes: Routes = [

    { path: 'home',  component: HomeComponent , },
    {path: '',  component: HomeComponent ,},

];