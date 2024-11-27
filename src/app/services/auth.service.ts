import { Injectable, NgZone, OnDestroy } from '@angular/core';

import { TokenStorageService } from './token-storage.service';
import { BehaviorSubject, Observable, Subscription, fromEvent, interval, map, merge, tap, timer } from 'rxjs';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User } from '../model/user';
import { UserService } from './user.service';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { environment } from 'src/environments/environment.prod';
@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy{
  private isAuthenticated = false; 
  private apiUrl = environment.apiUrl;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isUserAuthenticated());
  
  private heartbeatInterval: Subscription | undefined;
  private visibilityChangeSubscription: Subscription | undefined;
  private windowFocusSubscription: Subscription | undefined;
  private activityTimer: any;
  private routeSubscription: Subscription | undefined;
   private inactivityTimeout: any;
  constructor( private http:HttpClient  ,private tokenStorage:TokenStorageService, private ngZone: NgZone, private router: Router) {
  //  this.startHeartbeat();
    this.monitorVisibility();
  //  this.monitorUserActivity();
  this.isAuthenticated= window.localStorage.getItem('isAuthenticated') === 'true';
   }
   get isAuthenticated$() {
    return this.isAuthenticatedSubject.asObservable();
  }
  
  // Appeler cette méthode pour mettre à jour l'état lors de la connexion/déconnexion
  updateAuthStatus(isAuthenticated: boolean) {
    window.sessionStorage.setItem('isAuthenticated', isAuthenticated.toString());
    this.isAuthenticatedSubject.next(isAuthenticated);
  }
  login(username:string,password:string):Observable<any>
  {
   
  return this.http.post<any>(`/api/auth/signin`,
 {username,password}).pipe(map(response=>{
 if(response.message_Error!=null)
 {
 this.startHeartbeat();
  this.isAuthenticated=true;
  this.updateAuthStatus(true);
  window.localStorage.setItem('isAuthenticated', 'true');
 }
 else{
  this.isAuthenticated=false;
  window.localStorage.removeItem('isAuthenticated');
 }
  console.log(response.access_Token);
    return response;
  }));
  }
  register(user:any):Observable<any>{
    return this.http.post<any>(`/api/auth/signup`,user)
    .pipe(map(response=>{
    
      return response;
      
    }));
  
  }

  isUserAuthenticated(): boolean {
    return window.sessionStorage.getItem('isAuthenticated') === 'true';
  }
  logout(): Observable<string> {
    this.updateAuthStatus(false);
    const username = this.tokenStorage.getUser().username;
  
    console.log('username',username);
    return this.http.post(`/api/auth/logout`,{username},{ responseType: 'text' }) .pipe(map(response=>{
     
      console.log("stop");
      return response;
    }));
  }
/*  private monitorRouteChanges(): void {
    this.routeSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.startHeartbeat();
      }
      if (event instanceof NavigationEnd && this.isApplicationPage(event.urlAfterRedirects)) {
        this.stopHeartbeat();
      }
    });
  }*/

  private startHeartbeat() {
    const user = this.tokenStorage.getUser();
    if (user) {
      this.http.post(`/api/auth/heartbeat`, { username: user.username }).subscribe();
      console.log("heartbeat");
      this.heartbeatInterval = interval(60000).subscribe(() => {
        this.http.post(`/api/auth/heartbeat`, { username: user.username }).subscribe();
        console.log("heartbeat");
      });
    }
  }
  

  
  private startActivityTimer() {
    const user = this.tokenStorage.getUser();
    this.activityTimer = setTimeout(() => {
      // Utilisateur inactif, effectuer une action (comme la déconnexion)
      this.http.post(`/api/auth/disconnect`, { username: user.username }).subscribe();
    }, 30000); // 30 secondes
  }
  
  private resetActivityTimer() {
    clearTimeout(this.activityTimer);
    this.startActivityTimer();
  }
  private monitorUserActivity() {
    fromEvent(window, 'mousemove').subscribe(() => this.startHeartbeat() );
    fromEvent(window, 'keydown').subscribe(() => this.startHeartbeat() );
   // this.startActivityTimer(); 
  }
 
  private stopHeartbeat() {
    const user = this.tokenStorage.getUser();
    if (this.heartbeatInterval) {
      this.heartbeatInterval.unsubscribe();
      if (user) {
        this.http.post(`/api/auth/disconnect`, { username: user.username }).subscribe();
      }
      console.log('stop');
    }
  }
  private monitorVisibility(): void {
    this.visibilityChangeSubscription = fromEvent(document, 'visibilitychange')
    .subscribe(() => {
        if (document.hidden) {
          this.stopHeartbeat();
        } else {
          this.startHeartbeat();
        }
      });

  /*  this.windowFocusSubscription = fromEvent(window, 'focus')
    .subscribe(() => this.startHeartbeat());

    fromEvent(window, 'blur')
    .subscribe(() => this.stopHeartbeat());*/
}

 
  ngOnDestroy() {
    this.stopHeartbeat();
    if (this.visibilityChangeSubscription) {
      this.visibilityChangeSubscription.unsubscribe();
    }
  }
  forgotPassword(email: string): Observable<any> {
    
    return this.http.post(`/api/auth/forgot-password`,{email:email} )
    
  }
  

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`/api/auth/reset-password`, { token:token, password: newPassword });
  }
 
}

