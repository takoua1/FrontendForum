import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TokenStorageService } from './token-storage.service';
import { User } from '../model/user';

@Injectable({
  providedIn: 'root'
})
export class FollowService {
  private followStatusSubject = new BehaviorSubject<boolean>(false);
  
  
  followStatus$ = this.followStatusSubject.asObservable();
  constructor(private http: HttpClient) { }


  followUser(followerId: number, followedId: number): Observable<string> {
   
    let url=`/follow/${followerId}/${followedId}`
    return this.http.post<string>(url, {});
  }

  unfollowUser(followerId: number, followedId: number): Observable<any> {
    let url=`/follow/${followerId}/${followedId}`;
    return this.http.delete<string>(url,{});
  }

  isFollowing(currentUserId: number, followedId: number): Observable<boolean> {
    console.log(`Vérification du suivi de ${currentUserId} vers ${followedId}`);
    return this.http.get<boolean>(`/follow/isFollowing/${currentUserId}/${followedId}`);
  }

  updateFollowStatus(isFollowing: boolean): void {
    this.followStatusSubject.next(isFollowing);
  }

  getFollowedUsers(userId: number): Observable<User[]> {
    let url=`/follow/followed/${userId}`
    return this.http.get<User[]>(url);
  }

  // Liste des utilisateurs qui suivent
  getFollowers(userId: number): Observable<User[]> {
    let url=`/follow/followers/${userId}`
    return this.http.get<User[]>(url);
  }
}
