import { Injectable } from '@angular/core';
import { Client,  Stomp, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Chat } from '../model/chat';
import { TokenStorageService } from './token-storage.service';
import { User } from '../model/user';
import { Message } from '../model/message';
import { BehaviorSubject, catchError, map, Observable, of, Subject, Subscriber, tap, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChatNotification } from '../model/chat-notification';
import { Groupe } from '../model/groupe';
import { GroupService } from './group.service';
import { UserService } from './user.service';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
 private stompClient: any;
 private apiUrl = environment.apiUrl;
  private socket: any;
  private activeChatUserId = new BehaviorSubject<number | null>(null);
  activeChatUserId$ = this.activeChatUserId.asObservable();
   private activeViewChat=new BehaviorSubject<boolean | false>(false);
   activeViewChat$=this.activeViewChat.asObservable();
   private privateMessages: Subject<any> = new Subject<any>();
   private groupMessages: { [groupId: number]: Subject<any> } = {};
   user:User;
 private  currentMessage :Subject<any> = new Subject<any>();
   private chatListUpdatedSource = new Subject<void>();
   private userBlockedSubject: Subject<any> = new Subject();
  
   chatListUpdated$ = this.chatListUpdatedSource.asObservable();
   typingUsers: string[] = [];
   private isConnected = false;
   private currentGroupId = new BehaviorSubject<number | null>(null);
   private connectedPromise: Promise<void>;
   private privateMessageViewStatus: Subject<any> = new Subject();
   private typingStatus = new BehaviorSubject<any>(null);
   public groupTypingStatus: { [key: number]: Subject<any> } = {};

   private viewedMessages: Set<number> = new Set<number>();
   private viewStatusSubject = new Subject<any>();
   private activeUsersSubject = new BehaviorSubject<Set<string>>(new Set());
   private messageDeletedSource = new Subject<number>();
  messageDeleted$ = this.messageDeletedSource.asObservable();
  private chatDeletedSource = new Subject<number>();
  chatDeleted$ = this.chatDeletedSource.asObservable();
  private groupDeletedSource = new Subject<number>();
  groupDeleted$ = this.groupDeletedSource.asObservable();
  private groupBlockSource = new Subject<number>();
  groupBlock$ = this.groupBlockSource.asObservable();
  private memberDeleteSource = new Subject<number>();
  memberDelete$ = this.memberDeleteSource.asObservable();
  private memberAdminSource = new Subject<number>();
  adminGet$ = this.memberAdminSource.asObservable();
  private updateGroupeSource = new Subject<number>();
  updateGroupe$ = this.updateGroupeSource.asObservable();
  private groupUnblockSource = new Subject<number>();
  groupUnblock$ = this.groupUnblockSource.asObservable();
  private messageSentSource = new Subject<void>();
messageSent$ = this.messageSentSource.asObservable();
private unreadCounts = new BehaviorSubject<{ [chatId: string]: number }>({});
unreadCounts$ = this.unreadCounts.asObservable();
private unreadCountSubject = new Subject<number>();
   constructor(private userService :UserService,private http: HttpClient,private token :TokenStorageService,private groupService:GroupService) {
    const username = this.token.getUser().username;
       
         
   
 this.initializeWebSocketConnection();
   this.connect();
  }


 
  initializeWebSocketConnection() {
    if (this.stompClient && this.isConnected) {
      return; // Empêche la réinitialisation d'une connexion existante
    }
    
    const socket = new SockJS(`${this.apiUrl}/chat-socket`);
    this.stompClient = Stomp.over(socket);
  
    this.connectedPromise = new Promise((resolve, reject) => {
      this.stompClient.connect({}, (frame:any) => {
        this.isConnected = true;
        console.log('WebSocket connecté', frame);
        resolve(); // La promesse est résolue une fois la connexion établie
      }, (error:any) => {
        console.error('Erreur de connexion WebSocket', error);
        this.isConnected = false;
        reject(error); // Si la connexion échoue, rejeter la promesse
      });
  
      // Gestion de la déconnexion
      this.stompClient.onDisconnect = () => {
        this.isConnected = false;
        console.log('Déconnecté du WebSocket');
      };
  
      // Gestion des erreurs STOMP
      this.stompClient.onStompError = (frame: any) => {
        console.error('Erreur du courtier STOMP: ' + frame.headers['message']);
        console.error('Détails supplémentaires: ' + frame.body);
        reject(frame); // Rejeter la promesse en cas d'erreur
      };
    });
  }
  

  connect(): void {
    const user = this.token.getUser();
    this.connectedPromise.then(() => {
      console.log('Connected to WebSocket');
  
      // Abonnement aux messages privés
      this.stompClient.subscribe(`/user/${user.username}/queue/messages`, (message: any) => {
        try {
          const parsedMessage = JSON.parse(message.body);
          if (parsedMessage) {
            if (parsedMessage) {
              console.log('Émission de message:', parsedMessage); // Ajoutez ceci pour déboguer
              this.privateMessages.next(parsedMessage);
              this.triggerChatListUpdated()
              this.getUnreadTotal(parsedMessage.recipientUsername).subscribe((total) => {
                this.emitUnreadCountChange(total);
              });
              console.log('Private message received:', parsedMessage);
          }
         
           
          }
          
        } catch (error) {
          console.error('Error parsing private message:', error);
        }
      });
  
      // Abonnement aux événements de frappe
      this.stompClient.subscribe(`/user/${user.username}/queue/typing`, (typingEvent: any) => {
        try {
          console.log('Typing event received:', typingEvent.body);
      
          const typingStatus = JSON.parse(typingEvent.body);
      
          if (typingStatus && typingStatus.hasOwnProperty('typing')) {
            this.typingStatus.next({
              senderId: typingStatus.senderId,
              recipientId: typingStatus.recipientId,
              isTyping: typingStatus.typing // Utiliser 'typing' au lieu de 'isTyping'
            });
          }
        } catch (error) {
          console.error('Error parsing typing event:', error);
        }
      });
  
      // Abonnement aux événements de vue
    /*  this.stompClient.subscribe(`/user/${user.username}/queue/viewMessage`, (viewEvent: any) => {
        try {
          console.log('View status received:', viewEvent.body);
          const viewStatus = JSON.parse(viewEvent.body);
          
          this.viewStatusSubject.next(viewEvent);
         /* if (viewStatus && viewStatus.hasOwnProperty('messageId')) {
            this.viewedMessages.add(viewStatus.messageId);
          }
        } catch (error) {
          console.error('Error parsing view status:', error);
        }
      }); */
      this.stompClient.subscribe('/topic/message-deleted', (message: any) => {
        try {
          const deletedMessageId = JSON.parse(message.body);
          console.log('Message supprimé reçu:', deletedMessageId);
          this.messageDeletedSource.next(deletedMessageId); // Émettre l'ID du message supprimé
        } catch (error) {
          console.error('Erreur lors de l\'analyse de l\'événement de message supprimé:', error);
        }
      });
      this.stompClient.subscribe('/topic/chat-deleted', (message: any) => {
        try {
          const deletedChatId = JSON.parse(message.body);
          console.log('Chat supprimé reçu:', deletedChatId);
          this.chatDeletedSource.next(deletedChatId); // Émettre l'ID du message supprimé
        } catch (error) {
          console.error('Erreur lors de l\'analyse de l\'événement de chat supprimé:', error);
        }
      });
      this.stompClient.subscribe('/topic/group-deleted', (message: any) => {
        try {
          const deletedGroupId = JSON.parse(message.body);
          console.log('Groupe supprimé reçu:', deletedGroupId);
          this.groupDeletedSource.next(deletedGroupId); // Émettre l'ID du message supprimé
        } catch (error) {
          console.error('Erreur lors de l\'analyse de l\'événement de group supprimé:', error);
        }
      });
      this.stompClient.subscribe('/topic/group-exit', (message: any) => {
        try {
          const deletedGroupId = JSON.parse(message.body);
          console.log('Groupe supprimé reçu:', deletedGroupId);
          this.groupDeletedSource.next(deletedGroupId); // Émettre l'ID du message supprimé
        } catch (error) {
          console.error('Erreur lors de l\'analyse de l\'événement de group supprimé:', error);
        }
      });
      
      this.stompClient.subscribe('/topic/group-block', (message: any) => {
        try {
          const blockGroupId = JSON.parse(message.body);
          console.log('Membre groupe blokqué reçu:', blockGroupId);
          this.groupBlockSource.next(blockGroupId); // Émettre l'ID du message supprimé
        } catch (error) {
          console.error('Erreur lors de l\'analyse de l\'événement de membre de  group bloqué:', error);
        }
      });
      this.stompClient.subscribe('/topic/group-unblock', (message: any) => {
        try {
          const unblockGroupId = JSON.parse(message.body);
          console.log('Groupe supprimé reçu:', unblockGroupId);
          this.groupUnblockSource.next(unblockGroupId); // Émettre l'ID du message supprimé
        } catch (error) {
          console.error('Erreur lors de l\'analyse de l\'événement de group supprimé:', error);
        }
      });
      this.stompClient.subscribe('/topic/group-member-delete', (message: any) => {
        try {
          const memberDeleteId = JSON.parse(message.body);
          console.log('Groupe supprimé reçu:',  memberDeleteId);
          this.memberDeleteSource.next( memberDeleteId); // Émettre l'ID du message supprimé
        } catch (error) {
          console.error('Erreur lors de l\'analyse de l\'événement de group supprimé:', error);
        }
      });
      this.stompClient.subscribe('/topic/group-getAdmin', (message: any) => {
        try {
          const getAdmin = JSON.parse(message.body);
          console.log('memebre soit admin reçu:',  getAdmin);
          this.memberAdminSource.next(getAdmin); 
        } catch (error) {
          console.error('Erreur lors de l\'analyse de l\'événement de membre soit admin:', error);
        }
      });
      this.stompClient.subscribe('/topic/group-update', (message: any) => {
        try {
          const updateGroupe = JSON.parse(message.body);
          console.log(' update avec sucées:',  updateGroupe);
          this.updateGroupeSource.next(updateGroupe); 
        } catch (error) {
          console.error('Erreur lors de l\'analyse de l\'événement de update:', error);
        }
      });
    }).catch((error) => {
      console.error('STOMP connection error:', error);
    });
   
  }

  getViewedMessages() {
    return this.viewedMessages;
  }
  sendTypingEvent(recipientId: string, Typing:boolean) {
     const user = this.token.getUser(); // L'utilisateur actuel

    const typingEvent = {
      senderId:  user.username, // L'utilisateur actuel
      recipientId: recipientId,             // L'utilisateur destinataire
      typing: Typing
    };
  
    this.stompClient.send(`/app/typing/${recipientId}`, {}, JSON.stringify(typingEvent));
  }
  public sendPrivateViewStatus(username: string, recipient: string, messageId: number) {
    const viewStatus = { username, messageId };
    this.stompClient.send(`/app/view/${recipient}`, {}, JSON.stringify(viewStatus));
  }
  onViewStatusReceived() {
    return this.viewStatusSubject.asObservable();
  }
  public getPrivateViewStatus(): Observable<any> {
    return this.privateMessageViewStatus.asObservable();
  }
  getTypingStatus() {
    return this.typingStatus.asObservable();
  }
    public getPrivateMessages(): Observable<any> {
      return this.privateMessages.asObservable();
    }
    public getGroupMessages(groupId: number): Observable<any> {
      if (!this.groupMessages[groupId]) {
        this.groupMessages[groupId] = new Subject<any>();
      }
      return this.groupMessages[groupId].asObservable();
    }
    public subscribeToGroupMessages(groupId: number) {
      this.initializeWebSocketConnection();
      if (!this.groupMessages[groupId]) {
          this.groupMessages[groupId] = new Subject<any>(); // Initialize if not present
      }
     
      
          // Abonnement aux messages du groupe
          this.stompClient.subscribe(`/topic/group/${groupId}`, (message: any) => {
              const parsedMessage = JSON.parse(message.body);
              if (parsedMessage.groupId === groupId.toString()) {
                  this.groupMessages[groupId].next(parsedMessage);
                this.groupService.triggerGroupeListUpdated();
              }
           
          });
  
      
      
          this.stompClient.subscribe(`/topic/typing/${groupId}`, (typingEvent: any) => {
            const typingStatus = JSON.parse(typingEvent.body);
            console.log('Typing event received:', typingStatus);
      
            if (typingStatus && typingStatus.hasOwnProperty('typing')) {
              if (!this.groupTypingStatus[groupId]) {
                this.groupTypingStatus[groupId] = new Subject();
              }
              this.groupTypingStatus[groupId].next(typingStatus);
            } else {
              console.error('Invalid typing status data received:', typingStatus);
            }
          });
        }

        public subscribeToAllGroupMessages(groups: any[]) {
          if (!this.isConnected) {
            const user = this.token.getUser();
            console.log('Connexion WebSocket non établie. Tentative de réinitialisation...');
            // Attendre la résolution de la promesse de connexion avant de souscrire
            this.connectedPromise.then(() => {
              groups.forEach((groupe) => {
              
                this.stompClient.subscribe(`/topic/group/${groupe.id}`, (message: any) => {
                  console.log('Message reçu pour le groupe', groupe.id, message);
                  const parsedMessage = JSON.parse(message.body);
                  if (!this.groupMessages[groupe.id]) {
                    this.groupMessages[groupe.id] = new Subject<any>();
                  }
                  this.groupMessages[groupe.id].next(parsedMessage);
        
                    this.groupService.triggerGroupeListUpdated();
                    this.getUnreadTotal(user.username).subscribe((total) => {
                      this.emitUnreadCountChange(total);
                    });
                 
                });
                console.log(`Abonnement aux messages du groupe ${groupe.id}`);
        
                // Abonnement au statut de typing pour chaque groupe
                this.stompClient.subscribe(`/topic/typing/${groupe.id}`, (typingEvent: any) => {
                  const typingStatus = JSON.parse(typingEvent.body);
                  console.log('Event de typing reçu pour le groupe', groupe.id, typingStatus);
        
                  if (typingStatus && typingStatus.hasOwnProperty('typing')) {
                    // Gérer l'affichage de l'indicateur de typing
                    if (typingStatus.typing) {
                      this.showTypingIndicator(groupe.id);
                    } else {
                      this.hideTypingIndicator(groupe.id);
                    }
                  } else {
                    console.error('Données de statut de typing invalides reçues:', typingStatus);
                  }
                });
                console.log(`Abonnement au typing pour le groupe ${groupe.id}`);
              });
            }).catch((error) => {
              console.error('Impossible de se connecter au WebSocket', error);
            });
          } else {
            // Si déjà connecté, souscrire directement à chaque groupe
            groups.forEach((groupe) => {
              // Abonnement aux messages du groupe
              this.stompClient.subscribe(`/topic/group/${groupe.id}`, (message: any) => {
                console.log('Message reçu pour le groupe', groupe.id, message);
              });
              console.log(`Abonnement aux messages du groupe ${groupe.id}`);
        
              // Abonnement au statut de typing pour chaque groupe
              this.stompClient.subscribe(`/topic/typing/${groupe.id}`, (typingEvent: any) => {
                const typingStatus = JSON.parse(typingEvent.body);
                console.log('Event de typing reçu pour le groupe', groupe.id, typingStatus);
        
                if (typingStatus && typingStatus.hasOwnProperty('typing')) {
                  // Gérer l'affichage de l'indicateur de typing
                  if (typingStatus.typing) {
                    this.showTypingIndicator(groupe.id);
                  } else {
                    this.hideTypingIndicator(groupe.id);
                  }
                } else {
                  console.error('Données de statut de typing invalides reçues:', typingStatus);
                }
              });
              console.log(`Abonnement au typing pour le groupe ${groupe.id}`);
            });
          }
        }
        
        showTypingIndicator(groupId: number) {
          // Logique pour afficher un indicateur de typing pour un groupe donné
          console.log(`Afficher l’indicateur de typing pour le groupe ${groupId}`);
        }
        
        hideTypingIndicator(groupId: number) {
          // Logique pour cacher l’indicateur de typing pour un groupe donné
          console.log(`Cacher l’indicateur de typing pour le groupe ${groupId}`);
        }
        

  updateTypingStatus(username: string, isTyping: boolean): void {
    if (isTyping) {
        if (!this.typingUsers.includes(username)) {
            this.typingUsers.push(username);
        }
    } else {
        this.typingUsers = this.typingUsers.filter(user => user !== username);
    }
}
sendGroupTypingStatus(groupId: number, username: string ,image:string, typingStatus: boolean) {
  if (this.isConnected) {
    const typingEvent = {
      username: username,
      image:image,
      groupId: groupId.toString(),
      typing: typingStatus,
     
    };
    this.stompClient.send(`/app/typingGroup/${groupId}/${username}`, {}, JSON.stringify(typingEvent));
  } else {
    console.error('No WebSocket connection');
  }
}

getGroupTypingStatus(groupId: number): Observable<any> {
  if (!this.groupTypingStatus[groupId]) {
    this.groupTypingStatus[groupId] = new Subject<any>();
  }
  return this.groupTypingStatus[groupId].asObservable();
}

    userJoinedChat(chatId: number, username: string) {
      if (this.stompClient && this.stompClient.connected) {
        this.stompClient.send(`/app/chat/${chatId}/user/${username}/join`, {}, JSON.stringify({}));
      } else {
        console.error('STOMP client is not connected');
      }
    }
  
    userLeftChat() {
      const user= this.token.getUser();
      if (this.stompClient && this.stompClient.connected) {
        this.stompClient.send(`/app/chat/user/${user.username}/leave`, {}, JSON.stringify({}));
      } else {
        console.error('STOMP client is not connected');
      }
    }
  
    isUserActiveInChat(chatId: number): Observable<Set<string>> {
      return new Observable<Set<string>>(observer => {
        if (this.stompClient && this.stompClient.connected) {
          const activeUserQueue = `/user/queue/active`;
          const subscription = this.stompClient.subscribe(activeUserQueue, (message: any) => {
            observer.next(new Set(JSON.parse(message.body)));
            observer.complete();
            subscription.unsubscribe();
          });
  
          this.stompClient.send(`/app/chat/${chatId}/user/active`, {}, JSON.stringify({}));
        } else {
          console.error('STOMP client is not connected');
          observer.error('STOMP client is not connected');
        }
      });
    }
    ngOnDestroy() {
      if (this.stompClient && this.stompClient.connected) {
        this.stompClient.deactivate();
      }
    }
    triggerChatListUpdated(): void {
      this.chatListUpdatedSource.next();
    }
   

   
    initiateChat( profileId: number, actif:boolean) {
      this.activeChatUserId.next(profileId);
      this.activeViewChat.next(actif);
    }
    uploadFile(file:File) {
      return new Promise((resolve, reject) => {
          const formData = new FormData();
          formData.append('file', file, file.name);
  
          fetch(`${this.apiUrl}/chat/upload`, {
              method: 'POST',
              body: formData
          })
          .then(response => response.json())
          .then(data => resolve(data.fileUrl))
          .catch(error => reject(error));
      });
  }
 async sendMessage(message: Message, msg: any, file: File | null, audioBlob:Blob | null,audioUrl:string) : Promise<void>{
   
    const formData: FormData = new FormData();
    let fileType: string = '';
  
    if (file !== null) {
        console.log("file non vide ", file);
        
        formData.append('file', file, file.name);
        if (file.type.startsWith('image/')) {
            fileType = 'image';
            console.log('Ceci est une image:', file.name);
        } else if (file.type.startsWith('video/')) {
            fileType = 'video';
            console.log('Ceci est une vidéo:', file.name);
        }
        

        // Envoie le fichier séparément via HTTP
        fetch(`${this.apiUrl}/chat/upload`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            const fileUrl = data.fileUrl; // Assurez-vous que l'API renvoie l'URL du fichier
            const payload = JSON.stringify({message: message,groupe: null, fileUrl, fileType });

      
            this.stompClient.send("/app/send", {}, payload);
             
            console.log('msg', msg);
            
           
        })
        .catch(error => {
            console.error('Erreur lors du téléchargement du fichier:', error);
        });

    }  else if (audioUrl !== ''&& audioBlob!==null) {
    

      console.log('audio url', audioUrl,'audioBob',audioBlob);
      formData.append('file', audioBlob, 'audio.ogg');
     

      fetch(`${this.apiUrl}/chat/upload`, {
          method: 'POST',
          body: formData
      })
      .then(response => response.json())
      .then(data => {
          const fileUrl = data.fileUrl; // Assurez-vous que l'API renvoie l'URL du fichier audio
          const payload = JSON.stringify({message: message,groupe: null, fileUrl, fileType: 'audio' });

        
          this.stompClient.send("/app/send", {}, payload);
          
         
         
      })
      .catch(error => {
          console.error("Erreur lors du téléchargement de l'audio:", error);
      });
  }
     else {
        console.log("file vide", file);
        const payload= {message: message,groupe: null,
          fileUrl: null,
          fileType: null,
           
      };
    
     
        this.stompClient.send("/app/send", {}, JSON.stringify(payload));
       
      
        }
    
    
    
}

sendGroup(message: Message, groupe:Groupe ,msg: any, file: File | null, audioBlob:Blob | null,audioUrl:string)
{

  const formData: FormData = new FormData();
  let fileType: string = '';

  if (file !== null) {
      console.log("file non vide ", file);
      
      formData.append('file', file, file.name);
      if (file.type.startsWith('image/')) {
          fileType = 'image';
          console.log('Ceci est une image:', file.name);
      } else if (file.type.startsWith('video/')) {
          fileType = 'video';
          console.log('Ceci est une vidéo:', file.name);
      }
      

      // Envoie le fichier séparément via HTTP
      fetch(`${this.apiUrl}/chat/upload`, {
          method: 'POST',
          body: formData
      })
      .then(response => response.json())
      .then(data => {
          const fileUrl = data.fileUrl; // Assurez-vous que l'API renvoie l'URL du fichier
          const payload = JSON.stringify({message: message,
            groupe: groupe,fileUrl: fileUrl,  fileType:fileType });
            
        
          this.stompClient.send(`/app/sendGroup/${groupe.id}`, {}, payload);
         
       
    
      })
      .catch(error => {
          console.error('Erreur lors du téléchargement du fichier:', error);
      });

  }  else if (audioUrl !== ''&& audioBlob!==null) {
  

    console.log('audio url', audioUrl,'audioBob',audioBlob);
    formData.append('file', audioBlob, 'audio.ogg');

    fetch(`${this.apiUrl}/chat/upload`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const fileUrl = data.fileUrl; // Assurez-vous que l'API renvoie l'URL du fichier audio
        const payload = JSON.stringify({message: message,
          groupe: groupe, fileUrl, fileType: 'audio' });

        // Envoie le message via WebSocket avec l'URL du fichier audio
        this.stompClient.send(`/app/sendGroup/${groupe.id}`, {}, payload);
        console.log('msg', msg);
      
    })
    .catch(error => {
        console.error("Erreur lors du téléchargement de l'audio:", error);
    });
}
   else {
      console.log("file vide", file);


  const payload=JSON.stringify({ message: message,
    groupe: groupe,
    fileUrl: null,
    fileType: null});
    
        this.stompClient.send(`/app/sendGroup/${groupe.id}`, {},payload );}
        
        
 
}
 
  getMessagePush(): Observable<any>{
    console.log('getMessagePush called');
   return  this.currentMessage.asObservable();
  }
 
 
  findAllChat(): Observable<any> {
  {
   const url=`${this.apiUrl}/chat/chats`;
   return this.http.get<any[]>(url);

  }
  
}
getChatsForMember(userId:number):Observable<any[]>{
  let headers = new HttpHeaders({'Content-Type': 'application/json', Authorization:'Bearer '+ this.token.getToken() })
  console.log("this.token.getToken()",this.token.getToken());
  const url=`${this.apiUrl}/chat/member/${userId}`;
  return this.http.get<any[]>(url,{headers:headers});
}
getChatMembers(chatId:number):Observable<any>
{
  const url =`${this.apiUrl}/chat/members/${chatId}`;
  return this.http.get<any[]>(url);
}
getChatMessages(chatId:number):Observable<any>{
  const url =`${this.apiUrl}/chat/messages/${chatId}`;
  return this.http.get<any[]>(url);
}

getCommonChats(memberId1: number, memberId2: number): Observable<any> {
  const url =`${this.apiUrl}/chat/common-chats/${memberId1}/${memberId2}`;
  return this.http.get<any>(url);
}
setCurrentGroupId(groupId: number) {
  this.currentGroupId.next(groupId);
}

getCurrentGroupId(): Observable<number | null> {
  return this.currentGroupId.asObservable();
}
markAllChatMessagesRead(chatId: number): Observable<void> {
 const url =`${this.apiUrl}/chat/chats/mark-all-read/${chatId}`;
  return this.http.patch<void>(url, {});
}

getUnreadMessageCount(chatId: number, username: string): Observable<number> {

  const url =`${this.apiUrl}/chat/unread-count/${chatId}/${username}`;
  return this.http.get<number>(url);
}
getUnreadTotal(username: string): Observable<number> {

  const url =`${this.apiUrl}/chat/unread-total/${username}`;
  return this.http.get<number>(url);
}

emitUnreadCountChange(count: number): void {
  this.unreadCountSubject.next(count);
}

// Obtenir le compteur en temps réel
getUnreadCountUpdates(): Observable<number> {
  return this.unreadCountSubject.asObservable();
}
markMessagesAsRead(chatId: number, username: string): Observable<void> {
  const url =`${this.apiUrl}/chat/messages/mark-read/${chatId}/${username}`;
  return this.http.patch<void>(url, {});
}

connecter() {
  return new Promise<void>((resolve, reject) => {
    this.stompClient.connect({}, () => {
      resolve();
    }, (error:any) => {
      reject(error);
    });
  });
}

subscribe(destination: string, callback: (message: any) => void) {
  this.stompClient.subscribe(destination, callback);
}

send(destination: string, body: any) {
  this.stompClient.send(destination, {}, JSON.stringify(body));
}

deleteMessage(messageId: number): void {
  this.http.delete(`${this.apiUrl}/message/${messageId}`).subscribe({
    next: () => {
      console.log(`Message avec ID ${messageId} supprimé avec succès`);
      this.stompClient.send("/app/delete-message", {}, JSON.stringify({ id: messageId }));
    },
    error: (err) => {
      if (err.status === 404) {
        console.error(`Le message avec l'ID ${messageId} n'a pas été trouvé`);
      } else {
        console.error('Erreur lors de la suppression du message', err);
      }
    }
  });
}
deleteChat(chatId: number): void {
 const url =`${this.apiUrl}/chat/${chatId}`;

   this.http.delete<void>(url).subscribe({
    next: () => {
      console.log(`Chat avec ID ${chatId} supprimé avec succès`);
      this.stompClient.send("/app/chat-deleted", {}, JSON.stringify({ id: chatId }));
    },
    error: (err) => {
      if (err.status === 404) {
        console.error(`Le chat avec l'ID ${chatId} n'a pas été trouvé`);
      } else {
        console.error('Erreur lors de la suppression du chat', err);
      }
    }
  });
}

deleteGroup(groupId: number): void {
  const url =`${this.apiUrl}/groupe/${groupId}`;
 
    this.http.delete<void>(url).subscribe({
     next: () => {
       console.log(`Chat avec ID ${groupId} supprimé avec succès`);
       this.stompClient.send("/app/group-deleted", {}, JSON.stringify({ id: groupId }));
     },
     error: (err) => {
       if (err.status === 404) {
         console.error(`Le groupe avec l'ID ${groupId} n'a pas été trouvé`);
       } else {
         console.error('Erreur lors de la suppression du groupe', err);
       }
     }
   });
 }
 
 quitterGroup(groupId: number, userId: number): void {
  const url = `${this.apiUrl}/groupe/quitter/${groupId}/${userId}`;

  this.http.patch<void>(url, {}).subscribe({
    next: () => {
      console.log(`Groupe avec ID ${groupId} quitté avec succès`);
      this.stompClient.send("/app/group-exit", {}, JSON.stringify({ id: groupId }));
    },
    error: (err) => {
      if (err.status === 404) {
        console.error(`Le groupe avec l'ID ${groupId} n'a pas été trouvé`);
      } else {
        console.error('Erreur lors de quitter le groupe', err);
      }
    }
  });
}
blockMember(groupId: number, username: string): void {
  const url = `${this.apiUrl}/groupe/${groupId}/block/${username}`;
  this.http.patch<void>(url, {}).subscribe({
    next: () => {
      console.log('Membre bloqué avec succès');
      this.stompClient.send("/app/group-block", {}, JSON.stringify({ id: groupId }));
      // Vous pouvez également envoyer un message via STOMP si nécessaire
   
    },
    error: (err) => console.error('Erreur lors du blocage du membre', err)
  });
}


unblockMember(groupId: number, username: string): void {
  const url = `${this.apiUrl}/groupe/${groupId}/unblock/${username}`;
  this.http.patch<void>(url, {}).subscribe({
    next: () => {console.log('Membre débloqué avec succès')

      this.stompClient.send("/app/group-unblock", {}, JSON.stringify({ id: groupId }));
    },
    error: (err) => console.error('Erreur lors du déblocage du membre', err)
  });
}
deleteMember(groupId: number, username: string): void {
  const url = `${this.apiUrl}/groupe/${groupId}/deleteMember/${username}`;
  this.http.patch<void>(url, {}).subscribe({
    next: () => {console.log('Membre supprimé avec succès')

      this.stompClient.send("/app/topic/group-member-delete", {}, JSON.stringify({ id: groupId }));
    },
    error: (err) => console.error('Erreur lors du supprimé du membre', err)
  });
}
getAdmin(groupId: number, username: string): void {
  const url = `${this.apiUrl}/groupe/${groupId}/getAdmin/${username}`;
  this.http.patch<void>(url, {}).subscribe({
    next: () => {console.log('Membre soit avec succès')

      this.stompClient.send("/app/topic/group-getAdmin", {}, JSON.stringify({ id: groupId }));
    },
    error: (err) => console.error('Erreur lors du get member admin', err)
  });
}

updateGroupe(groupeId: number, name:string,category:string, file: File | null): Observable<any> {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('category', category);
  if (file !== null) {
    console.log("file non vide ", file);
     formData.append('file', file, file.name);
  
  }
  else {
    console.log("file vide", file);
   
    formData.append('file', new Blob([]) ,''); // Ajoute une chaîne vide
  }
 
    return this.http.patch(`${this.apiUrl}/groupe/update/${groupeId}`, formData).pipe(
    tap((response: any) => {
      this.stompClient.send("/app/topic/group-update", {}, JSON.stringify({ id: groupeId }));
      console.log("Groupe modifié avec succès", response);
    }),
    catchError(error => {
      console.error('Erreur lors de la modification du groupe:', error);
      return throwError(error);
    })
  );


}

listenForBlock(userId: string): Observable<any> {
  return new Observable<any>((observer: Subscriber<any>) => {
    // Vérifier si la connexion WebSocket est déjà établie
    if (!this.isConnected) {
      // Si la connexion n'est pas établie, essayez de la rétablir ou attendez la connexion
      console.log('WebSocket non connecté. Attente de la connexion...');
      
      // Réessayer la connexion après un délai si non connectée
      const interval = setInterval(() => {
        if (this.isConnected) {
          clearInterval(interval);  // Arrêter de vérifier une fois connecté
          console.log('WebSocket reconnecté. Abonnement...');
          
          // S'abonner au sujet après la connexion
          const subscription = this.stompClient.subscribe(`/topic/user-blocked/${userId}`, (message: any) => {
            if (message.body) {
              observer.next(message.body); // Émettre le message de blocage
            }
          });

          // Nettoyage de l'abonnement lorsque l'observable est détruit
          return;
        }
      }, 500);  // Attendre 500ms entre chaque tentative de connexion
    } else {
      // Si la connexion est déjà établie, abonnez-vous immédiatement
      const subscription = this.stompClient.subscribe(`/topic/user-blocked/${userId}`, (message: any) => {
        if (message.body) {
          observer.next(message.body); // Émettre le message de blocage
        }
      });

      // Nettoyage de l'abonnement lorsque l'observable est détruit
      return () => {
        subscription.unsubscribe();
      };
    }
    return; // Add this line to ensure all paths return a value
  });
}


  
}