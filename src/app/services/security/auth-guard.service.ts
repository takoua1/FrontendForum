import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { map, Observable } from 'rxjs';
import { TokenStorageService } from '../token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate{
  isUserAuthenticated: boolean = false;
  constructor(private router: Router,private authService: AuthService, private token: TokenStorageService) {
this. isAuthenticated();
   }

  canActivate():boolean {
    if (this.isUserAuthenticated)
    {
      return true;
    }
  else {
    this.router.navigate(['/home']);
    return false;

  }
  }


  isAuthenticated(){
    const user = this.token.getToken(); 
    this.isUserAuthenticated = user !== null; 
    console.log(this.isUserAuthenticated); 

  }
}
