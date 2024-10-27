import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate{

  constructor(private router: Router,private authService: AuthService) { }

  canActivate(): boolean {
   if (this.authService.isUserAuthenticated()) {
      return true;
    } else {
      // Rediriger l'utilisateur vers une page d'erreur ou une page de connexion
      this.router.navigate(['/login']);
      return false;
    }
   
  }
}
