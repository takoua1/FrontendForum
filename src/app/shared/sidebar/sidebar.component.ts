import { Component, OnInit } from '@angular/core';
import { TokenStorageService } from '../../services/token-storage.service';
import { UserService } from '../../services/user.service';
import { User } from '../../model/user';
import { Router } from '@angular/router';
export interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
}

export const ROUTES: RouteInfo[] = [
  { path: '/home',     title: 'Accueil',        icon:'bx bx-home',       class: '' },
  {path:'/animal',title:'Animaux',icon:'bx bxs-cat',class:''},
  {path:'/art',title:'Art',icon:'bx bxs-palette',class:''},
  {path:'/kitchen',title:'Cuisine',icon:'bx bxs-dish',class:''},
  {path:'/culture',title:'Culture',icon:'bx bx-landscape',class:''},
  { path: '/education',         title: 'Education',        icon:'bx bxs-pen',    class: '' },
  {path:'/environment',title:'Environnement',icon:'bx bxs-leaf',class:''},
  {path:'/history',title:'Histoire',icon:'bx bx-history',class:''},
  
  { path: '/game',         title: 'Jeux',             icon:'bx bxs-game',    class: '' },
  { path: '/music',          title: 'Musique',       icon:'bx bx-music',  class: '' },
  { path: '/policy',      title: 'Politique',         icon:'bx bxs-user-voice',    class: '' },
  {path:'/health',title:'Santé',icon:'bx bxs-briefcase',class:''},
  {path:'/science',title:'Science',icon:'bx bxs-flask',class:''},
  { path: '/sport',          title: 'Sport',              icon:'bx bx-football',      class: '' },
  {path:'/technology',title:'Technologie',icon:'bx bx-atom',class:''},
  {path:'/travel',title:'Voyage',icon:'bx bxs-plane-alt',class:''},
 
  
 
 
];
@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.css'],
    standalone: false
})
export class SidebarComponent implements OnInit {

  isUserAuthenticated:boolean=false;
  currentUser: any;
  user: User= new User();
  constructor(private token:TokenStorageService,private userService:UserService, private router :Router) { }
  public menuItems: any[];
  public extendedMenuItems: any[];
  private sidebar: HTMLElement | null = null; // Élément de la barre latérale
  private topSection: HTMLElement | null = null; // Section `.top` à protéger
  ngOnInit() {
  

      this.menuItems = ROUTES.filter(menuItem => menuItem);
      this.currentUser = this.token.getUser();
      this.extendedMenuItems = [...this.menuItems, ...this.menuItems];
      this.onIconClick();
       this.findUser(this.currentUser.username);
       this.isAuthenticated();
           
    }
    isLongText(title: string): boolean {
      const maxLength = 15; // Limite de caractères
      return title.length > maxLength;
    }
    isAuthenticated(){
      const user = this.token.getToken(); 
      this.isUserAuthenticated = user !== null; 
      console.log(this.isUserAuthenticated); 
  
    }
    findUser(username: string)

    {
      this.userService.findByUsername
      (username).subscribe((user: User) => {
        this.user = user;
        console.log(this.user);
       
      },
      (error) => {
        console.error('Error fetching user:', error);
        
      })}
    ecouteEvent():void {
      const btnEvent = new Event('btnEvent');
      window.dispatchEvent(btnEvent);
    }
    onIconClick(): void {
     
      const sidebar = document.querySelector('.sidebar') ;
      const btn = document.querySelector('#btn') ;
      
     
      const sendEventBtn = document.getElementById('#btn');
     btn?.addEventListener('click', () => {
        sidebar?.classList.toggle('active');
        const isActive = sidebar?.classList.contains('active');
        console.log(isActive);
        if(isActive)
        {localStorage.setItem('sidebarActive','true');
        console.log(isActive);
      }
      else{
        localStorage.setItem('sidebarActive','false');
        console.log(isActive);
      }
        this.ecouteEvent();
      });
      
  
    }
    isHomePage(): boolean {
      return this.router.url === '/home'; // Modifiez selon votre chemin exact
    }
    navProfile(user:User)
    {
     
        this.router.navigate(['/profile', user.id]).then(() => {
          window.location.reload();
        });
      }
     
     
    
}

