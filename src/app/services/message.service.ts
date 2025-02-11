import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Message } from '../model/message';
import { Chat } from '../model/chat';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private messageDeletedSource = new Subject<number>();
  messageDeleted$ = this.messageDeletedSource.asObservable();
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }

  getChatMembers(messageId:number):Observable<any>
{
  const url =`${this.apiUrl}/message/receivers/${messageId}`;
  return this.http.get<any[]>(url);
}

getMessagesBetwenUser(senderId: number, receiverId: number): Observable<Message[]> {
  const url = `${this.apiUrl}/message/getMessages/${senderId}/${receiverId}`;
  return this.http.get<Message[]>(url);
}
getCommonChats(senderId1: number, senderId2: number): Observable<Chat[]> {
  const url = `${this.apiUrl}/message/common-chats/${senderId1}/${senderId2}`;
  return this.http.get<Chat[]>(url);
}
markMessageAsRead(messageId: number): Observable<void> {
const url = `${this.apiUrl}/message/markAsRead/${messageId}`;

  return this.http.patch<void>(url, {});
}

deleteMessage(messageId: number):void {
  // Appel à l'API pour supprimer le message...
  this.http.delete(`${this.apiUrl}/message/${messageId}`).subscribe({
    next: () => {
      console.log(`Message avec ID ${messageId} supprimé`);
      this.messageDeletedSource.next(messageId); // Émettre l'ID du message supprimé
    },
    error: (err) => {
      console.error('Erreur lors de la suppression du message', err);
    }
  });
}

getLastMessage():Observable<Message>{
  const url = `${this.apiUrl}/message/last-message`;
  return this.http.get<Message>(url)
}
}
