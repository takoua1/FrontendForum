import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';



import { BehaviorSubject, Observable, Subject, catchError, map, observable, tap, throwError } from 'rxjs';
import { Poste } from '../model/poste';
import { TokenStorageService } from './token-storage.service';
import { Comment } from '../model/comment';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class PosteService {
  private postsSubject = new BehaviorSubject<any[]>([]);
  private postesSource = new BehaviorSubject<any[]>([]);
  private filteredPostesSource = new BehaviorSubject<any[]>([]);
  currentPostes = this.filteredPostesSource.asObservable();
  private apiUrl = environment .apiUrl;
  postes$ = this.postesSource.asObservable();
  private totalLikesSubject: Subject<{ postId: number, totalLikes: number }> = new Subject<{ postId: number, totalLikes: number }>();
  private allPostes: any[] = []; 
  page = 1;
  pageSize = 10;
  constructor(private http: HttpClient,private tokenStorage:TokenStorageService) {
  this.fetchPosts();
 }

 /*fetchPosts(page: number, pageSize: number): Observable<any> {
  const url = `${this.apiUrl}/poste/findAll?page=${page}&size=${pageSize}`;
  return this.http.get<any>(url).pipe(
     tap(posts => {
       this.postsSubject.next(posts);
       this.postesSource.next(posts);
       this.filteredPostesSource.next(posts);
     })
  );
 }*/
 fetchPosts(): Observable<any> {


  const url = `${this.apiUrl}/poste/findAll`;
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
    const terms = searchTerm.toLowerCase().split(' ');
    filteredPostes = filteredPostes.filter(poste => {
      const messageMatches = poste.message?.toLowerCase().includes(searchTerm.toLowerCase());
      const categMatches=poste.category?.toLowerCase().includes(searchTerm.toLowerCase());
       // Vérifiez si les deux termes correspondent au nom ou au prénom
       const userNomMatches = terms.every(term => poste.user.nom?.toLowerCase().includes(term));
       const userPrenomMatches = terms.every(term => poste.user.prenom?.toLowerCase().includes(term));
      // Retourne vrai si le message, le nom ou le prénom correspondent au terme de recherche
      return messageMatches || categMatches || userNomMatches || userPrenomMatches;
    });
     this.postesSource.next(filteredPostes);
  }
 }

listePoste(): Observable<any[]> {
  return this.postesSource.asObservable();
}

 addPoste(poste: any): Observable<any> {
    // Ici, vous devez implémenter la logique pour ajouter le poste à votre backend
    // Après avoir ajouté le poste avec succès, mettez à jour le BehaviorSubject
    return this.http.post<any>(`${this.apiUrl}/poste/add`, poste).pipe(
      tap(() => this.fetchPosts()) // Recharge la liste des postes après l'ajout
    );
 }
 addcommentToPoste(comment:Comment)
{return this.http.post<Comment>(`${this.apiUrl}/poste/addComment`,comment).pipe( tap(() => this.fetchPosts()));}
 
addPosteWithImage(message: string, category: string, file:File | null, id: number): Observable<any> {
  let url = `${this.apiUrl}/poste/addPostWithImage/${id}`;
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

  var url = `${this.apiUrl}/poste/updatePoste/${id}`;
 
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
      return this.http.get<number>(`${this.apiUrl}/poste/${postId}/likes`);
      
    }
    
  
    getTotalDislikes(postId: number): Observable<number> {
      return this.http.get<number>(`${this.apiUrl}/poste/${postId}/dislikes`);
      
    }
  
  
    deletePoste(id: number): Observable<any> {
      const url = `${this.apiUrl}/poste/delete/${id}`;
  
      return this.http.delete(url,{ responseType: 'text' }).pipe(
        tap(() => this.fetchPosts()),
        catchError((error: HttpErrorResponse) => {
          console.error('Error deleting poste:', error);
          return throwError(error);
        })
      );
    }

    disablePost(posteId: number): Observable<void> {

      let url=`${this.apiUrl}/poste/disable/${posteId}`
      return this.http.patch<void>(url, {});
    }
  
    // Activer un post
    enablePost(posteId: number): Observable<void> {
        let url=`${this.apiUrl}/poste/enable/${posteId}`
      return this.http.patch<void>(url, {});
    }
    getPosteById(id: number): Observable<any> {

      let url=`${this.apiUrl}/poste/${id}`;
      return this.http.get<any>(url);
    }


    getPostCountByUser(userId: number): Observable<number> {
      let url=`${this.apiUrl}/poste/count/${userId}`
      return this.http.get<number>(url);
    }
}

