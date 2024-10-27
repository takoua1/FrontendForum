import { ChangeDetectorRef, Component, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { TokenStorageService } from '../services/token-storage.service';
import { UserService } from '../services/user.service';
import { User } from '../model/user';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService } from '../services/chat.service';
import { Chat } from '../model/chat';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Message } from '../model/message';
import { BehaviorSubject, Observable, Subscription, catchError, take, tap, throwError } from 'rxjs';
import { MessageService } from '../services/message.service';
import { GroupService } from '../services/group.service';
import { Groupe } from '../model/groupe';
import { BlockService } from '../services/block.service';

@Component({
  selector: 'app-chat',

  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit ,OnDestroy{
  userId:number;
  messageInput:string;
  chatForm:FormGroup;
  currentUser: any;
  profileUser: any;
  user: User;
  chats:Chat[];
  refreshKey: number = 0;
  users:User[];
  userChat:User[] = [];
  messages:Message[];
  messagesGroupe:Message[];
 chat:any;
  update:boolean= false;
  actif:boolean=false;
  actifDetail:boolean=false;
  preview = '';
  messagePrivieList: any[] =[];
 chatId:number;
  chatsLoaded = false;
  updatingChats = false;
  offlineDuration: string;
  activeChatUserId: number ; 
  selectedFiles?: FileList;
  currentFile:  File | null = null;
  fileImage: File | null = null;
  selectedCategory = 'Catégorie';
  isDropdownVisible = true;
  categorySelected: boolean = false;
  private messageSentSubscription: Subscription;
  nom:string;
  isPresnt:boolean=false;
  groupes: any[]=[];
  otherGroupes: Groupe[]=[];
  groupe:any;
  isMember:boolean=false;
  unreadCounts: { [key: number]: number } = {};
  viewedMessages: Set<number> = new Set();
  activeUsersInChats: { [key: number]: Set<string> } = {};
  private subscriptions: Subscription[] = [];
  private subscriptionsActif: Subscription[] = [];
  activeUsers: Set<string> = new Set<string>();
  errorMessage :string | null = null;
  errorMesCateg : string |  null = null;
  searchTerm: string = '';
  filteredUserChat: any[] = [];
  filteredGroupChat: any[] = [];
  filteredMessages:any;
  showConversation = false;
   
  categories = [
    { name: 'Jeux', icon: 'bx bx-game', selected: false },
    { name: 'Education', icon: 'bx bxs-pen', selected: false },
    { name: 'Musique', icon: 'bx bx-music', selected: false },
    { name: 'Politique', icon: 'bx bxs-user-voice', selected: false },
    { name: 'Sport', icon: 'bx bx-football', selected: false },
  ]
  constructor(private token: TokenStorageService,
    private cdr: ChangeDetectorRef,private userService: UserService,private router: Router, private chatService:ChatService,private messageService:MessageService, 
    private routeActif:ActivatedRoute,private groupeService :GroupService,private blockService :BlockService) {
    this.user = new User();
   this.userChat=[];
  
  }
  


 
  async ngOnInit(): Promise<void> {

    const chatItems = document.querySelectorAll('.chat-item');

    // Ajouter un écouteur d'événements pour chaque élément de la liste
    chatItems.forEach(item => {
        item.addEventListener('click', this.handleChatItemClick);
    });
this.chatForm=new FormGroup({
  message:new FormControl('')
});


    window.addEventListener('btnEvent', this.checkSidebarStatus);
    this.userId= this.routeActif.snapshot.params["id"];
   
    this.currentUser = this.token.getUser();
  
    
 
    this.initializeChat();
    this.listerGroupe();
    
    this.chatService.chatListUpdated$.pipe(
      tap(() => {console.log('chatListUpdated$ émis');
        
      this.updateChatList();})
).subscribe();
      
       this.groupeService.groupeListUpdated$.pipe(tap(()=>{
        this.listerGroupe();
     
       }
      )).subscribe();
      
     this.listeOtherGroupe();
      
  
    
  this.chatService.activeChatUserId$.subscribe(profileId => {
      if (profileId) {
        this.activeChatUserId = profileId;
       console.log(this.activeChatUserId);
       this.findById(this.activeChatUserId);
     
    }});
    this.chatService.activeViewChat$.subscribe((actif)=>{
      this.actif=actif;
      console.log("actif chat", this.actif);
    })
   

  
  }
  

  
  private async initializeChat() {
    const username = this.token.getUser().username;
    console.log("initale demarer");
    await this.findUser(username);
   
    console.log('liste chat user', this.user.id);
  this.listChat(this.user.id);
    if (this.user.id && this.activeChatUserId) {
     await  this.getMessagesBetweenUsers(this.user.id, this.activeChatUserId);
 
    }
  }

  getAllRead(chatId:number)
  {
    this.chatService.markAllChatMessagesRead(chatId);
  }
  private async updateChatList() {
  
      
 /*   const username = this.token.getUser().username;
   const user=await this.findUser(username);

    await this.listChat(user.id);*/
    this.initializeChat() 
   
  
  }
 
  ngOnDestroy() {
    // N'oubliez pas de vous désabonner pour éviter les fuites de mémoire
    if (this.messageSentSubscription) {
      this.messageSentSubscription.unsubscribe();
    }
   
  }
  private async loadInitialChatList() {
    if (!this.chatsLoaded) {
      await this.initializeChat();
      this.chatsLoaded = true;
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptionsActif.forEach(subscription => subscription.unsubscribe());
  }
 listeOtherGroupe(){
  this.groupeService.findAll().subscribe((groupes)=>{
    this.otherGroupes=groupes
   
  
  })

 }
   async  getMessagesBetweenUsers(senderId:number, receiverId:number)
  {this.messagePrivieList=[];
   
    const chats = await this.chatService.getCommonChats (senderId,receiverId).toPromise();
    for(let chat of chats)
    
    { 
      const messages = await this.chatService.getChatMessages(chat.id).toPromise();
    console.log(messages);
    this.messages=messages
    this.cdr.markForCheck();

  // Mettre à jour l'état local du message si trouvé
  
this.refreshKey++;
    }
  }
  
  
  

 /* private async listChat(userId:number)
{
  this.userChat=[[]];
  this.users=[];
  this.chats=[];
  this.chatService.getChatsForMember(userId).subscribe((chats) => {
    this.chats=chats;
    console.log(this.chats);
    for (const chat of this.chats) {
   
      this.chatService.getChatMembers(chat.id).subscribe((users:User[]) => {
        this.users=users.filter(user=>user.username!== this.user.username);
        if(this.users!=null)
          {
            
           for (const user of this.users) {
              
              
              this.getOfflineDuration(user.username);
               for (const user of this.users) {
              
              console.log('user chat', this.userChat);
            
              this.userChat.push([user]); 
            }
         
            }
            console.log(this.userChat);
           
          }
          
         
       
       })
       this.chatService.getChatMessages(chat.id).subscribe((messages:Message[])=>{
        console.log(messages);
       })
      console.log(`Chat ID: ${chat.id}`);


    }

   });
}*/

async listChat(userId: number) {
  try {
    this.activeChatUserId = 0;
    this.userChat = [];
    this.users = [];
    this.unreadCounts = {};

    const chats = await this.chatService.getChatsForMember(userId).toPromise();
    
    if (chats) {
      this.chats = chats;
    }

    const chatPromises = this.chats.map(async (chat) => {
      if (chat.typeChat === "privée") {
        // Récupérer les membres du chat
        const users = await this.chatService.getChatMembers(chat.id).toPromise();
        console.log('Members of chat:', users);

        // Filtrer les utilisateurs qui ne sont pas bloqués
        const nonBlockedUsers = await Promise.all(
          users.map(async (user: User) => {
              console.log(`Checking if user ${user.username} is blocked by ${this.user.username}`);
      
              // Vérifier si l'utilisateur actuel a bloqué cet utilisateur
              const isBlocked = await this.blockService.isUserBlocked(this.user.id, user.id).toPromise();
              
              // Vérifier si cet utilisateur a bloqué l'utilisateur actuel
              const isBlockedByTargetUser = await this.blockService.isUserBlocked(user.id, this.user.id).toPromise();
              
              console.log(`isBlocked ${user.id} blocked by me: ${isBlocked}, blocks me: ${isBlockedByTargetUser}`);
      
              // Garder uniquement les utilisateurs non bloqués et qui ne sont pas l'utilisateur actuel
              if (!isBlocked && !isBlockedByTargetUser && user.username !== this.user.username) {
                  return user; // L'utilisateur est non bloqué, retournez-le
              }
              
              return null; // Si bloqué, retourner `null`
          })
      );
      

        // Supprimer les utilisateurs bloqués (ou ceux qui sont `null`) avant de poursuivre
        const validUsers = nonBlockedUsers.filter(user => user !== null);
        console.log('Valid users after blocking check:', validUsers);

        // Ajouter les utilisateurs valides dans la liste
        const userPromises = validUsers.map(async (user: any) => {
          const count = await this.chatService.getUnreadMessageCount(chat.id, this.user.username).toPromise();
          this.unreadCounts[chat.id] = count ?? 0;

          const offlineDuration = await this.userService.getOfflineDuration(user.username).toPromise();

          // Ajouter les utilisateurs valides dans `userChat`
          this.userChat.push({
            ...user,
            chatId: chat.id,
            offlineDuration: offlineDuration,
          });
        });

        // Attendre que toutes les requêtes d'utilisateurs soient traitées
        await Promise.all(userPromises);
      }
    });

    // Attendre que toutes les requêtes de chat soient terminées
    await Promise.all(chatPromises);

    // Mettre à jour la liste filtrée des utilisateurs du chat
    this.filteredUserChat = this.userChat;
    console.log("this.filteredUserChat", this.filteredUserChat);
  } catch (error) {
    console.error('Error fetching chats or processing them:', error);
  }
}


/*async listChat(userId: number): Promise<void> {
  try {
    this.userChat = []; 
    
    const chats = await this.chatService.getChatsForMember(userId).toPromise();
    this.chats = chats;

   
    const results = await Promise.all(this.chats.map(async (chat) => {
      const users = await this.chatService.getChatMembers(chat.id).toPromise();
      const filteredUsers = users.filter((user: any) => user.username!== this.user.username);

     
      this.userChat.push(...filteredUsers);

     const messages = await this.chatService.getChatMessages(chat.id).toPromise();
      console.log(messages);
     
      return { chatId: chat.id }; 
      
      
    }));

    console.log(results);
    this.cdr.markForCheck();
  } catch (error) {
    console.error('Error listing chats:', error);
  }

}*/




/*checkChatStates() {
  for (let chat of this.chats) {
    if (this.isUserActiveInChat(chat.id, this.profileUser.username)) {
      this.chatService.markMessagesAsRead(chat.id, this.user.username).subscribe(
        () => {
          console.log(`Messages in chat ID ${chat.id} marked as read.`);
          this.unreadCounts[chat.id] = 0; // Réinitialise le nombre de messages non lus pour ce chat
        },
        (error) => {
          console.error(`Error marking messages as read for chat ID ${chat.id}:`, error);
        }
      );
    }
  }
}*/




 async selectRecivres(user:any)
{ 
  
this.messagePrivieList=[];
 
this.actif=true;
this.actifDetail=false;
this.profileUser=user;
this.groupe=null;

const chats = await this.chatService.getCommonChats (this.user.id,this.profileUser.id).toPromise();
for(let chat of chats)
  if(chat.typeChat==="privée")
{{
  this.chat=chat;
 
  const messages = await this.chatService.getChatMessages(chat.id).toPromise();
console.log(messages);
this.messages=messages;
this.cdr.markForCheck();

  // Mettre à jour l'état local du message si trouvé
  
this.refreshKey++;
this.chatService.markMessagesAsRead(chat.id, this.user.username).subscribe(
  () => {
    console.log(`Messages in chat ID ${chat.id} marked as read.`);
    this.unreadCounts[chat.id] = 0; // Réinitialise le nombre de messages non lus pour ce chat
  },
  (error) => {
    console.error(`Error marking messages as read for chat ID ${chat.id}:`, error);
  }
);
// Marquer l'utilisateur courant comme actif dans la discussion sélectionnée


// Vérifier si l'autre utilisateur est actif dans cette discussion

    /*    this.chatService.isUserActiveInChat(chat.id, this.profileUser.username).subscribe(isActive => {
          console.log(`Is ${this.profileUser.username} active in chat ${chat.id}? ${isActive}`);


  if (isActive) {
    this.chatService.markMessagesAsRead(chat.id, this.profileUser.username).subscribe(
      () => {
        console.log(`Messages in chat ID ${chat.id} marked as read.`);
        this.unreadCounts[chat.id] = 0; // Réinitialise le nombre de messages non lus pour ce chat
      },
      (error) => {
        console.error(`Error marking messages as read for chat ID ${chat.id}:`, error);
      }
    );
  }
},
error => {
  console.error('Error checking user activity:', error);
}
);*/
  


console.log('this.chat',this.chat.id,'chat',this.chatId)


}
}

}

trackByFn(index: number, item: any): any {
  return item.id;
}
private async findUser(username: string): Promise<User> {
  return new Promise((resolve, reject) => {
     this.userService.findByUsername(username).subscribe(
       (user: User) => {
         this.user = user;
         console.log(this.user);
         resolve(user); // Résolvez la promesse avec l'utilisateur trouvé
       },
       (error) => {
         console.error('Error fetching user:', error);
         reject(error); // Rejetez la promesse en cas d'erreur
       }
     );
  });
 }
      navProfile(user:User)
      {
        this.router.navigate(['/profile', user.id]); 
        window.location.reload(); 
      }

      checkSidebarStatus():void{
    
        const sidebarActive = localStorage.getItem('sidebarActive');
        const navBar =document.querySelector('.navbarChat');
        if (sidebarActive === 'true') {
            
          
          const newEvent = new Event('newEvent');
          navBar?.classList.add('active');
          window.dispatchEvent(newEvent);
        }
        
        if (sidebarActive === 'false') {
            
      
          const newEvent = new Event('newEvent');
          navBar?.classList.remove('active');
          window.dispatchEvent(newEvent);
        }
      
      }
 
      getOfflineDuration(username:string) {

        this.userService.getOfflineDuration(username).subscribe((duration:any)=>{
          this.offlineDuration=duration;
          console.log(this.offlineDuration);
        })
      }
      findById(userId: number): void {
        this.userService.findById(userId).pipe(
          catchError(error => {
            console.error('Error fetching user:', error);
            return throwError(error); // Retourne l'erreur pour qu'elle puisse être gérée par le subscribe
          })
        ).subscribe(
          (user: User) => {
            this.profileUser = user; // Mettez à jour receiverUser avec le nouvel utilisateur
            console.log(this.profileUser);
          },
          (error) => {
            console.error('Error fetching user:', error);
          }
        );
      }
      onInputChange(): void {
        if (this.nom) {
          this.errorMessage = ''; // Efface le message d'erreur lorsque le champ est rempli
        }}
      addGroupe() { 
        if (this.nom && this.selectedCategory !== 'Catégorie' ) { // Vérifiez le nom au lieu de verfierTape
          const username = this.token.getUser().username;
          this.userService.findByUsername(username).subscribe((user: User) => {
            this.user = user;
            
            let groupe = new Groupe();
            groupe.groupName = this.nom; // nom du groupe
            groupe.category = this.selectedCategory; // catégorie sélectionnée
            groupe.userCreature = this.user; // utilisateur qui a créé le groupe
      
            // Ajout du groupe via le service
            this.groupeService.addGroupe(groupe, this.currentFile).subscribe(
              (response) => {
                console.log(response);
                this.selectedCategory = 'Catégorie'; // Réinitialiser la catégorie
                this.nom = ''; // Réinitialiser le champ de nom
                this.groupeService.triggerGroupeListUpdated(); // Met à jour la liste
              },
              (error) => {
                console.error('Error add groupe:', error);
              }
            );
          });
        } else if(!this.nom){
          this.errorMessage = 'Remplir le champ !';
          console.log( this.errorMessage);
        }else if (this.selectedCategory === 'Catégorie') {
          this.errorMesCateg = 'Choisir ton Catégorie !';
        }
      }
      selectFile(event: any): void {
      
        this.preview = this.user.image;
 
        this.selectedFiles = event.target.files;
      
        if (this.selectedFiles) {
          const file: File | null = this.selectedFiles.item(0);
      
          if (file) {
            this.preview = '';
            this.currentFile = file;
      
            const reader = new FileReader();
      
            reader.onload = (e: any) => {
              console.log(e.target.result);
              this.preview = e.target.result;
            };
      
            reader.readAsDataURL(this.currentFile);
          
         
          }
    
        }  }
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
        PopupGroupe(event: MouseEvent) {
          const popupGroupe = document.querySelector('.popupGroupe') as HTMLElement;
          const overlay = document.querySelector('.overlay') as HTMLElement;
          popupGroupe.style.display = 'block';
          overlay.style.display = 'block';
          overlay.addEventListener('click', function () {
            popupGroupe.style.display = 'none';
            overlay.style.display = 'none';
      
          });
      
      
      
        }
      
         async listerGroupe() {
          const username = this.token.getUser().username;
       this.profileUser=null;
         
          this.userService.findByUsername(username).subscribe(
            (user: User) => {
              this.user = user;
              console.log('user id', this.user.id);
        
              this.groupeService.listerGroupe(this.user.id).subscribe(
                (groupes) => {
                  console.log(groupes);
                  this.groupes = groupes;
                   this.filteredGroupChat=this.groupes;
                  for (const groupe of this.groupes) {
                    // Récupérer le nombre de messages non lus
                    this.chatService.getUnreadMessageCount(groupe.chat.id, this.user.username).subscribe(
                      (count: number) => {
                        this.unreadCounts[groupe.chat.id] = count;
                      },
                      (error) => {
                        console.error(`Error fetching unread message count for chat ID ${groupe.chat.id}:`, error);
                      }
                    );
                    if(this.groupe)
                      {console.log('this.chat',this.chat.id)
                       this.chatService.markMessagesAsRead(this.groupe.chat.id, this.user.username).subscribe(
                         () => {
                           console.log(`Messages in chat ID ${this.chat.id} marked as read.`);
                           this.unreadCounts[this.chat.id] = 0; // Réinitialise le nombre de messages non lus pour ce chat
                         },
                         (error) => {
                           console.error(`Error marking messages as read for chat ID ${this.chat.id}:`, error);
                         }
                       );
                      }
                    // Associer les icônes correspondantes
                    const matchingIcons = this.categories.filter(catIcon => catIcon.name === groupe.category);
                    groupe.icons = matchingIcons;
                   
          
                  }
                },
                (error) => {
                  console.error('Error fetching groups:', error);
                }
              );
            },
            (error) => {
              console.error('Error fetching user:', error);
            }
          );
        }      
          
        

        
      async  selectChat(groupe:Groupe)
        {
          
          this.actif=true;
          this.actifDetail=false;
         
          this.profileUser = null;
          this.chatService.setCurrentGroupId(groupe.id);
             this.Member(groupe);
          console.log(groupe.chat.id);
          console.log(groupe);
          this.groupe=groupe;
          this.chat=this.groupe.chat;
          
          const messages = await this.chatService.getChatMessages(groupe.chat.id).toPromise();
        
           console.log('messages',messages);
           const specificSenderId = this.user.id; // Par exemple, l'ID de l'utilisateur courant
             if(groupe.userCreature.username !== this.user.username)
         
         {  this.messagesGroupe = messages.filter((message: any) => message.sender.id === specificSenderId);
           
           console.log('Filtered messages', this.messagesGroupe);
         }
         else{
          this.messagesGroupe=messages;
         }

           this.filteredMessages=this.messagesGroupe;

           this.cdr.markForCheck();
          
        this.refreshKey++; 
           this.chatService.markMessagesAsRead(groupe.chat.id, this.user.username).subscribe(
            () => {
              console.log(`Messages in chat ID ${groupe.chat.id} marked as read.`);
              this.unreadCounts[groupe.chat.id] = 0;
              // Reset the unread count for this chat
            }
            
            ,
            (error) => {
              console.error(`Error marking messages as read for chat ID ${groupe.chat.id}:`, error);
            }
          );
         this.groupeService.triggerGroupeListUpdated()
        
         this.chatService.subscribeToGroupMessages(groupe.id);
        }
async Member(groupe:Groupe)
{ try {
  const users = await this.chatService.getChatMembers(groupe.chat.id).toPromise();
  const username = this.token.getUser().username;
  console.log('users',users);
   const user = await this.userService.findByUsername(username).toPromise();
  console.log('this.user',user);
  for (const user of users) {      

    if(this.user.id === user.id)
      { console.log('L\'utilisateur actuel est un membre du groupe de chat.');
       this.isMember=true;
       return;
      }
  }   console.log('L\'utilisateur actuel n\'est pas un membre du groupe de chat.');
   this.isMember=false;
  
} catch (error) {
  console.error('Erreur lors de la vérification des membres du groupe de chat :', error);
  this.isMember=false;
}
}
search(term: string): void {
  console.log("Term de recherche :", term);  // Vérifier le terme de recherche
  
  // Filtrage des utilisateurs
  if (!term.trim()) {
    this.filteredUserChat = this.userChat;
    this.filteredGroupChat = this.groupes; // Restaurer la liste des groupes si aucun terme n'est fourni
    console.log("Aucun terme de recherche. Liste restaurée :", this.filteredUserChat, this.filteredGroupChat);  // Afficher la liste restaurée
    return;
  }

  // Filtrage des utilisateurs
  this.filteredUserChat = this.userChat.filter(({ nom, prenom }) => {
    const nomExists = typeof nom === 'string';  // Vérifier que 'nom' est une chaîne
    const prenomExists = typeof prenom === 'string';  // Vérifier que 'prenom' est une chaîne

    return (
      (nomExists && nom.toLowerCase().includes(term.toLowerCase())) ||
      (prenomExists && prenom.toLowerCase().includes(term.toLowerCase()))
    );
  });

  console.log("Liste filtrée des utilisateurs :", this.filteredUserChat);  // Vérifier la liste filtrée après recherche

  // Filtrage des groupes
  this.filteredGroupChat = this.groupes.filter(groupe => {
    return typeof groupe.groupName === 'string' && groupe.groupName.toLowerCase().includes(term.toLowerCase());
  });

  console.log("Liste filtrée des groupes :", this.filteredGroupChat);  // Vérifier la liste filtrée des groupes
}
openConversation() {
  this.showConversation = true;
}

closeConversation() {
  this.showConversation = false;
}
handleChatItemClick(): void {
  // Vérifier la largeur de la fenêtre
  if (window.innerWidth <= 780) {
      const leftPanel = document.querySelector('.left') as HTMLElement;
      const rightPanel = document.querySelector('.right') as HTMLElement;

      if (leftPanel && rightPanel) {
          // Appliquer la classe pour masquer le panneau gauche
          leftPanel.classList.add('display-none');

          // S'assurer que le panneau droit est visible
          rightPanel.style.display = 'block'; // Ou utilisez une classe CSS pour afficher
      }
     if(this.actif=true)
      {
        leftPanel.classList.add('display-none');
        rightPanel.style.display = 'block';

      }
      else{

        leftPanel.style.display='block';
        rightPanel.classList.add('display-none');
      }
  }
}
}



