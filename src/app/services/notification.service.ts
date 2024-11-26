import { Injectable } from '@angular/core';
import { TokenStorageService } from './token-storage.service';
import { Client,  Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Notification } from '../model/notification';
import { BehaviorSubject, Observable, Subject, catchError, tap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private connectedPromise: Promise<void>;
  stompClient:any;
  private privateNotifications: Subject<any> = new Subject<any>();
  private notificationsSubject: BehaviorSubject<Notification[]> = new BehaviorSubject<Notification[]>([]);
  public notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable();
 

  constructor(private token :TokenStorageService,private http: HttpClient) { 
    this.initializeWebSocketConnection();
    this.connect();
  }

  private initializeWebSocketConnection() {
    const socket = new SockJS('/api/chat-socket'); // Remplacez par votre endpoint WebSocket
    this.stompClient = Stomp.over(socket);

    this.connectedPromise = new Promise((resolve, reject) => {
      this.stompClient.onConnect = () => {
       
        resolve();
      };

      this.stompClient.onDisconnect = () => {
      
        console.log('Disconnected from WebSocket');
      };

      this.stompClient.onStompError = (frame:any) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
        reject(frame);
      };

      this.stompClient.activate();
    });
  }

  connect(): void {
    const user = this.token.getUser();
    this.connectedPromise.then(() => {
      console.log('Connected to WebSocket');
  
      this.stompClient.subscribe(`/user/${user.username}/queue/specific`, (message: any) => {
        console.log('Private message received: ', message.body);

        this.privateNotifications.next(JSON.parse(message.body));
      });
    }).catch((error) => {
      console.error('STOMP connection error:', error);
    });
  }
  public getPrivateNotification(): Observable<any> {
    return this.privateNotifications.asObservable();
  }

  onSendNotification(notif:Notification)
  { 
    this.stompClient.send("/app/specific",{}, JSON.stringify(notif));
    console.log(notif);
  }
  getUnreadCount(username: string): Observable<number> {

    let url =`/api/notification/unread-count/${username}`;
    return this.http.get<number>(url);
  }
  getNotificationsForUser(username:any){
    const url = `/api/notification/user/${username}`;
  return this.http.get<any[]>(url).pipe(
    tap((data) => 
        this.notificationsSubject.next(data),
      error => console.error('Error loading notifications', error)
    ));
  
}

  public markNotificationsAsRead(username: string): Observable<any> {
    let url =`/api/notification/markAsRead/${username}`;
    return this.http.put(url, {});
  }

  deleteNotification(id: number): Observable<void> {
     let url =`/api/notification/delete/${id}`;
     return this.http.delete<void>(url).pipe(
      tap(() => {
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.filter(not => not.id !== id);
        this.notificationsSubject.next(updatedNotifications);
      })
    );
  }

  disableNotification(notificationId: number): Observable<any> {
    return this.http.put(`/api/notification/disable/${notificationId}`, {});
  }


  updateNotification(id: number, notification: Notification): Observable<Notification> {
    const url = `/api/notification/update/${id}`;
    return this.http.put<Notification>(url, notification);
  }

  findByIdNotification(id:number):Observable<any>{
    const url = `/api/notification/findById/${id}`;
    return this.http.get<any>(url);

  }
 
 
  }



