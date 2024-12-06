import { AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, Renderer2, SimpleChanges, ViewChild } from '@angular/core';
import { Message } from '../../model/message';
import { MessageService } from '../../services/message.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../model/user';
import { ChatService } from '../../services/chat.service';
import { TokenStorageService } from '../../services/token-storage.service';
import { UserService } from '../../services/user.service';
import { Observable, Subscription, catchError, debounceTime, forkJoin, fromEvent, map, of, shareReplay, take, throwError } from 'rxjs';
import { ChatNotification } from '../../model/chat-notification';
import { Groupe } from '../../model/groupe';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GroupService } from '../../services/group.service';
import 'emoji-picker-element';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BlockService } from '../../services/block.service';
import { ChatComponent } from '../../chat/chat.component';
import { AnySoaRecord } from 'dns';


interface EmojiClickEvent extends CustomEvent {
  detail: {
    emoji: string;
  };
}

@Component({
    selector: 'app-message-card',
    templateUrl: './message-card.component.html',
    styleUrl: './message-card.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class MessageCardComponent  implements OnInit, OnDestroy,AfterViewChecked {
  @Input() messages: Message[];
  users:User[];
  membres:any[];
  @Input() user:any;
  @Input ()userProfile:any;
  @Input() userReciver:User[];
  @Input() actifNew:boolean= false;
  @Input() groupe:any;
 @Input() groupes: Groupe[]=[];
  @Input() actifDetail:boolean=false;
  @Input() chat:any;
 @Input ()key:number;
 
 @Input()messagesGroupe:Message[]
  @Output() groupLinkClicked: EventEmitter<Groupe> = new EventEmitter<Groupe>();
  combinedMessages: any[] = [];
  @Input() messagePrivieList: any[] =[];
 @Input() messageGroupList: any[]=[] ;
  subscriptions: Subscription[] = [];
  messageInput: string = '';
  isTyping: boolean = false;
  imageUrl: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  message:  any;
  fileAudio:File | null = null;
  selectedFiles?: FileList;
  fileImage: File | null = null;
  private mediaRecorder: any;
  private chunks: any[] = [];
  public audioUrl: string ;
  isRecording = false; // To track recording state
  recordingTime = 0;   // Time counter
  transcript = '';     // To hold the transcription (speech to text)
  timerInterval: any;  // To hold the timer reference
  showSend =false;
  recognition: any; 
  progress: number = 0;          // Progression en pourcentage
  maxRecordingTime: number = 60;
   isShow:boolean=false;
 @Input() isMember:boolean=false;
  private audioBlob: Blob |null;
  idGroupe:number;
  groupNamesCache: { [key: string]: string } = {};
  privateMessageSubscription: Subscription;
  groupMessageSubscription: Subscription;
  messageSubscription: Subscription;
  isDropdownVisible = true;
 groupId:string|null;
  userTyping: User;
 typing = false;
 id:number;
 @Input() isMemberGroup:boolean;
 typingUsers: any[] = [];
  @ViewChild('messageContainer', { static: false }) messageContainer: ElementRef;
  @ViewChild(ChatComponent) chatComponent: ChatComponent;
  @ViewChild('inputField') inputField: ElementRef;
 
  displayMembres = false;
  displayImages=false;
  displayVideos=false;
  displayVocales=false;
  displayBloques=false;
  membersBloque:any[];
  activeTab: string = 'membres';
   viewedMessages: Set<number> = new Set();
  activeUsers: Set<string> = new Set<string>();
  showEmojiPicker = false;
  typingStatus:any;
  stompClient: any;
  messageId: number | null = null;
  chatId: number | null = null;
  groupeId: number | null = null;
  userId: number | null = null;
  BlouqeId : number | null = null;
  DeblouqeId: number | null = null;
  membGroupId:number | null = null;
  adminGroupId:number | null = null;
  username:string| null= null;
  myGroup: FormGroup;
  selectedCategory = 'Catégorie';
  categorySelected: boolean = false;



  nameGroupe:string;
  filteredMembers: any[] = [];

  membresGroupe: any[];
  @Input() filteredMessages :any[];
  filteredBlockedMembers: any[];
  categories = [
    { name: 'Jeux', icon: 'bx bx-game', selected: false },
    { name: 'Education', icon: 'bx bxs-pen', selected: false },
    { name: 'Musique', icon: 'bx bx-music', selected: false },
    { name: 'Politique', icon: 'bx bxs-user-voice', selected: false },
    { name: 'Sport', icon: 'bx bx-football', selected: false },
  ]
  imageGroupe: string | ArrayBuffer | null = null;

  errorMessage :string | null = null;
  errorMesCateg : string |  null = null;
  searchTerm: string = '';
  @ViewChild('overlay') overlay!: ElementRef;
@ViewChild('popupVal', { static: false }) popupVal!: ElementRef;
selectedMessageElement: HTMLElement | null = null;


  constructor(private messageService :MessageService,private chatService :ChatService,
    private token:TokenStorageService,private userService:UserService, private snackBar: MatSnackBar,
    private cdr:ChangeDetectorRef,private sanitizer: DomSanitizer,private blockService:BlockService,
    
    private  groupService:GroupService ,private el: ElementRef, private renderer: Renderer2, private route:ActivatedRoute,private router: Router)
  {

      (window as any).handleGroupLinkClick = this. handleLinkClick.bind(this);

    
    }
   
    
  
    
 async  ngOnInit() {
   

 
  this.scrollToBottom();
 
  this.chatService.connecter().then(() => {
    // Abonnez-vous aux événements de vue des messages
    this.chatService.subscribe(`/user/${this.user.username}/queue/view`, (message) => {
      const viewEvent = JSON.parse(message.body);

      // Mettre à jour l'état local du message si trouvé
      const messageToUpdate = this.messageGroupList.find(m => m.id === viewEvent.messageId);
      if (messageToUpdate) {
        messageToUpdate.read = viewEvent.viewed;
        //this.chatService.triggerChatListUpdated()
      }
    });
  });

  console.log("this.actifNew",this.actifNew);

 this.chatService.getCurrentGroupId().subscribe(groupId => {
  console.log('groupe chat id', groupId);
  if (groupId) {
    this.groupId = groupId.toString();}
    this.subscribeToGroupMessages(groupId!);

   this.updateCombinedMessages()
  
    
  
});
this.chatService.getTypingStatus().subscribe((typingStatus) => {
  if (typingStatus && typingStatus.hasOwnProperty('isTyping')) {
    this.typingStatus=typingStatus;
    if (typingStatus.senderId === this.userProfile.username) {
     
      this.typing = typingStatus.isTyping;
      console.log("this.typing",this.typing)
    } else {
      this.typing = false; // Si ce n'est pas le destinataire, désactiver la frappe
    }
  } else {
    this.typing = false; // Gérer les cas où il n'y a pas de statut de frappe
  }
});
if (this.groupe) {
  this.membresGroupe = await this.chatService.getChatMembers(this.groupe.chat.id).toPromise();
  this.filteredBlockedMembers = await this.groupe.blockedMembers;
  await this.initializeBlockMembers();
 this.subscribeToTypingStatus(this.groupe.id)
}
this.subscribeToPrivateMessages()

document.addEventListener('click', this.handleOutsideClick.bind(this));
this.chatService.messageDeleted$.subscribe(deletedMessageId => {
 
  console.log(`Suppression d'un message avec ID: ${deletedMessageId}`);
  if(this.messages)
 { this.messages = this.messages.filter(msg => msg.id !== deletedMessageId);}
  if(this.messagesGroupe)
 { this.messagesGroupe = this.messagesGroupe.filter(msg => msg.id !== deletedMessageId);}
  this.messagePrivieList = this.messagePrivieList.filter(msg => msg.id !== deletedMessageId.toString());
  this.combinedMessages= this.combinedMessages.filter(msg => msg.id !== deletedMessageId.toString());
  this.chatService.triggerChatListUpdated()
  console.log('Messages après suppression:', this.messages);
});

this.chatService.chatDeleted$.subscribe(deletedChatId => {
  if (this.chat && this.chat.id === deletedChatId) {
    console.log('Vous avez été bloqué du groupe:', deletedChatId);
    this.groupService.triggerGroupeListUpdated();
    location.reload(); // Recharger seulement si l'utilisateur est dans le groupe bloqué
  } 
})


this.chatService.groupDeleted$.subscribe(deletedGroupId => {
  if (this.groupe && this.groupe.id === deletedGroupId) {
    console.log('Vous avez été bloqué du groupe:', deletedGroupId);
    this.groupService.triggerGroupeListUpdated();
    location.reload();
  } 
})
this.chatService.groupBlock$.subscribe(blockedGroupId => {
  // Actualiser la liste des groupes
  

  if (this.groupe && this.groupe.id === blockedGroupId) {
    console.log('Vous avez été bloqué du groupe:', blockedGroupId);
    this.groupService.triggerGroupeListUpdated();
    //location.reload();
  } 
});

this.chatService.groupUnblock$.subscribe(unblockedGroupId => {
  // Actualiser la liste des groupes
  

  if (this.groupe && this.groupe.id === unblockedGroupId) {
    console.log('Vous avez été débloqué le mmbre du groupe:', unblockedGroupId);
    this.groupService.triggerGroupeListUpdated();
   // location.reload(); 
 
  } 
});
this.chatService.memberDelete$.subscribe(deleteMember => {
  // Actualiser la liste des groupes
  

  if (this.groupe && this.groupe.id === deleteMember) {
    console.log('Vous avez été débloqué le mmbre du groupe:', deleteMember);

   // location.reload(); 

  } 
});

this.chatService.adminGet$.subscribe(getAdmin => {
  // Actualiser la liste des groupes
  

  if (this.groupe && this.groupe.id === getAdmin) {
    console.log('Vous avez été débloqué le mmbre du groupe:', getAdmin);
    setTimeout(()=>{
      this.groupService.triggerGroupeListUpdated();
    
    },500);
    
   // location.reload(); 


  } 
});

this.chatService.updateGroupe$.subscribe(newgroupe => {
  // Actualiser la liste des groupes
  

  if (this.groupe && this.groupe.id === newgroupe) {
    console.log('Vous avez été débloqué le mmbre du groupe:', newgroupe);
    this.groupService.triggerGroupeListUpdated();
   // location.reload(); 
 this.showDetail(this.groupe)
  } 
});

} 


subscribeToTypingStatus(groupId: number): void {
  console.log('Subscribing to typing status for group:', groupId);

  this.chatService.getGroupTypingStatus(groupId).subscribe((typingStatus: any) => {
    console.log('Typing event received:', typingStatus);
  
    if (typingStatus && typingStatus.username) {
      typingStatus.image = typingStatus.image || '/assets/image/user.png'; // Défaut si null
      if (typingStatus.typing) {
        if (!this.typingUsers.some(user => user.username === typingStatus.username)) {
          this.typingUsers.push(typingStatus);
        }
      } else {
        this.typingUsers = this.typingUsers.filter(user => user.username !== typingStatus.username);
      }
  
      console.log('Updated typing users:', this.typingUsers);
      this.cdr.detectChanges();
    }
  });
}

ngAfterViewChecked() {
  this.addGroupLinkClickListeners();
  this.cdr.markForCheck(); 
}


updateCombinedMessages() {
  this.combinedMessages = this.getCombinedMessages();
}

getCombinedMessages() {
  if (!Array.isArray(this.messagesGroupe)) {
    return []; // Retourner un tableau vide si `this.messages` n'est pas un tableau
  }
  
   const combinedMessages = [...this.messagesGroupe];
  this.messageGroupList.forEach((item) => {
    if (!combinedMessages.some(m => m.id === item.id)) {
      combinedMessages.push(item);
      
    }
  });

  
  

  return combinedMessages;
}
 
  

ngOnDestroy(): void {
  if (this.privateMessageSubscription) {
    this.privateMessageSubscription.unsubscribe();
  }

  if (this.groupMessageSubscription) {
    this.groupMessageSubscription.unsubscribe();
  }
  document.removeEventListener('click', this.handleOutsideClick.bind(this));
}

 /* ngOnChanges(changes: SimpleChanges): void {
   if (changes.messages && changes.messages.currentValue) {
      console.log('User chat',this.userProfile);
      console.log("New messages received:", this.messages);
  
      // Créez un tableau temporaire pour stocker les messages reçus
      let tempMessages = [...this.messages];
  
      // Utilisez map pour transformer les messages et initialiser les utilisateurs
      tempMessages = tempMessages.map(message => {
        return {
         ...message,
          users: [] // Initialisation d'un tableau vide pour stocker les utilisateurs
        };
      });
  
      // Accumulez les utilisateurs dans le tableau temporaire
      this.messages.forEach(async message => {
        const users = await this.messageService.getChatMembers(message.id).toPromise();
        tempMessages = tempMessages.map(message => {
        
          return {
           ...message,
            users: [] // Assurez-vous que ceci est assigné à un tableau vide par défaut
          };
          
        });
        console.log("receivers", this.userProfile);
      });
  
      // Attendre que toutes les promesses soient résolues
      Promise.all(tempMessages.map(message => 
        this.messageService.getChatMembers(message.id).toPromise()
      )).then(usersArrays => {
        // Mettre à jour la liste principale des messages avec les utilisateurs
        this.messages = tempMessages.map(message => ({
         ...message,
      users: usersArrays.find(array => array.length > 0)[0] // Sélectionner le premier ensemble d'utilisateurs non vide
        }));
       
       
       
      }).catch(error => {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
      });
   this.scrollToBottom();
    }
 
   
    
  }*/
 
  
  
    subscribeToPrivateMessages() {
      this.privateMessageSubscription = this.chatService.getPrivateMessages().subscribe(
        (message) => {
          console.log('Private message received: ', message);
          if (message) {
           
          
              this.messagePrivieList.push(message);
         
          this.chatService.triggerChatListUpdated()
           
        }
            
        },
        (error) => {
          console.error('Error receiving private message:', error);
        }
      );
    
      this.scrollToBottom();
    }
  
  
  
  async subscribeToGroupMessages(groupId: number) {
   /*  this.groupId= groupId.toString();
     this.userProfile=null;
     this.chatService.subscribeToGroupMessages(groupId);
      if (this.groupMessageSubscription) {
        this.groupMessageSubscription.unsubscribe();
       
      }*/
     this.groupMessageSubscription=this.chatService.getGroupMessages(groupId).subscribe(async(message) => {
    if (message) {
      console.log("message groupe", message);
      console.log("id groupe", this.groupId);
      console.log("id chat groupe", this.groupe.chat.id);
      
     this.messageGroupList.push(message);
    
     const isBlocked = await this.blockService.isUserBlockedByUsername(this.user.username, message.senderUsername).toPromise();
     
    // Si l'expéditeur est bloqué, supprimer le message de la liste
    if (isBlocked) {
      this.messageGroupList = this.messageGroupList.filter(msg => msg.senderUsername !== message.senderUsername);
    }
    
     
    
    }
  
    this.updateCombinedMessages();
    this.scrollToBottom();
    
  })
  
    }
  
   
  
 typingHandler() {
    this.isTyping = true; // Marquer comme étant en train d'écrire
  }

  clearTypingIndicator() {
    this.isTyping = false;
  }
  async sendMessage() {
    try {
      const username = this.token.getUser().username;
    this.user = await this.userService.findByUsername(username).toPromise();
  
      if (!this.user) {
        throw new Error('User not found');
      }
      
      const message = new Message();
      message.sender = this.user;
      message.content = this.messageInput;
      
 
      if (this.userProfile) {
        message.receivers = [this.userProfile];
      }
      let msg = new ChatNotification();
      msg.senderId=this.user.id;
      msg.senderUsername = this.user.username;
      msg.senderNom = this.user.nom;
      msg.senderPrenom = this.user.prenom;
      msg.senderEmail = this.user.email;
      msg.imageProfile = this.user.image;
      msg.recipientUsername = this.userProfile.username;
      msg.content = this.messageInput;
   
      
      console.log('Message sent successfully:', message);
        console.log('message image',this.fileImage)
     
    
        
    
     
     
      await this.chatService.sendMessage(message, msg, null, null, '')
  
      
    
        
    
       
        
   
    
    // this.chatService.userJoinedChat(this.chat.id, this.user.username);
     this.resetMessageInput();
      
      console.log("actif new", this.actifNew);
    } catch (error) {
      console.error('Error sending message:', error);
    }
    
}

resetMessageInput() {
  this.messageInput = '';
  this.selectedFile = null;
}
async scrollToBottom(){
  try {
    const messageContainer = document.querySelector('#messageContainer');
    if (messageContainer) {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
  } catch (err) {
    console.error('Scroll to bottom error:', err);
  }
}
 async onFileSelected(event: any) {
  //let file = event.target.files[0];


  this.selectedFiles = event.target.files;
  
  if (this.selectedFiles) {
    let file: File | null = this.selectedFiles.item(0);
    if (file) {

      const reader = new FileReader();

      reader.onload = (e: any) => {
        console.log(e.target.result);
        this.imageUrl = e.target.result;
        if (file.type.startsWith('image/')) {
          // Traiter l'image ici
          console.log('Ceci est une image:', file.name);
        } else if (file.type.startsWith('video/')) {
          // Traiter la vidéo ici
          console.log('Ceci est une vidéo:', file.name);
        }
      
      };

      this.selectedFile = file ? file : null;
      reader.readAsDataURL(file);
      this.fileImage = file;
      const dropText = document.querySelector('.drag-text');
      dropText?.classList.add('active');
      const uploadImage = document.querySelector('.upload-button');
      uploadImage?.classList.add('active');
      const deleteIcone = document?.querySelector('.delete-icon');
      deleteIcone?.classList.add('active');
      const username = this.token.getUser().username;
      this.user = await this.userService.findByUsername(username).toPromise();
    
        if (!this.user) {
          throw new Error('User not found');
        }
    
        const message = new Message();
        message.sender = this.user;
        if (this.userProfile) {
          message.receivers = [this.userProfile];
        }
        message.time = new Date();
        let msg = new ChatNotification();
        msg.senderId = this.user.id;
        msg.senderUsername =this.user.username;
        msg.senderNom=this.user.nom;
        msg.senderPrenom=this.user.prenom;
        msg.senderEmail=this.user.email;
        msg.imageProfile = this.user.image;
        msg.recipientUsername = this.userProfile.username;
        msg.times= new Date().toISOString();
        if (this.selectedFile) {
          const fileReader = new FileReader();
          fileReader.onload = async () => {
          if (file.type.startsWith('image/')) {
              message.image = fileReader.result as string;
            msg.image= fileReader.result as string;
              console.log('Ceci est une image:', file.name);
            } else if (file.type.startsWith('video/')) {
              message.video = fileReader.result as string;
            msg.video= fileReader.result as string;
              console.log('Ceci est une vidéo:', file.name);
            }
           await this.chatService.sendMessage(message, msg,this.selectedFile,null,'');
           
        
            
           
            
          };
          fileReader.readAsDataURL(this.selectedFile);
        }
    }
   
  }
 
 
}

startRecording() {
  // Vérifie si l'enregistrement est déjà en cours
  if (this.isRecording) {
    console.warn("Recording is already in progress.");
    return;
  }

  // Vérification des compatibilités du navigateur
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.start();
        this.isRecording = true;
        this.startTimer();

        this.mediaRecorder.ondataavailable = (event: any) => {
          this.chunks.push(event.data);
        };

        this.mediaRecorder.onstop = () => {
          this.stopTimer();

          // Si des données sont disponibles, crée un fichier audio
          if (this.chunks.length > 0) {
            this.audioBlob = new Blob(this.chunks, { type: 'audio/ogg; codecs=opus' });
            this.chunks = [];
            this.audioUrl = URL.createObjectURL(this.audioBlob);
          } else {
            console.error('Aucun audio enregistré.');
          }

          
        };
      })
      .catch(error => {
        console.error('Error accessing microphone: ', error);
      });
  } else {
    console.error('MediaRecorder is not supported in this browser.');
  }
}


async stopRecording() {
  // Vérifie si un enregistrement est en cours avant de l'arrêter
   this.showSend=true;
    this.mediaRecorder.stop();
    
  
}

startTimer() {
  this.recordingTime = 0;
  this.progress = 0;
  this.timerInterval = setInterval(() => {
    this.recordingTime++;
    this.progress = (this.recordingTime / this.maxRecordingTime) * 100;

    // Arrêter l'enregistrement automatiquement lorsque la limite est atteinte
    if (this.recordingTime >= this.maxRecordingTime) {
      
      this.stopRecording();
      
      clearInterval(this.timerInterval);
    }
  }, 1000);
}

stopTimer() {
  clearInterval(this.timerInterval);
}
async sendAudio() {
  
  const message = new Message();
  message.sender = this.user;
  if (this.userProfile) {
    message.receivers = [this.userProfile];
  }
  message.time=new Date();
  let msg = new ChatNotification();
  msg.senderId = this.user.id;
  msg.senderUsername= this.user.username;
  msg.senderNom=this.user.nom;
  msg.senderPrenom=this.user.prenom;
  msg.senderEmail=this.user.email;
  msg.imageProfile = this.user.image;
  msg.recipientUsername = this.userProfile.username;
  msg.times = new Date().toISOString();
  
  // Assure-toi que `audioBlob` et `audioUrl` sont définis
  if (this.audioBlob) {
    try {
      
      message.audio=this.audioUrl;
      msg.audio=this.audioUrl;
      await this.chatService.sendMessage(message, msg, null, this.audioBlob, this.audioUrl);
     
      
    } catch (error) {
      console.error('Erreur lors de l’envoi du message:', error);
    }
  } else {
    console.error('Audio data is missing or invalid.');
  }
 
  this.audioBlob = null;
  this.isRecording = false;
}
async sendAudioGroup() {
  
  const message = new Message();
  message.sender = this.user;

  message.time=new Date();
  let msg = new ChatNotification();
  msg.senderId=this.user.id;
  msg.senderUsername = this.user.username;
  msg.senderNom=this.user.nom;
  msg.senderPrenom=this.user.prenom;
  msg.senderEmail=this.user.email;
  msg.imageProfile = this.user.image;
  
  msg.times = new Date().toISOString();
  this.idGroupe=this.groupe.id;
  // Assure-toi que `audioBlob` et `audioUrl` sont définis
  if (this.audioBlob) {
    try {
      this.idGroupe=this.groupe.id;
    
      message.audio=this.audioUrl;
      await this.chatService.sendGroup(message,this.groupe ,msg, null, this.audioBlob, this.audioUrl);
      
    } catch (error) {
      console.error('Erreur lors de l’envoi du message:', error);
    }
  } else {
    console.error('Audio data is missing or invalid.');
  }
 
  this.audioBlob = null;
  this.isRecording = false;
}
cancelRecording() {
  if (this.isRecording) {
    this.mediaRecorder.stop();  // Arrêter l'enregistrement
  }
  this.isRecording = false;
  this.chunks = [];  // Réinitialiser les données de l'enregistrement
  this.audioBlob = null;  // Effacer l'audio
  this.audioUrl = '';  // Réinitialiser l'URL
  this.stopTimer();  // Arrêter le timer
}
async sendGroup()
{   try {
  const username = this.token.getUser().username;
this.user = await this.userService.findByUsername(username).toPromise();

  if (!this.user) {
    throw new Error('User not found');
  }
  const message = new Message();
  message.sender = this.user;
  message.content = this.messageInput;
   message.time=new Date();
  let msg = new ChatNotification();
  msg.id=this.groupe.id.toString();
  msg.senderId=this.user.id;
  msg.senderUsername = this.user.username;
  msg.senderNom=this.user.nom;
  msg.senderPrenom=this.user.prenom;
  msg.senderEmail=this.user.email;
  msg.imageProfile = this.user.image;
  msg.content=this.messageInput;
msg.times=new Date().toISOString();
this.idGroupe=this.groupe.id;

  await  this.chatService.sendGroup(message,this.groupe ,msg,null,null,'');
  
}
catch (error) {
  console.error('Error sending message:', error);
}

this.resetMessageInput();
}
async onFileSelectedGroup(event: any) {
  //let file = event.target.files[0];
 try {

   this.selectedFiles = event.target.files;
  
   if (this.selectedFiles) {
    let file: File | null = this.selectedFiles.item(0);
    if (file) {

      const reader = new FileReader();

      reader.onload = (e: any) => {
        console.log(e.target.result);
        this.imageUrl = e.target.result;
        if (file.type.startsWith('image/')) {
          // Traiter l'image ici
          console.log('Ceci est une image:', file.name);
        } else if (file.type.startsWith('video/')) {
          // Traiter la vidéo ici
          console.log('Ceci est une vidéo:', file.name);
        }
      
      };

      this.selectedFile = file ? file : null;
      reader.readAsDataURL(file);
      this.fileImage = file;
      const dropText = document.querySelector('.drag-text');
      dropText?.classList.add('active');
      const uploadImage = document.querySelector('.upload-button');
      uploadImage?.classList.add('active');
      const deleteIcone = document?.querySelector('.delete-icon');
      deleteIcone?.classList.add('active');
       
      const userFromToken = this.token.getUser();
      const username = userFromToken.username;
      
      if (username) {
        try {
          this.user = await this.userService.findByUsername(username).toPromise();
          console.log("Utilisateur récupéré avec succès:", this.user);
        } catch (error) {
          console.error("Erreur lors de la récupération de l'utilisateur:", error);
        }
      } else {
        console.error("Nom d'utilisateur introuvable dans le token.");
      }
    
    
        const message = new Message();
        message.sender = this.user;
        message.time = new Date();
        if (this.userProfile) {
          message.receivers = [this.userProfile];
        }
        let msg = new ChatNotification();
        msg.senderId=this.user.id.toString();
        msg.senderUsername = this.user.username;
        msg.senderNom=this.user.nom;
        msg.senderPrenom=this.user.prenom;
        msg.senderEmail=this.user.email;
        msg.imageProfile = this.user.image;
        //msg.recipientId = this.userProfile.username;
        if (this.selectedFile) {
          const fileReader = new FileReader();
          fileReader.onload = async () => {
          if (file.type.startsWith('image/')) {
              message.image = fileReader.result as string;
            msg.image= fileReader.result as string;
              console.log('Ceci est une image:', file.name);
            } else if (file.type.startsWith('video/')) {
              message.video = fileReader.result as string;
            msg.video= fileReader.result as string;
              console.log('Ceci est une vidéo:', file.name);
            }
           
            this.idGroupe=this.groupe.id;
            await this.chatService.sendGroup(message,this.groupe ,msg,this.selectedFile,null,'');
          
           
          };
          fileReader.readAsDataURL(this.selectedFile);
        }
    }
   
  }
}catch (error) {
  console.error('Error sending message:', error);
}
 
}



async showDetail(groupe: any) {
  this.actifNew = false;
  this.actifDetail = true;
  this.isShow = true;
  let show: boolean = false;
  try {
    const users = await this.chatService.getChatMembers(groupe.chat.id).toPromise();
  
    // Vérification de la liste des membres et assignation à `this.membres`
    if (users && Array.isArray(users)) {
      console.log('Membres récupérés :', users);
  
      // Vérification si l'utilisateur actuel est dans la liste des membres
      const show = users.some(member => this.user && this.user.username === member.username);
  
      // Si l'utilisateur actuel est dans la liste des membres, afficher les membres
      if (show) {
        // Si l'utilisateur actuel est le créateur du groupe, ne pas appliquer de filtrage
        if (this.groupe.userCreature.username !== this.user.username) {
          const nonBlockedMembers = await Promise.all(
            users.map(async (member: User) => {
              const isBlocked = await this.blockService.isUserBlocked(this.user.id, member.id).toPromise();
              const isBlockedByTargetUser = await this.blockService.isUserBlocked(member.id, this.user.id).toPromise();
  
              // Garder uniquement les utilisateurs non bloqués
              return !isBlocked && !isBlockedByTargetUser ? member : null;
            })
          );
  
          // Supprimer les éléments null du tableau de non-bloqués
          this.membres = nonBlockedMembers.filter(member => member !== null);
        } else {
          // Si l'utilisateur est le créateur, assigner tous les membres
          this.membres = users;
        }
  
        this.filteredMembers = await this.membres; 
        await this.initializeMembers();
        this.showMembres();  // 
      } else {
        this.membres = [];
        this.filteredMembers = [];
      }
    } else {
      console.warn('Aucun membre trouvé.');
      this.membres = [];
      this.filteredMembers =[];
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des membres :', error);
    this.membres = [];
    this.filteredMembers = [];
  }}

toggleDetail(groupe:any)
{ if (this.isShow=== true)
  {  
    this.stopShowDetail();}
    else{
     
      this.membres=[];
      this.filteredMembers = []; 
      this.showDetail(groupe);
      
    }
}

stopShowDetail(){

  this.actifNew=true;
  this.actifDetail=false;
  this.isShow=false;
  
}
setActiveTab(tab: string) {
  this.activeTab = tab;
}
showMembres() {
  this.displayMembres = true;
  this.displayBloques=false;
  this.displayImages=false;
  this.displayVocales=false;
  this.displayVideos=false;
  this.setActiveTab('membres');
}
showBloques() {
  this.displayMembres = false;
  this.displayBloques=true;
  this.displayImages=false;
  this.displayVocales=false;
  this.displayVideos=false;
  this.setActiveTab('bloques');

}
showVideos() {
  this.displayMembres = false;
  this.displayBloques=false;
  this.displayImages=false;
  this.displayVocales=false;
  this.displayVideos=true;
  this.setActiveTab('videos');
}
showImages() {
  this.displayMembres = false;
  this.displayBloques=false;
  this.displayImages=true;
  this.displayVocales=false;
  this.displayVideos=false;
  this.setActiveTab('images');
}
showVocales() {
  this.displayMembres = false;
  this.displayBloques=false;
  this.displayImages=false;
  this.displayVocales=true;
  this.displayVideos=false;
  this.setActiveTab('vocales');

}
copyGroupLink() {
  const groupLink = `${window.location.origin}/join-group/${this.groupe.id}`;
  navigator.clipboard.writeText(groupLink).then(() => {
    this.snackBar.open('Le lien du groupe a été copié dans le presse-papier !', '', {
      duration: 3000, // Durée en ms
    });
  }).catch(err => {
    console.error('Erreur lors de la copie du lien : ', err);
    this.snackBar.open('Échec de la copie du lien', 'Fermer', {
      duration: 3000,
    });
  });
}
  getGroupById(groupeId: number) {
   /* */
    return this.groupes.find(groupe => groupe.id === groupeId);
  }

  parseMessage(message: string): SafeHtml {
    this.membres = []; // Exemple, remplissez ce tableau selon votre source de données
    this.filteredMembers = this.membres;
  
    const groupLinkPattern = /https:\/\/forum-socialx.vercel.app\/join-group\/(\d+)/g;
    const profileLinkPattern = /https:\/\/forum-socialx.vercel.app\/profile\/(\d+)/g;
    const postDetailLinkPattern = /https:\/\/forum-socialx.vercel.app\/detail\/(\d+)/g; // Expression régulière pour les liens vers les détails de poste
  
    // Traitement des liens de groupe
    if (groupLinkPattern.test(message)) {
      const replacedMessage = message.replace(groupLinkPattern, (match, groupId) => {
        const group = this.getGroupById(parseInt(groupId, 10)); // Récupérer le groupe par son ID
        const groupName = group ? group.groupName : 'Groupe inconnu';
        return `<a href="#" data-group-id="${groupId}" class="group-link">${groupName}</a>`;
      });
      return this.sanitizer.bypassSecurityTrustHtml(replacedMessage);
    }
  
    // Traitement des liens vers les profils
    else if (profileLinkPattern.test(message)) {
      const replacedMessage = message.replace(profileLinkPattern, (match, userId) => {
        return `<a href="#" data-user-id="${userId}" class="profile-link">Voir le profil</a>`;
      });
      return this.sanitizer.bypassSecurityTrustHtml(replacedMessage);
    }
  
    // Traitement des liens vers les détails de poste
    else if (postDetailLinkPattern.test(message)) {
      const replacedMessage = message.replace(postDetailLinkPattern, (match, postId) => {
        return `<a href="#" data-post-id="${postId}" class="post-detail-link">Voir le post</a>`;
      });
      return this.sanitizer.bypassSecurityTrustHtml(replacedMessage);
    } else {
      return this.sanitizer.bypassSecurityTrustHtml(message); // Retourner le message tel quel si aucun lien n'est trouvé
    }
  }
  
  handleLinkClick(event: Event) {
    event.preventDefault();
    const target = event.target as HTMLElement;
  
    // Vérifier si le lien est un lien de groupe
    if (target.classList.contains('group-link')) {
      const groupId = target.getAttribute('data-group-id');
      if (groupId) {
        const group = this.getGroupById(parseInt(groupId, 10));
        if (group) {
          this.groupLinkClicked.emit(group); // Ouvrir le groupe
        } else {
          alert('Groupe non trouvé');
        }
      }
    }
    
    // Vérifier si le lien est un lien de profil
    if (target.classList.contains('profile-link')) {
      const userId = target.getAttribute('data-user-id');
      if (userId) {
        this.navigateToProfile(userId); // Naviguer vers le profil
      }
    }
  
    // Vérifier si le lien est un lien vers le détail du poste
    if (target.classList.contains('post-detail-link')) {
      const postId = target.getAttribute('data-post-id');
      if (postId) {
        this.navigateToPostDetail(postId); // Naviguer vers les détails du poste
      }
    }
  }
 
  navigateToPostDetail(postId: string) {
    // Utiliser le router Angular pour rediriger vers la page de détail du poste
    this.router.navigate([`/detail/${postId}`]);
  }
  navigateToProfile(userId: string) {
    // Vous pouvez utiliser le router Angular pour rediriger vers la page du profil
    this.router.navigate([`/profile/${userId}`]);
  }
   async addMemberToGroup(groupe: Groupe) {
    const username = this.token.getUser().username;
    this.user = await this.userService.findByUsername(username).toPromise();

      this.groupService.addMember(groupe.id, this.user.id).subscribe(
        (groupe: Groupe) => {
          console.log('Membre ajouté au groupe avec succès', groupe);
          
          
        },
        (error) => {
          console.error('Erreur lors de l\'ajout du membre au groupe', error);
        }
      );
      this.groupe = groupe; 
      this.groupService.triggerGroupeListUpdated();
      this.isMember=true;
    }

    onTyping(): void {
     
      this.chatService.sendTypingEvent(this.userProfile.username, true);
    }
  
    onStopTyping(): void {
    
      this.chatService.sendTypingEvent(this.userProfile.username, false);
    }
  
    onTypingGroup() {
      const username = this.token.getUser().username;

      this.userService.findByUsername(username).subscribe((user)=>{
        this.userTyping=user;

      });
      
      console.log(`Sending typing status: ${username} is typing in group ${this.groupe.id}`);
      this.chatService.sendGroupTypingStatus(this.groupe.id, this.user.username,this.user.image, true);
    }
  
    onStopTypingGroup(): void {
      const user = this.token.getUser();
      this.chatService.sendGroupTypingStatus(this.groupe.id, user.username,user.image ,false);
    }
    checkAndSendViewStatus(message: any) {
      // Vérifier la structure du message pour accéder à l'ID de l'expéditeur
      let senderId: string ;
      let sender
      if ('sender' in message && 'username' in message.sender) {
        senderId = message.sender.usename;
      } else if ('senderId' in message) {
        senderId = message.senderId;
      } else {
        console.error('Structure de message invalide:', message);
        return; // Arrêter le traitement si la structure du message est incorrecte
      }
      const user = this.token.getUser();
      // Vérifier si le message n'a pas déjà été vu par l'utilisateur et si le sender du message n'est pas l'utilisateur actuel
      if (senderId !== user.username && !this.viewedMessages.has(message.id)) {
        // Marquer le message comme vu
        this.viewedMessages.add(message.id);
        
        // Envoyer le statut de vue au service de chat
        this.chatService.sendPrivateViewStatus(user.username, senderId, message.id);
      }
}

toggleEmojiPicker() {
  this.showEmojiPicker = !this.showEmojiPicker;
}

addEmoji(emoji: string): void {
  this.messageInput += emoji;
  this.showEmojiPicker = false; // Optionnel : fermer le picker après la sélection
}formatTimestamp(date: Date | string): string {
  // Si l'argument n'est pas déjà un objet Date, essayez de le convertir
  if (!(date instanceof Date)) {
    date = new Date(date);
  }

  // Vérifiez si la date est invalide
  if (isNaN(date.getTime())) {
    return 'Date non valide'; // Renvoie un message d'erreur pour une date invalide
  }

  const now = new Date();
  const timeDifference = now.getTime() - date.getTime(); // Différence en millisecondes

  const oneMinute = 60 * 1000;
  const oneHour = 60 * oneMinute;
  const oneDay = 24 * oneHour;
  const oneWeek = 7 * oneDay;
  const isSameDay = now.getDate() === date.getDate() &&
                    now.getMonth() === date.getMonth() &&
                    now.getFullYear() === date.getFullYear();
  const isSameYear = now.getFullYear() === date.getFullYear(); // Vérifie si c'est la même année

  // Vérifier la différence et retourner la chaîne correspondante
  if (timeDifference < oneMinute) {
    const seconds = Math.floor(timeDifference / 1000);
    return `${seconds} sec`;
  } else if (timeDifference < oneHour) {
    const minutes = Math.floor(timeDifference / oneMinute);
    return `${minutes} min`;
  } else if (timeDifference < oneDay) {
    if (isSameDay) {
      // Si c'est le même jour, afficher l'heure et les minutes
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // Sinon afficher la date du jour avec l'heure
      return `${date.toLocaleDateString([], { weekday: 'short' })} à ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  } else if (timeDifference < oneWeek) {
    // Si c'est moins d'une semaine, afficher la date et l'heure
    return `${date.toLocaleDateString([], { weekday: 'short' })} à ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    // Si c'est plus d'une semaine, ajouter l'année si nécessaire
    if (!isSameYear) {
      return `${date.getDate()} ${date.toLocaleDateString([], { month: 'short' })} ${date.getFullYear()} à ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${date.getDate()} ${date.toLocaleDateString([], { month: 'short' })} à ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  }
}




popupValider( messageId : number): void {
  this.messageId=messageId;
  console.log( "this.messageId", this.messageId)
  if (!this.popupVal || !this.overlay) {
    console.error('popupVal or overlay is not defined');
    return;
  }
  this.renderer.setStyle(this.popupVal.nativeElement, 'display', 'block');
  this.renderer.setStyle(this.overlay.nativeElement, 'display', 'block');

  const closePopup = (event: MouseEvent) => {
    if (event.target === this.overlay.nativeElement) {
      this.closePopup();
      this.overlay.nativeElement.removeEventListener('click', closePopup);
    }
    this.messageId = null; 
  };

  this.overlay.nativeElement.addEventListener('click', closePopup);
}

popupValiderChat( chatId : number): void {
  this.chatId=chatId;
  console.log( "this.messageId", this.messageId)
  if (!this.popupVal || !this.overlay) {
    console.error('popupVal or overlay is not defined');
    return;
  }
  this.renderer.setStyle(this.popupVal.nativeElement, 'display', 'block');
  this.renderer.setStyle(this.overlay.nativeElement, 'display', 'block');

  const closePopup = (event: MouseEvent) => {
    if (event.target === this.overlay.nativeElement) {
      this.closePopup();
      this.overlay.nativeElement.removeEventListener('click', closePopup);
    }
  };

  this.overlay.nativeElement.addEventListener('click', closePopup);
}

popupValiderGroupe( groupId : number): void {
  this.groupeId=groupId;
  console.log( "this.messageId", this.messageId)
  if (!this.popupVal || !this.overlay) {
    console.error('popupVal or overlay is not defined');
    return;
  }
  this.renderer.setStyle(this.popupVal.nativeElement, 'display', 'block');
  this.renderer.setStyle(this.overlay.nativeElement, 'display', 'block');

  const closePopup = (event: MouseEvent) => {
    if (event.target === this.overlay.nativeElement) {
      this.closePopup();
      this.overlay.nativeElement.removeEventListener('click', closePopup);
    }
  };

  this.overlay.nativeElement.addEventListener('click', closePopup);
}

popupValiderQuitter( groupId : number,userId:number): void {

  this.groupeId=groupId;
  this.userId=userId;
  console.log( "this.messageId", groupId)
  if (!this.popupVal || !this.overlay) {
    console.error('popupVal or overlay is not defined');
    return;
  }
  this.renderer.setStyle(this.popupVal.nativeElement, 'display', 'block');
  this.renderer.setStyle(this.overlay.nativeElement, 'display', 'block');

  const closePopup = (event: MouseEvent) => {
    if (event.target === this.overlay.nativeElement) {
      this.closePopup();
      this.overlay.nativeElement.removeEventListener('click', closePopup);
    }
  };

  this.overlay.nativeElement.addEventListener('click', closePopup);
}


popupValiderBloquer( DeblouqeId : number,username:string): void {
 this.BlouqeId = DeblouqeId
this.username=username;
  console.log( "this.messageId", this.messageId)
  if (!this.popupVal || !this.overlay) {
    console.error('popupVal or overlay is not defined');
    return;
  }
  this.renderer.setStyle(this.popupVal.nativeElement, 'display', 'block');
  this.renderer.setStyle(this.overlay.nativeElement, 'display', 'block');

  const closePopup = (event: MouseEvent) => {
    if (event.target === this.overlay.nativeElement) {
      this.closePopup();
      this.overlay.nativeElement.removeEventListener('click', closePopup);
    }
  };

  this.overlay.nativeElement.addEventListener('click', closePopup);
}


popupValiderDeblouqer( BlouqeId : number,username:string): void {
  this.DeblouqeId = BlouqeId
 this.username=username;
   console.log( "this.messageId", this.messageId)
   if (!this.popupVal || !this.overlay) {
     console.error('popupVal or overlay is not defined');
     return;
   }
   this.renderer.setStyle(this.popupVal.nativeElement, 'display', 'block');
   this.renderer.setStyle(this.overlay.nativeElement, 'display', 'block');
 
   const closePopup = (event: MouseEvent) => {
     if (event.target === this.overlay.nativeElement) {
       this.closePopup();
       this.overlay.nativeElement.removeEventListener('click', closePopup);
     }
   };
 
   this.overlay.nativeElement.addEventListener('click', closePopup);
 }
 popupDeleteMember( groupeId : number,username:string): void {
  this.membGroupId = groupeId;
 this.username=username;
   console.log( "this.messageId", this.messageId)
   if (!this.popupVal || !this.overlay) {
     console.error('popupVal or overlay is not defined');
     return;
   }
   this.renderer.setStyle(this.popupVal.nativeElement, 'display', 'block');
   this.renderer.setStyle(this.overlay.nativeElement, 'display', 'block');
 
   const closePopup = (event: MouseEvent) => {
     if (event.target === this.overlay.nativeElement) {
       this.closePopup();
       this.overlay.nativeElement.removeEventListener('click', closePopup);
     }
   };
 
   this.overlay.nativeElement.addEventListener('click', closePopup);
 }

 popupGetAdmin( groupeId : number,username:string): void {
  this.adminGroupId = groupeId;
 this.username=username;
   console.log( "this.messageId", this.messageId)
   if (!this.popupVal || !this.overlay) {
     console.error('popupVal or overlay is not defined');
     return;
   }
   this.renderer.setStyle(this.popupVal.nativeElement, 'display', 'block');
   this.renderer.setStyle(this.overlay.nativeElement, 'display', 'block');
 
   const closePopup = (event: MouseEvent) => {
     if (event.target === this.overlay.nativeElement) {
       this.closePopup();
       this.overlay.nativeElement.removeEventListener('click', closePopup);
     }
   };
 
   this.overlay.nativeElement.addEventListener('click', closePopup);
 }
onMessageClick(event: MouseEvent, message: any) {
  if (!event) {
    return; // Sortir si l'événement est indéfini
  }

  // Convertir explicitement en HTMLElement
  const clickedElement = (event.currentTarget as HTMLElement).closest('.message') as HTMLElement | null;
  
  if (this.selectedMessageElement === clickedElement) {
    // Si on clique sur le même message, désélectionner
    clickedElement?.classList.remove('selected');
    this.selectedMessageElement = null;
  } else {
    // Retirer la classe 'selected' de tous les autres messages
    if (this.selectedMessageElement) {
      this.selectedMessageElement.classList.remove('selected');
    }

    // Ajouter la classe 'selected' au message cliqué
    this.selectedMessageElement = clickedElement;
    this.selectedMessageElement?.classList.add('selected');
  }

  // Empêcher l'événement de propagation pour éviter de déclencher handleOutsideClick
  event.stopPropagation();
}

handleOutsideClick(event: MouseEvent) {
  // Si l'élément cliqué n'est pas le message sélectionné, on retire la classe 'selected'
  if (this.selectedMessageElement && !this.selectedMessageElement.contains(event.target as Node)) {
    this.selectedMessageElement.classList.remove('selected');
    this.selectedMessageElement = null;
  }
}


closePopup(): void {
  this.renderer.setStyle(this.popupVal.nativeElement, 'display', 'none');
  this.renderer.setStyle(this.overlay.nativeElement, 'display', 'none');

  this.messageId=null;
  this.chatId=null;
  this.groupeId=null;
  this.userId=null;
  this.BlouqeId=null;
  this.DeblouqeId=null;
  this.membGroupId=null;
  this.adminGroupId=null;
  this.username=null;
}
getShortDayName(date: Date): string {
  // Obtenir le nom complet du jour
  const fullDayName = date.toLocaleDateString([], { weekday: 'long' });
  // Limiter à trois mots
  return fullDayName.split(' ').slice(0, 3).join(' ');
}
isMessageViewed(messageId: number): boolean {
  return this.viewedMessages.has(messageId);
}





  /*deleteMessage(): void {
    console.log(`Suppression du message avec ID: ${this.messageId}`);
    this.messageService.deleteMessage(this.messageId)
      
        console.log('Message supprimé avec succès');
        // Logique pour mettre à jour l'interface utilisateur
       this.messages = this.messages.filter(message => message.id !== this.messageId);
        this.messagePrivieList=this.messagePrivieList.filter(message => message.id !== this.messageId);
     
  }*/
        deleteMessage(): void {
        
      
         
     {    this.chatService.deleteMessage(this.messageId!);
          if(this.messages)
         { this.messages = this.messages.filter(msg => msg.id !== this.messageId);}
          this.messagePrivieList = this.messagePrivieList.filter(msg => msg.id !== this.messageId!.toString());
          if(this.messagesGroupe)
         { this.messagesGroupe = this.messagesGroupe.filter(msg => msg.id !==  this.messageId);}
          this.combinedMessages= this.combinedMessages.filter(msg => msg.id !== this.messageId!.toString());
          this.closePopup();}
          
        }
       
        deletechat():void{
          this.chatService.deleteChat(this.chatId!);
        this.chatService.triggerChatListUpdated()
        location.reload();
        console.log("supprimer chat");
        this.closePopup();
        }
        deleteGroup():void{
          this.chatService.deleteGroup(this.groupeId!);
      this.groupService.triggerGroupeListUpdated()
           location.reload();
        console.log("supprimer groupe");
        this.closePopup();
        }


        quitterGroup():void{
          this.chatService.quitterGroup(this.groupeId!,this.userId!);
      this.groupService.triggerGroupeListUpdated()
           location.reload();
        console.log("quitter groupe");
        this.closePopup();
        }
        bloqueMember()
        {
          this.chatService.blockMember(this.BlouqeId!, this.username!);
          this.groupService.triggerGroupeListUpdated();
          location.reload;
          this.closePopup();  }
          debloqueMember()
          {
            this.chatService.unblockMember(this.DeblouqeId!, this.username!);
            this.groupService.triggerGroupeListUpdated();
            location.reload;
            this.closePopup();  }

            deletMember()
            {
              this.chatService.deleteMember(this.membGroupId!, this.username!)
              this.closePopup();
            }

            getAdmin(){

              this.chatService.getAdmin(this.adminGroupId!,this.username!)
              //this.groupService.triggerGroupeListUpdated();
              location.reload();
            }
        action():void{
    if(this.messageId!==null){

  this.deleteMessage()
    } else if(this.chatId!==null)
    {
      this.deletechat()
    }
  else if(this.groupeId!==null && this.userId===null)
  {

    this.deleteGroup()
  }else if(this.userId!==null && this.BlouqeId===null)
  {
    this.quitterGroup()
  }
  else if(this.BlouqeId!== null && this.DeblouqeId===null)
  {
    this.bloqueMember()
  }
  else if(this.DeblouqeId!==null)
  {
    this.debloqueMember()
  }
  else if (this.membGroupId!==null)
  {
    this.deletMember()
  }
  else if(this.adminGroupId!==null){
    this.getAdmin();
  }
  }




  convertToNumber(id: string): number {
    return parseInt(id, 10); // Ou parseFloat(id) si nécessaire
}

convertToDate(times: string): Date {
  // Décompose la chaîne de caractères : "Fri Sep 27 00:10:59 CEST 2024"
  const [weekday, month, day, time, timezone, year] = times.split(' ');

  // Crée une nouvelle chaîne de caractères utilisable par new Date() : "Sep 27 2024 00:10:59"
  const parsedDate = `${month} ${day} ${year} ${time}`;

  // Crée la date à partir de la chaîne formatée
  const date = new Date(parsedDate);

  // Vérifie si la date est valide
  if (isNaN(date.getTime())) {
    console.error('Date non valide:', times);
    return new Date(NaN); // Renvoie une date invalide explicitement
  }

  return date;
}

getFormattedDate(dateString: string): Date {
  return new Date(dateString);
}
async  getMessagesBetweenUsers(senderId:number, receiverId:number)
{this.messagePrivieList=[];

  const chats = await this.chatService.getCommonChats (senderId,receiverId).toPromise();
 
  
    for(let chat of chats)
      if(chat.typeChat==="privée")
    {{
      this.chat=chat;
     
      const messages = await this.chatService.getChatMessages(chat.id).toPromise();
    console.log(messages);
    this.messages=messages;
}}}
openChat(id:number)
{
  this.actifNew=true;
 this.groupe=null;
 this.messages=[]
 this.userService.findById(id).pipe(
  catchError(error => {
    console.error('Error fetching user:', error);
    return throwError(error); // Retourne l'erreur pour qu'elle puisse être gérée par le subscribe
  })
).subscribe(
  (user: User) => {
    this.userProfile = user; // Mettez à jour receiverUser avec le nouvel utilisateur
    console.log(this.userProfile);
  },
  (error) => {
    console.error('Error fetching user:', error);
  }
);
 this.getMessagesBetweenUsers(this.user.id, id);

}
isMemberBlock(groupe: any): boolean {
  // Vérifier si l'utilisateur est dans la liste des membres bloqués
  return !groupe.blockedMembers.some((member: any) => this.user.username === member.username);
}
isMemberGroupe(username:any):boolean{
  return Array.isArray(this.membresGroupe) && this.membresGroupe.some((member: any) => username === member.username);
}

popupModifier(groupe: any, action: string) {

  const popupModifier = document.querySelector('.popupModifierGroupe') as HTMLElement;
  
  const overlay = document.querySelector('.overlay') as HTMLElement;
  popupModifier.style.display = 'block';
    overlay.style.display = 'block';
    overlay.addEventListener('click', function () {
    
      popupModifier.style.display = 'none';
      overlay.style.display = 'none';
      
  
    });
 this.groupe=groupe;
    this.selectedCategory = groupe.category;
    this.nameGroupe=groupe.groupName;
   this.imageGroupe=groupe.groupImage;
  
 
}


onFile(event: any) {
  //let file = event.target.files[0];


  this.selectedFiles = event.target.files;
  if (this.selectedFiles) {
    const file: File | null = this.selectedFiles.item(0);
    if (file) {

      const reader = new FileReader();

      reader.onload = (e: any) => {
        console.log(e.target.result);
        this.imageGroupe = e.target.result;
      };


      reader.readAsDataURL(file);
      this.fileImage = file;
      const dropText = document.querySelector('.drag-text');
      dropText?.classList.add('active');
      const uploadImage = document.querySelector('.upload-button');
      uploadImage?.classList.add('active');
      const deleteIcone = document?.querySelector('.delete-icon');
      deleteIcone?.classList.add('active');
    }

  }
}

selectCategory(category: any) {
  this.selectedCategory = category.name;
  this.categorySelected = true;
  this.categories.forEach(cat => {
    cat.selected = cat.name === category.name;
  });
  this.isDropdownVisible = false;
  const optionMenu = document.querySelector('.select-menu');
  optionMenu?.classList.remove('active');
  console.log(this.selectedCategory);
}
clickMenu() {
  const optionMenu = document.querySelector('.select-menu');
  const selectbtn = document.querySelector('.btn');
  selectbtn?.addEventListener('click', () => {
    optionMenu?.classList.toggle('active');
  })
}
updateGroup()
{
  console.log('updateGroup clicked!');
  if(this.nameGroupe && this.selectedCategory !== 'Catégorie')
  
{ this.chatService.updateGroupe(this.groupe.id,this.nameGroupe,this.selectedCategory,this.fileImage) .subscribe({
    next: (response) => {
      console.log("Update successful:", response);
     this.groupService.triggerGroupeListUpdated();
     const popupModifier = document.querySelector('.popupModifierGroupe') as HTMLElement;
  
     const overlay = document.querySelector('.overlay') as HTMLElement;
    
    
       
         popupModifier.style.display = 'none';
         overlay.style.display = 'none';
         
     
    },
    error: (error) => {
      console.error("Error during update:", error);
      // Handle UI update for errors if needed
    }
  });}

  else if(!this.nameGroupe){
    this.errorMessage = 'Remplir le champ !';
    console.log( this.errorMessage);
  }else if (this.selectedCategory === 'Catégorie') {
    this.errorMesCateg = 'Choisir ton Catégorie !';
  }
}
onInputChange(): void {
  if (this.nameGroupe) {
    this.errorMessage = ''; // Efface le message d'erreur lorsque le champ est rempli
  }}
  filterMembers() {
    if (!this.membres || this.membres.length === 0) {
      console.log('Aucun membre disponible pour le filtrage.');
      this.filteredMembers = [];
      return;
    }
  
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredMembers = this.membres; // Restaurer la liste si aucun terme de recherche
    } else {
      this.filteredMembers = this.membres.filter(member => {
        const usernameMatches = member.username.toLowerCase().includes(this.searchTerm.toLowerCase());
  
        // Vérification que le champ `groupe.userJoinDates[member.id]` existe et contient une date
        const joinDateMatches = this.groupe.userJoinDates[member.id] 
        && (() => {
          const joinDate = new Date(this.groupe.userJoinDates[member.id]);
          
          // Formats de date à tester
          const formattedJoinDateLong = 
            ('0' + joinDate.getDate()).slice(-2) + ' ' +              
            joinDate.toLocaleString('fr-FR', { month: 'long' }) + ' ' +  
            joinDate.getFullYear() + ' ' +                             
            ('0' + joinDate.getHours()).slice(-2) + ':' +              
            ('0' + joinDate.getMinutes()).slice(-2) + ':' +            
            ('0' + joinDate.getSeconds()).slice(-2);
      
          const formattedJoinDateShort = 
            ('0' + joinDate.getDate()).slice(-2) + ' ' +              
            joinDate.toLocaleString('fr-FR', { month: 'short' }) + ' ' + 
            joinDate.getFullYear() + ' ' +                             
            ('0' + joinDate.getHours()).slice(-2) + ':' +              
            ('0' + joinDate.getMinutes()).slice(-2) + ':' +            
            ('0' + joinDate.getSeconds()).slice(-2);
      
          // Vérifier si le terme de recherche est présent dans les dates formatées
          return formattedJoinDateLong.includes(this.searchTerm) || formattedJoinDateShort.includes(this.searchTerm);
        })();
  
        return usernameMatches || joinDateMatches; // Filtrer si le `username` ou la `joinDate` correspondent
      });
    }
  
    console.log('Membres filtrés :', this.filteredMembers);
  }
 

  filterMessages(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredMessages = this.messagesGroupe; // Restaurer la liste des messages si aucun terme de recherche
    } else {
      this.filteredMessages = this.messagesGroupe.filter(message => {
        // Formater la date du message
        const messageDate = new Date(message.time);
        
        // Formats de date à tester
        const formattedDateLong = 
          ('0' + messageDate.getDate()).slice(-2) + ' ' +              
          messageDate.toLocaleString('fr-FR', { month: 'long' }) + ' ' +  
          messageDate.getFullYear() + ' ' +                             
          ('0' + messageDate.getHours()).slice(-2) + ':' +              
          ('0' + messageDate.getMinutes()).slice(-2) + ':' +            
          ('0' + messageDate.getSeconds()).slice(-2);
  
        const formattedDateShort = 
          ('0' + messageDate.getDate()).slice(-2) + ' ' +              
          messageDate.toLocaleString('fr-FR', { month: 'short' }) + ' ' + 
          messageDate.getFullYear() + ' ' +                             
          ('0' + messageDate.getHours()).slice(-2) + ':' +              
          ('0' + messageDate.getMinutes()).slice(-2) + ':' +            
          ('0' + messageDate.getSeconds()).slice(-2);
        
        // Vérifier si le terme de recherche est présent dans les dates formatées ou le contenu du message
        const messageContent = message.content ? message.content.toLowerCase() : '';
        const senderFirstName = message.sender && message.sender.nom ? message.sender.nom.toLowerCase() : '';
        const senderLastName = message.sender && message.sender.prenom ? message.sender.prenom.toLowerCase() : '';
        
        // Vérifier si le terme de recherche est présent dans les dates formatées, le contenu du message, le nom ou le prénom
        return (
          formattedDateLong.includes(this.searchTerm) || 
          formattedDateShort.includes(this.searchTerm) ||
          messageContent.includes(this.searchTerm.toLowerCase()) ||
          senderFirstName.includes(this.searchTerm.toLowerCase()) ||
          senderLastName.includes(this.searchTerm.toLowerCase())
        );
      });
    }
  }
  filterBlockedMembers(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredBlockedMembers = this.groupe.blockedMembers; // Restaurer la liste des membres si aucun terme de recherche
    } else {
      this.filteredBlockedMembers = this.groupe.blockedMembers.filter((member:any) => {
        const fullName = `${member.nom} ${member.prenom}`.toLowerCase(); // Créer un nom complet en minuscules
        return fullName.includes(this.searchTerm.toLowerCase()); // Vérifier si le terme de recherche est présent
      });
    }
  }

  loadPage(){

    location.reload();
  }
  async checkBlockStatus(member: any): Promise<void> {
    // Vérifiez si le membre est bloqué par l'utilisateur actuel ou si l'utilisateur actuel est bloqué par le membre
    const isBlocked = await this.blockService.isUserBlocked(this.user.id, member.id).toPromise();
    const isBlockedByTargetUser = await this.blockService.isUserBlocked(member.id, this.user.id).toPromise();
    
    // Ajoutez la propriété `isBlocked` au membre pour conditionner l'affichage dans le HTML
    member.isBlocked = isBlocked || isBlockedByTargetUser;
  }
  
  async initializeMembers() {
    // Supposons que `filteredMembers` soit la liste des membres à afficher dans le groupe
    for (const member of this.filteredMembers) {
      await this.checkBlockStatus(member);
    }
  }
  async initializeBlockMembers() {
    // Supposons que `filteredMembers` soit la liste des membres à afficher dans le groupe
    for (const member of this.filteredBlockedMembers) {
      await this.checkBlockStatus(member);
    }
  }
 navProfile(user:User)
{
 
    this.router.navigate(['/profile', user.id]).then(() => {
      window.location.reload();
    });
  }
  async navProfileMemeber(member:any)
  {
  
    await this.checkBlockStatus(member)
    if(!member.isBlocked)
  {  this.router.navigate(['/profile', member.id]).then(() => {
      window.location.reload();
    });}
  }


async  navProfileId(id:number)
  {  

    const user =  await this.userService.findById(id).toPromise()
    await this.checkBlockStatus(user)
    if(!user.isBlocked)
    {  this.router.navigate(['/profile', user.id]).then(() => {
        window.location.reload();
      });
    }}
    addGroupLinkClickListeners() {
      const links = this.el.nativeElement.querySelectorAll('.group-link');
      links.forEach((link: HTMLElement) => {
        this.renderer.listen(link, 'click', (event: Event) => this. handleLinkClick(event));
      });
    }
  clickToolp(){

    const tooltip = document.querySelector('.tooltip');
    tooltip?.classList.toggle('active');
  }

  clickToolpMember(tooltip: HTMLElement) {
    tooltip.classList.toggle('active');
  }
}  