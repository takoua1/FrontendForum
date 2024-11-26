import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../model/user';

@Injectable({
  providedIn: 'root'
})
export class BlockService {
  private apiUrl = '/api/blocks';
  constructor(private http: HttpClient) { }


  blockUser(blockerId: number, blockedId: number): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/block?blockerId=${blockerId}&blockedId=${blockedId}`, {});
  }

  unblockUser(blockerId: number, blockedId: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/unblock/${blockerId}/${blockedId}`);
  }

  getBlockedUsers(blockerId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/blocked/${blockerId}`);
  }

  getBlockers(blockedId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/blockers/${blockedId}`);
  }

  isUserBlocked(blockerId: number, blockedId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/isBlocked?blockerId=${blockerId}&blockedId=${blockedId}`);
  }
  isUserBlockedByUsername(blockerUsername: string, blockedUsername: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/isBlockedByUsername?blockerUsername=${blockerUsername}&blockedUsername=${blockedUsername}`);
  }
}
