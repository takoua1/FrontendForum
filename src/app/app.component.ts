import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'TunisiaForum';
  isAuthenticated: boolean = false;

  
  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Vérifie l'authentification lorsque le composant est initialisé
    this.isAuthenticated = this.authService.isUserAuthenticated();
  }  
  
}
