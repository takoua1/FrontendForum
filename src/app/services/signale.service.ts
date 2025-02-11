import { Injectable } from '@angular/core';
import { Stomp } from '@stomp/stompjs';
import { Observable } from 'rxjs';
import SockJS from 'sockjs-client';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class SignaleService {
  private stompClient: any;
  private isConnected = false;
  private apiUrl = environment.apiUrl;
  constructor() { this.initializeWebSocketConnection()}


  private initializeWebSocketConnection(): void {
    const socket = new SockJS(`${this.apiUrl}/ws-signale`);
    this.stompClient = Stomp.over(socket);

    this.stompClient.connect({}, (frame:any) => {
      this.isConnected = true;
      console.log('Connected:', frame);
    }, (error:any) => {
      console.error('Connection error:', error);
      this.isConnected = false;
    });
  }

  public sendSignale(signale: any){
 
      this.stompClient.send('/app/signale', {}, JSON.stringify(signale));
  
  }

}
