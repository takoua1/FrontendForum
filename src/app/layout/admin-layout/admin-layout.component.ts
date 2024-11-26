import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-admin-layout',
    templateUrl: './admin-layout.component.html',
    styleUrls: ['./admin-layout.component.css'],
    standalone: false
})
export class AdminLayoutComponent implements OnInit {
  isAuthenticated: boolean = false;
  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    // Vérifie l'authentification lorsque le composant est initialisé
    this.isAuthenticated = this.authService.isUserAuthenticated();
  }  

}
