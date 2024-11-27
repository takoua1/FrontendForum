import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TokenStorageService } from './token-storage.service';
import { Interaction } from '../model/interaction';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class InteractionService {
  private apiUrl = environment .apiUrl;
  constructor(private http: HttpClient, private tokenStorage:TokenStorageService) { }

  onInteractionPoste(interaction:Interaction)
{
  return this.http.post<any>(`${this.apiUrl}/interaction/poste`,interaction);


   }

   onInteractionComment(interaction:Interaction)
{
  return this.http.post<any>(`${this.apiUrl}/interaction/comment`,interaction);


   }
getInteractionByUserIdAndPosteIdType(userId: number, posteId: number,type:string): Observable<any> {
  return this.http.get(`${this.apiUrl}/interaction/find/poste/${userId}/${posteId}/${type}`);
}
getInteractionByUserIdAndCommentIdType(userId: number, commentId: number,type:string): Observable<any> {
  return this.http.get(`${this.apiUrl}/interaction/find/comment/${userId}/${commentId}/${type}`);
}
removeInteraction(id:number) :Observable<any> {
  
  const url = `${this.apiUrl}/interaction/delete/${id}`;

  return this.http.delete(url,{responseType: 'text'}).pipe(response=>{
    return response;
  },
    catchError((error: HttpErrorResponse) => {
      console.error('Error deleting interaction:', error);
      return throwError(error);
    }));
}
}
