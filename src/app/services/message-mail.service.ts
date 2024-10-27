import { Injectable } from '@angular/core';
import { Stomp } from '@stomp/stompjs';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import SockJS from 'sockjs-client';
import { TokenStorageService } from './token-storage.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MessageMailService {
  private stompClient: any;
  private mailSubject:  BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  private connectedPromise: Promise<void>;
  private isConnected = false;
  constructor(private token :TokenStorageService,private http :HttpClient) {
    this.loadMailInitial();
    this.initializeWebSocketConnection();

   }


   private initializeWebSocketConnection(): void {
    const socket = new SockJS('/api/ws-mail');
    this.stompClient = Stomp.over(socket);

    this.stompClient.connect({}, (frame: any) => {
        this.isConnected = true;
        console.log('Connected:', frame);

        const user = this.token.getUser();
        console.log('Connected to WebSocket');

        // Abonnement aux messages privés
        this.stompClient.subscribe(`/user/${user.username}/queue/mail`, (message: any) => {
            console.log('Message reçu :', message);
            try {
              const mail = JSON.parse(message.body);
              const currentMails = this.mailSubject.value;
    
              if (Array.isArray(currentMails)) {
                // Ajoute le nouveau mail à la liste existante
                this.mailSubject.next([...currentMails, mail]);
              
                } else {
                    console.error('mailSubject.value is not an array:', currentMails);
                }
            } catch (error) {
                console.error('Error parsing mail event:', error);
            }
        });
    }, (error: any) => {
        console.error('WebSocket connection error:', error);
    });
}

public disconnect(): void {
  if (this.stompClient) {
    this.stompClient.disconnect(() => {
      this.isConnected = false;
      console.log('Disconnected from WebSocket');
    });
  }
}
  public getMailStatus():Observable<any[]>{
    return this.mailSubject.asObservable();
  }

  loadMailInitial(): void {
    const user = this.token.getUser();
    this.getMails(user.username).subscribe((mails: any[]) => {
      this.mailSubject.next(mails);
    }, (error) => {
      console.error('Error loading initial mails:', error);
    });
  }

  getMails(username:string): Observable<any[]> {
    
    return this.http.get<any[]>(`/api/mail/user/${username}`, {});
  }

  disableMail(id: number): Observable<any> {
   
    let url=`/api/mail/disable/${id}`
  
    return this.http.patch<any>(url, {});
  }
}
