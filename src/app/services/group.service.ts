import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { TokenStorageService } from './token-storage.service';
import { Chat } from '../model/chat';
import { Groupe } from '../model/groupe';

@Injectable({
  providedIn: 'root'
})


export class GroupService {
  private groupeListUpdatedSource = new Subject<void>();
  
   groupeListUpdated$ = this.groupeListUpdatedSource.asObservable();
  constructor(private http: HttpClient, private token:TokenStorageService) {}


  addGroupe(groupe:Groupe, file:File | null): Observable<any> {
    let url = `/groupe/addGroupe/${groupe.userCreature.id}`;

    const formData: FormData = new FormData();
 
  // Ajout des données au FormData
  formData.append('nom', groupe.groupName);
  formData.append('category', groupe.category);
  console.log('tester le file',file);
  // Si un fichier est fourni, l'ajouter au FormData
  if (file !== null) {
    console.log("file non vide ", file);
     formData.append('file', file, file.name);
  
  }
  else {
    console.log("file vide", file);
   
    formData.append('file', new Blob([]) ,''); 
  }
  console.log("formdata", formData);

  return this.http.post(url, formData);
  }

  listerGroupe(userId:number ):Observable<any>
  { let url=`/groupe/my-groups/${userId}`;
 
     return this.http.get<any>(url);
  }

  triggerGroupeListUpdated(): void {
    this.groupeListUpdatedSource.next();
  }
  chatByGroup(groupId:number):Observable<Chat>
  {
    let url=`/groupe/getChat/${groupId}`;
    return this.http.get<Chat>(url);
  }
  findAll():Observable<Groupe[]>
  
  {
    let url =`/groupe/findAll`;
    return this.http.get<Groupe[]>(url);
  }

  addMember(groupeId:number,userId:number):Observable<Groupe>
  {
    let url=`/groupe/addMember/${groupeId}/${userId}`;
    return this.http.put<Groupe>(url, {});
  }

  
}