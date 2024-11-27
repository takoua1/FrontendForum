import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TokenStorageService } from './token-storage.service';
import { User } from '../model/user';
import { environment } from 'src/environments/environment.prod';
@Injectable({
  providedIn: 'root'
})
export class FollowService {
  private followStatusSubject = new BehaviorSubject<boolean>(false);
  private apiUrl = environment.apiUrl;
  
  followStatus$ = this.followStatusSubject.asObservable();
  constructor(private http: HttpClient) { }


  followUser(followerId: number, followedId: number): Observable<string> {
   
    let url=`${this.apiUrl}/follow/${followerId}/${followedId}`
    return this.http.post<string>(url, {});
  }

  unfollowUser(followerId: number, followedId: number): Observable<any> {
    let url=`${this.apiUrl}/follow/${followerId}/${followedId}`;
    return this.http.delete<string>(url,{});
  }

  isFollowing(currentUserId: number, followedId: number): Observable<boolean> {
    console.log(`Vérification du suivi de ${currentUserId} vers ${followedId}`);
    return this.http.get<boolean>(`${this.apiUrl}/follow/isFollowing/${currentUserId}/${followedId}`);
  }

  updateFollowStatus(isFollowing: boolean): void {
    this.followStatusSubject.next(isFollowing);
  }

  getFollowedUsers(userId: number): Observable<User[]> {
    let url=`${this.apiUrl}/follow${this.apiUrl}/followed/${userId}`
    return this.http.get<User[]>(url);
  }

  // Liste des utilisateurs qui suivent
  getFollowers(userId: number): Observable<User[]> {
    let url=`${this.apiUrl}/follow${this.apiUrl}/followers/${userId}`
    return this.http.get<User[]>(url);
  }
}
