import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ProfileComponent } from './profile/profile.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { SuccessComponent } from './success/success.component';
import { ErrorComponent } from './error/error.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';


const routes: Routes = [
  {path:'login' ,component :LoginComponent},
   {path:'reset-password',component:ResetPasswordComponent},
  { path: 'success', component: SuccessComponent },
  { path: 'error', component: ErrorComponent },
  {path:'', component: AdminLayoutComponent,  children: [
    {
  path: '',
  loadChildren: () => import('./layout/admin-layout/admin-layout.module').then(x => x.AdminLayoutModule)
}]}
 ];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
