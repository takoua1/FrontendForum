import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';



import { BehaviorSubject, Observable, Subject, catchError, map, observable, tap, throwError } from 'rxjs';
import { Poste } from '../model/poste';
import { TokenStorageService } from './token-storage.service';
import { Comment } from '../model/comment';
@Injectable({
  providedIn: 'root'
})
export class PosteService {
  private postsSubject = new BehaviorSubject<any[]>([]);
  private postesSource = new BehaviorSubject<any[]>([]);
  private filteredPostesSource = new BehaviorSubject<any[]>([]);
  currentPostes = this.filteredPostesSource.asObservable();
  
  postes$ = this.postesSource.asObservable();
  private totalLikesSubject: Subject<{ postId: number, totalLikes: number }> = new Subject<{ postId: number, totalLikes: number }>();
  private allPostes: any[] = []; 
  page = 1;
  pageSize = 10;
  constructor(private http: HttpClient,private tokenStorage:TokenStorageService) {
  this.fetchPosts();
 }

 /*fetchPosts(page: number, pageSize: number): Observable<any> {
  const url = `/api/poste/findAll?page=${page}&size=${pageSize}`;
  return this.http.get<any>(url).pipe(
     tap(posts => {
       this.postsSubject.next(posts);
       this.postesSource.next(posts);
       this.filteredPostesSource.next(posts);
     })
  );
 }*/
 fetchPosts(): Observable<any> {
  const url = `/api/poste/findAll`;
  return this.http.get<any[]>(url).pipe(
     tap(posts => {
       this.allPostes = posts; // Mettez à jour la liste complète des "postes"
       this.postesSource.next(posts);
     })
  );
 }
 
 resetPostes(): void {
  this.postesSource.next(this.allPostes); // Restaurez la liste complète des "postes"
 }
changePostes(postes: any[]) {
  this.postesSource.next(postes);
}

filterPostes(searchTerm: string) {
  let filteredPostes = this.allPostes;
  if (searchTerm === '') {
     this.postesSource.next(filteredPostes); // Restaurez la liste complète des "postes" si le terme de recherche est supprimé
  } else {
    filteredPostes = filteredPostes.filter(poste => poste.message?.toLowerCase().includes(searchTerm.toLowerCase()));
     this.postesSource.next(filteredPostes);
  }
 }

listePoste(): Observable<any[]> {
  return this.postesSource.asObservable();
}

 addPoste(poste: any): Observable<any> {
    // Ici, vous devez implémenter la logique pour ajouter le poste à votre backend
    // Après avoir ajouté le poste avec succès, mettez à jour le BehaviorSubject
    return this.http.post<any>(`/api/poste/add`, poste).pipe(
      tap(() => this.fetchPosts()) // Recharge la liste des postes après l'ajout
    );
 }
 addcommentToPoste(comment:Comment)
{return this.http.post<Comment>(`/api/poste/addComment`,comment).pipe( tap(() => this.fetchPosts()));}
 
addPosteWithImage(message: string, category: string, file:File | null, id: number): Observable<any> {
  let url = `/api/poste/addPostWithImage/${id}`;
  const formData: FormData = new FormData();
 
  // Ajout des données au FormData
  formData.append('message', message);
  formData.append('category', category);
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
  return this.http.post(url, formData).pipe(
     tap(() => this.fetchPosts()), // Appel de fetchPosts après l'ajout du poste
     catchError(error => {
       console.error('Error add poste image:', error);
       return throwError(error);
     })
  );
 }
updatePoste(message: string, category: string, file: File | null, deleteImage: boolean ,id: number): Observable<Poste> {{

  var url = `/api/poste/updatePoste/${id}`;
 
  const formData: FormData = new FormData();
 
  // Ajout des données au FormData
  formData.append('message', message);
  formData.append('category', category);
  formData.append('deleteImage', String(deleteImage)); 
  console.log('tester le file',file);
  
  if (file !== null) {
    console.log("file non vide ", file);
     formData.append('file', file, file.name);
  
  }
 
  console.log("formdata", formData);
 
  return this.http.put<Poste>(url, formData).pipe(
     tap(() => this.fetchPosts()), 
     catchError(error => {
       console.error('Error update poste image:', error);
       return throwError(error);
     })
  );
    }}
    getTotalLikes(postId: number): Observable<number> {
      return this.http.get<number>(`/api/poste/${postId}/likes`);
      
    }
    
  
    getTotalDislikes(postId: number): Observable<number> {
      return this.http.get<number>(`/api/poste/${postId}/dislikes`);
      
    }
  
  
    deletePoste(id: number): Observable<any> {
      const url = `/api/poste/delete/${id}`;
  
      return this.http.delete(url,{ responseType: 'text' }).pipe(
        tap(() => this.fetchPosts()),
        catchError((error: HttpErrorResponse) => {
          console.error('Error deleting poste:', error);
          return throwError(error);
        })
      );
    }

    disablePost(posteId: number): Observable<void> {

      let url=`/api/poste/disable/${posteId}`
      return this.http.patch<void>(url, {});
    }
  
    // Activer un post
    enablePost(posteId: number): Observable<void> {
        let url=`/api/poste/enable/${posteId}`
      return this.http.patch<void>(url, {});
    }
    getPosteById(id: number): Observable<any> {

      let url=`/api/poste/${id}`;
      return this.http.get<any>(url);
    }


    getPostCountByUser(userId: number): Observable<number> {
      let url=`/api/poste/count/${userId}`
      return this.http.get<number>(url);
    }
}

