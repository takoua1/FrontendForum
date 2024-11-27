import { Injectable } from '@angular/core';
import { Stomp } from '@stomp/stompjs';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import SockJS from 'sockjs-client';
import { TokenStorageService } from './token-storage.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class MessageMailService {
  private stompClient: any;
  private mailSubject:  BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  private connectedPromise: Promise<void>;
  private isConnected = false;
  private apiUrl = environment.apiUrl;
  private unTraitesCount = new BehaviorSubject<number>(0);
  constructor(private token :TokenStorageService,private http :HttpClient) {
    this.loadMailInitial();
    this.initializeWebSocketConnection();

   }


   private initializeWebSocketConnection(): void {
    const socket = new SockJS(`${this.apiUrl}/ws-mail`);
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
                const updatedMails = [...this.mailSubject.value];
             
                console.log(' updatedMails is :', );
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


getUnTraitesCount(): Observable<number> {
  return this.unTraitesCount.asObservable();
}
updateUnTraitesCount(mailes: any[]): void {
  const count = mailes.filter(mail => !mail.read).length;
  this.unTraitesCount.next(count);
}
  public getMailStatus():Observable<any[]>{
    return this.mailSubject.asObservable();
  }
  markMessageAsRead(messageId: number): Observable<void> {
    const url = `${this.apiUrl}/mail/markAsRead/${messageId}`;
    
      return this.http.patch<void>(url, {});
    }
  loadMailInitial(): void {
    const user = this.token.getUser();
    this.getMails(user.username).subscribe((mails: any[]) => {
      this.mailSubject.next(mails);
      this.updateUnTraitesCount(mails);
    }, (error) => {
      console.error('Error loading initial mails:', error);
    });
  }

  getMails(username:string): Observable<any[]> {
    
    return this.http.get<any[]>(`${this.apiUrl}/mail/user/${username}`, {});
  }

  disableMail(id: number): Observable<any> {
   
    let url=`${this.apiUrl}/mail/disable/${id}`
  
    return this.http.patch<any>(url, {});
  }
}
