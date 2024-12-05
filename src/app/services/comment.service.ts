import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TokenStorageService } from './token-storage.service';
import { Comment } from '../model/comment';
import { Observable, Subject, catchError, map, throwError } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private listUpdatedSource = new Subject<void>();
  private apiUrl = environment.apiUrl;
  
  listUpdated$ = this.listUpdatedSource.asObservable();
  constructor(private http: HttpClient,private tokenStorage:TokenStorageService) { }

  addCommentToPost(comment:Comment):Observable<any>{
    let headers = new HttpHeaders({'Content-Type': 'application/json', Authorization:'Bearer '+ this.tokenStorage.getToken() })
    return this.http.post(`${this.apiUrl}/comment/addComment`, comment, { headers })
    .pipe(map(response => {
      return response;
    }));}
  addCommentToComment(commentchild:Comment):Observable<any>{
    let headers = new HttpHeaders({'Content-Type': 'application/json', Authorization:'Bearer '+ this.tokenStorage.getToken() })
    return this.http.post<any>(`${this.apiUrl}/comment/addReponse`,commentchild, { headers })
    .pipe(map(response=>{
      return response;
    }));}
    getPosteByCommentId(commentId: number): Observable<any> {
      return this.http.get<any>(`${this.apiUrl}/comment/poste/${commentId}`);
    }
    addCommentToPostWithImage (text: string, category: string, file:File | null, idUser: number,idPoste:number): Observable<any> {
  let url = `${this.apiUrl}/comment/addCommentToPosteWithImage/${idUser}/${idPoste}`;
  const formData: FormData = new FormData();
 
  // Ajout des données au FormData
  formData.append('text', text);

  console.log('tester le file',file);
  // Si un fichier est fourni, l'ajouter au FormData
  if (file !== null) {
    console.log("file non vide ", file);
     formData.append('file', file, file.name);
  
  }
  else {
    console.log("file vide", file);
   
    formData.append('file', new Blob([]) ,''); // Ajoute une chaîne vide
  }
  console.log("formdata", formData);
  // Utilisation de HttpClient pour envoyer la requête POST
  return this.http.post(url, formData).pipe(map(response=>{
    return response;
  }));
          
}
deleteComment(id: number): Observable<any> {
  const url = `${this.apiUrl}/comment/delete/${id}`;

  return this.http.delete(url,{ responseType: 'text' }).pipe(map(response=>{
    return response;
  },
    catchError((error: HttpErrorResponse) => {
      console.error('Error deleting comment:', error);
      return throwError(error);
    })));
  
}
getTotalLikes(commentId: number): Observable<number> {
  return this.http.get<number>(`${this.apiUrl}/comment/${commentId}/likes`);
  
}


getTotalDislikes(commentId: number): Observable<number> {
  
  return this.http.get<number>(`${this.apiUrl}/comment/${commentId}/dislikes`);
  
}
disableComment(commentId: number): Observable<void> {

  let url =`${this.apiUrl}/comment/disable/${commentId}`;
  return this.http.patch<void>(url, {});
}

// Activer un commentaire
enableComment(commentId: number): Observable<void> {
  let url =`${this.apiUrl}/comment/enable/${commentId}`;
  return this.http.patch<void>(url, {});
}


getCommentById(id: number): Observable<any> {

  let url=`${this.apiUrl}/comment/${id}`;
  return this.http.get<any>(url);
}

getCommentsByPostId(postId: number): Observable<Comment[]> {
  return this.http.get<Comment[]>(`${this.apiUrl}/comment/poste/comments/${postId}`);
}

getChildById(commentId: number): Observable<Comment[]> {
  return this.http.get<Comment[]>(`${this.apiUrl}/comment/child/${commentId}`);
}
getCommentWithParent(commentId: number): Observable<Comment> 
{
  return this.http.get<Comment>(`${this.apiUrl}/comment/with-parent/${commentId}`);
}

getCommentHierarchy(commentId: number): Observable<Comment[]> {
  return this.http.get<Comment[]>(`${this.apiUrl}/comment/hierarchy/${commentId}`);
}
triggerListUpdated(): void {
  this.listUpdatedSource.next();
}
}