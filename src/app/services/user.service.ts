import { Injectable } from '@angular/core';
import { TokenStorageService } from './token-storage.service';
import { BehaviorSubject, Observable, catchError, map, switchMap, tap, throwError } from 'rxjs';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User } from '../model/user';
import { environment } from 'src/environments/environment.prod';
@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient, private tokenStorage:TokenStorageService) { }
  private usersSource = new BehaviorSubject<any[]>([]);
  private filteredUsersSource = new BehaviorSubject<any[]>([]);
  currentUsers = this.filteredUsersSource.asObservable();
  private apiUrl = environment.apiUrl;
  findByUsername(username:string)
  { 
    let headers = new HttpHeaders({'Content-Type': 'application/json', Authorization:'Bearer '+ this.tokenStorage.getToken() })
    console.log(this.tokenStorage.getToken());
    var url=`${this.apiUrl}/user/findByUsername/${username}`;
     console.log("//////////");
    
    return this.http.get<User>(url ,{headers:headers});
  }
  findById(id:number) :Observable<any>
  { 
    let headers = new HttpHeaders({'Content-Type': 'application/json', Authorization:'Bearer '+ this.tokenStorage.getToken() })
    console.log(this.tokenStorage.getToken());
    var url=`${this.apiUrl}/user/findById/${id}`;
     console.log("//////////");
    
    return this.http.get<User>(url);
  }
  updateUser(id: number, user: User): Observable<any> {
    const url = `${this.apiUrl}/user/update/${id}`;
    return this.http.patch<any>(url, user);
}
  updateUserImage(file: File, id: number): Observable<any> {
    let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.tokenStorage.getToken() });
    var url = `${this.apiUrl}/user/uploadImage/${id}`;
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
    return this.http.put<string>(url, formData).pipe(
       catchError(error => {
         console.error('Error updating user image:', error);
         return throwError(error);
       })
    );
   }
   findAll(): Observable<any[]> {
    const url = `${this.apiUrl}/user/findAll`;
    return this.http.get<any[]>(url);
 }

 filterUsers(users: any[], searchUsername: string, searchEmail: string): any[] {
  return users.filter(user => {
    const matchUsername = searchUsername ? user.username.toLowerCase().includes(searchUsername.toLowerCase()) : true;
    const matchEmail = searchEmail ? user.email.toLowerCase().includes(searchEmail.toLowerCase()) : true;
    return matchUsername && matchEmail;
  });
}

checkUserExists(filteredUsers: any[], searchUsername: string, searchEmail: string): boolean {
  const lowerSearchUsername = searchUsername ? searchUsername.toLowerCase() : null;
  const lowerSearchEmail = searchEmail ? searchEmail.toLowerCase() : null;

  return filteredUsers.some(user => {
    const matchUsername = lowerSearchUsername ? user.username.toLowerCase() === lowerSearchUsername : false;
    const matchEmail = lowerSearchEmail ? user.email.toLowerCase() === lowerSearchEmail : false;
    return matchUsername || matchEmail;
  });
}


 connectUser(user: any): Observable<any> {
  const url=`${this.apiUrl}/user/connect`
  return this.http.put(url, user);
}
getOfflineDuration(username:string):Observable<string>
 {
   const url =`${this.apiUrl}/user/offline-duration/${username}`;
   return this.http.get(url, {responseType: 'text' });
 }

 changePassword(passwordData: ChangePasswordRequest): Observable<any> {
  const url=`${this.apiUrl}/user/change-password`;
  return this.http.put(url, passwordData, { responseType: 'text' }).pipe(
    catchError(error=> {
      console.error("error upadte paswword",error);
      return throwError(error);
    })
      
  );
}

}
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmationPassword: string;
}