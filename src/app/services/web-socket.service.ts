import { Injectable } from '@angular/core';
import { Client,  Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: any;
  private connectedPromise: Promise<void>;
  constructor() {


    this.initializeWebSocketConnection();
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
}
