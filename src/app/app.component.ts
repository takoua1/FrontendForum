import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { ChatService } from './services/chat.service';
import { UserService } from './services/user.service';
import { TokenStorageService } from './services/token-storage.service';
import { User } from './model/user';
import { Router } from '@angular/router';
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent implements OnInit{
  title = 'TunisiaForum';
  isAuthenticated: boolean = false;
  private userId: string;
  user:any;
  private userBlockedSubscription: any; 
  constructor(private authService: AuthService,private token:TokenStorageService,private chatService:ChatService,private userService:UserService,private router:Router) {}

  ngOnInit(): void {
    // Vérifie l'authentification lorsque le composant est initialisé
    this.isAuthenticated = this.authService.isUserAuthenticated();
    const username=this.token.getUser().username;
   
   this.findUser(username).then(user => {
    this.user=user;
    console.log("this.user",this.user)
    this.chatService.listenForBlock(this.user.id.toString()).subscribe((message) => {
      console.log('Utilisateur bloqué:', message);
     this.logout()
      window.location.reload();
    });
   })
   
  }
  logout(): void {
    console.log(this.user);
    this.authService.logout().subscribe((response) =>{
       
        console.log('Logout successful:', response);
       // Redirection vers la page d'accueil
      },
       (err) => {
        console.error('Logout failed', err);
        // Gérer l'erreur de déconnexion
      }
    );
    this.token.signOut(); // Supprimez toutes les données du session storage
    this.router.navigate(['/home']);
    location.reload();
  }
  findUser(username: string): Promise<User> {
    return new Promise((resolve, reject) => {
       this.userService.findByUsername(username).subscribe(
         (user: any) => {
           this.user = user;
           console.log(this.user);
           resolve(user); // Résolvez la promesse avec l'utilisateur trouvé
         },
         (error) => {
           console.error('Error fetching user:', error);
           reject(error); // Rejetez la promesse en cas d'erreur
         }
       );
    });
   }
  }  
  

