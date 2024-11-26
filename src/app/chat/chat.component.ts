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
import { FollowService } from '../services/follow.service';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrl: './chat.component.css',
    standalone: false
})
export class ChatComponent implements OnInit, OnDestroy {
  userId: number;
  messageInput: string;
  chatForm: FormGroup;
  currentUser: any;
  profileUser: any;
  user: User;
  chats: Chat[];
  refreshKey: number = 0;
  users: User[];
  userChat: User[] = [];
  messages: Message[];
  messagesGroupe: Message[];
  chat: any;
  update: boolean = false;
  actif: boolean = false;
  actifDetail: boolean = false;
  preview = '';
  messagePrivieList: any[] = [];

  chatId: number;
  chatsLoaded = false;
  updatingChats = false;
  offlineDuration: string;
  activeChatUserId: number;
  selectedFiles?: FileList;
  currentFile: File | null = null;
  fileImage: File | null = null;
  selectedCategory = 'Catégorie';
  isDropdownVisible = true;
  categorySelected: boolean = false;
  private messageSentSubscription: Subscription;
  nom: string;
  isPresnt: boolean = false;
  groupes: any[] = [];
  otherGroupes: Groupe[] = [];
  groupe: any;
  isMember: boolean = false;
  isMemberGroup: boolean = false;
  unreadCounts: { [key: number]: number } = {};
  viewedMessages: Set<number> = new Set();
  activeUsersInChats: { [key: number]: Set<string> } = {};
  private subscriptions: Subscription[] = [];
  private subscriptionsActif: Subscription[] = [];
  activeUsers: Set<string> = new Set<string>();
  errorMessage: string | null = null;
  errorMesCateg: string | null = null;
  searchTerm: string = '';
  filteredUserChat: any[] = [];
  filteredGroupChat: any[] = [];
  filteredMessages: any;
  showConversation = false;
  isShow: false;
  followers: any[];
  categories = [
    { name: 'Jeux', icon: 'bx bx-game', selected: false },
    { name: 'Education', icon: 'bx bxs-pen', selected: false },
    { name: 'Musique', icon: 'bx bx-music', selected: false },
    { name: 'Politique', icon: 'bx bxs-user-voice', selected: false },
    { name: 'Sport', icon: 'bx bx-football', selected: false },
  ]
  constructor(private token: TokenStorageService,
    private cdr: ChangeDetectorRef, private userService: UserService, private router: Router, private chatService: ChatService, private messageService: MessageService,
    private routeActif: ActivatedRoute, private groupeService: GroupService, private blockService: BlockService, private followService: FollowService) {
    this.user = new User();
    this.userChat = [];

  }




  async ngOnInit(): Promise<void> {

    this.chatForm = new FormGroup({
      message: new FormControl('')
    });


    window.addEventListener('btnEvent', this.checkSidebarStatus);
    this.userId = this.routeActif.snapshot.params["id"];

    this.currentUser = this.token.getUser();

    const username = this.token.getUser().username;
    console.log("initale demarer");
    await this.findUser(username);
    this.listChat(this.user.id);

    this.initializeChat();
    this.listerGroupe();

    this.chatService.chatListUpdated$.pipe(
      tap(async () => {
        console.log('chatListUpdated$ émis');

        this.selectRecivres(this.profileUser);
        await this.listChat(this.user.id);




      })
    ).subscribe();

    this.groupeService.groupeListUpdated$.pipe(tap(() => {
      this.listerGroupe();

    }
    )).subscribe();

    this.listeOtherGroupe();



    this.chatService.activeChatUserId$.subscribe(profileId => {
      if (profileId) {
        this.activeChatUserId = profileId;
        console.log(this.activeChatUserId);
        this.findById(this.activeChatUserId);

      }
    });
    this.chatService.activeViewChat$.subscribe((actif) => {
      this.actif = actif;
      console.log("actif chat", this.actif);
    })


    this.handleChatItemClick()
    const chatItems = document.querySelectorAll('.chat-item');

    // Ajouter un écouteur d'événements pour chaque élément de la liste
    chatItems.forEach(item => {
      item.addEventListener('click', this.handleChatItemClick.bind(this));
    });
    const user = this.token.getUser();
    this.findByUsername(user.username).then((userFound) => {
      this.loadFollowers(this.user.id)
    })

    this.loadChatUsers();
  }




  findByUsername(username: string): Promise<User> {
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

  private async initializeChat() {
    const username = this.token.getUser().username;
    console.log("initale demarer");
    await this.findUser(username);

    console.log('liste chat user', this.user.id);
    //
    if (this.user.id && this.activeChatUserId) {
      this.actif = true;
      await this.getMessagesBetweenUsers(this.user.id, this.activeChatUserId);


    }
    this.handleChatItemClick()
  }

  getAllRead(chatId: number) {
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
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(item => {
      item.removeEventListener('click', this.handleChatItemClick.bind(this));
    });
  }
  private async loadInitialChatList() {
    if (!this.chatsLoaded) {
      await this.initializeChat();
      this.chatsLoaded = true;
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptionsActif.forEach(subscription => subscription.unsubscribe());
  }
  listeOtherGroupe() {
    this.groupeService.findAll().subscribe((groupes) => {
      this.otherGroupes = groupes


    })

  }
  async getMessagesBetweenUsers(senderId: number, receiverId: number) {
    this.messagePrivieList = [];
    this.actif = true;
    const chats = await this.chatService.getCommonChats(senderId, receiverId).toPromise();
    for (let chat of chats) {
      const messages = await this.chatService.getChatMessages(chat.id).toPromise();
      console.log("messages",messages);
      this.messages = messages
     if(this.messages)
     {
      this.chat=chat
     }

      // Mettre à jour l'état local du message si trouvé

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


      const chats = await this.chatService.getChatsForMember(userId).toPromise();
      console.log("Les listes de chats avant filtrage par blocage:", chats);

      if (chats) {
        this.chats = chats || [];
      }

      const userChatOrdered: any[] = []; // Liste temporaire pour maintenir l'ordre

      const chatPromises = this.chats.map(async (chat) => {
        const users = await this.chatService.getChatMembers(chat.id).toPromise();
        console.log('Membres du chat:', users);

        if (this.chat && this.chat.id === chat.id) {
          await this.chatService.markMessagesAsRead(chat.id, this.user.username);
          this.unreadCounts[this.chat.id] = 0;

        } else if (!this.chat || this.chat.id !== chat.id) {
          const count = await this.chatService.getUnreadMessageCount(chat.id, this.user.username).toPromise();
          this.unreadCounts[chat.id] = count ?? 0;

        }

        // Filtrer les utilisateurs valides
        const validUsers: any[] = []; // Liste des utilisateurs valides
        for (const user of users) {
          const isFriend = await this.followService.isFollowing(this.user.id, user.id).toPromise();
          const isBlocked = await this.blockService.isUserBlocked(this.user.id, user.id).toPromise();
          const isBlockedByTargetUser = await this.blockService.isUserBlocked(user.id, this.user.id).toPromise();

          if (!isBlocked && !isBlockedByTargetUser && user.username !== this.user.username) {
            const offlineDuration = await this.userService.getOfflineDuration(user.username).toPromise();
            validUsers.push({
              ...user,
              isFriend,
              chatId: chat.id,
              offlineDuration: offlineDuration,
            });
          }
        }
        console.log("validUsers:", validUsers);

        // Ajouter les utilisateurs valides à userChatOrdered
        userChatOrdered.push(...validUsers);
      });

      await Promise.all(chatPromises);

      // Trie userChatOrdered selon l'ordre d'origine dans users
      const allUsers = this.chats.map(async (chat) => {
        return await this.chatService.getChatMembers(chat.id).toPromise();
      });

      const usersList = await Promise.all(allUsers);
      const flatUsers = [].concat(...usersList); // Aplatir le tableau pour récupérer tous les utilisateurs

      userChatOrdered.sort((a, b) => {
        const indexA = flatUsers.findIndex((user: any) => user.id === a.id);
        const indexB = flatUsers.findIndex((user: any) => user.id === b.id);
        return indexA - indexB; // Trie selon l'ordre d'origine
      });

      console.log(" userChatOrdered final:", userChatOrdered);
      this.userChat = [...userChatOrdered]; // Pas besoin d'attendre ici
      console.log(" this.userChat:", this.userChat);
      this.filteredUserChat = [...this.userChat]; // Cloner pour conserver l'ordre
      console.log("this.filteredUserChat:", this.filteredUserChat);
    } catch (error) {
      console.error('Erreur lors de la récupération ou du traitement des chats:', error);
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




  async selectRecivres(user: any) {

    this.messagePrivieList = [];

    this.actif = true;
    this.actifDetail = false;
    this.profileUser = user;
    this.groupe = null;
    this.chatService.getUnreadTotal(this.user.username).subscribe((total) => {
      this.chatService.emitUnreadCountChange(total);
    });
    const chats = await this.chatService.getCommonChats(this.user.id, this.profileUser.id).toPromise();
    for (let chat of chats)
      if (chat.typeChat === "privée") {
        {
          this.chat = chat;

          const messages = await this.chatService.getChatMessages(chat.id).toPromise();
          console.log(messages);
          this.messages = messages;
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



          console.log('this.chat', this.chat.id, 'chat', this.chatId)


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


  checkSidebarStatus(): void {

    const sidebarActive = localStorage.getItem('sidebarActive');
    const navBar = document.querySelector('.navbarChat');
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

  getOfflineDuration(username: string) {

    this.userService.getOfflineDuration(username).subscribe((duration: any) => {
      this.offlineDuration = duration;
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
    }
  }
  addGroupe() {
    if (this.nom && this.selectedCategory !== 'Catégorie') { // Vérifiez le nom au lieu de verfierTape
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
            this.groupeService.triggerGroupeListUpdated();
            const popupModifier = document.querySelector('.popupGroupe') as HTMLElement;

            const overlay = document.querySelector('.overlay') as HTMLElement;

            popupModifier.style.display = 'none';
            overlay.style.display = 'none';

          },
          (error) => {
            console.error('Error add groupe:', error);
          }
        );
      });
    } else if (!this.nom) {
      this.errorMessage = 'Remplir le champ !';
      console.log(this.errorMessage);
    } else if (this.selectedCategory === 'Catégorie') {
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
    this.profileUser = null;

    this.userService.findByUsername(username).subscribe(
      (user: User) => {
        this.user = user;
        console.log('user id', this.user.id);

        this.groupeService.listerGroupe(this.user.id).subscribe(
          (groupes) => {
            console.log(groupes);
            this.groupes = groupes;
            this.filteredGroupChat = this.groupes;
            for (const groupe of this.filteredGroupChat) {
              console.log("this.groupes", this.groupes)
              this.chatService.subscribeToAllGroupMessages(this.filteredGroupChat);
              // Récupérer le nombre de messages non lus
              this.chatService.getUnreadMessageCount(groupe.chat.id, this.user.username).subscribe(
                (count: number) => {
                  this.unreadCounts[groupe.chat.id] = count;
                },
                (error) => {
                  console.error(`Error fetching unread message count for chat ID ${groupe.chat.id}:`, error);
                }
              );
              if (this.groupe) {
                console.log('this.chat', this.chat.id)
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



  async selectChat(groupe: Groupe) {
    this.actif = true;
    this.actifDetail = false;
    this.profileUser = null;
    this.chatService.getUnreadTotal(this.user.username).subscribe((total) => {
      this.chatService.emitUnreadCountChange(total);
    });
    this.chatService.setCurrentGroupId(groupe.id);
    this.Member(groupe);
    console.log(groupe.chat.id);
    console.log(groupe);
    this.groupe = groupe;
    this.chat = this.groupe.chat;

    // Récupérer les messages du chat
    const messages = await this.chatService.getChatMessages(groupe.chat.id).toPromise();
    console.log('messages', messages);
    if (groupe.userCreature.id !== this.user.id) {  // Filtrer les messages en excluant ceux des membres bloqués
      this.messagesGroupe = await Promise.all(
        messages.map(async (message: any) => {
          const isBlocked = await this.blockService.isUserBlocked(this.user.id, message.sender.id).toPromise();
          const isBlockedBySender = await this.blockService.isUserBlocked(message.sender.id, this.user.id).toPromise();

          // Garder uniquement les messages dont les expéditeurs ne sont pas bloqués
          return !isBlocked && !isBlockedBySender ? message : null;
        })
      ).then(filteredMessages => filteredMessages.filter(message => message !== null)); // Supprimer les messages null (bloqués)

      this.filteredMessages = this.messagesGroupe;
    }
    else {
      this.messagesGroupe = messages;
      this.filteredMessages = this.messagesGroupe;
    }
    this.cdr.markForCheck();

    // Marquer les messages comme lus
    this.chatService.markMessagesAsRead(groupe.chat.id, this.user.username).subscribe(
      () => {
        console.log(`Messages in chat ID ${groupe.chat.id} marked as read.`);
        this.unreadCounts[groupe.chat.id] = 0; // Réinitialiser le compteur de non lus
      },
      (error) => {
        console.error(`Error marking messages as read for chat ID ${groupe.chat.id}:`, error);
      }
    );
    this.isUserInChat(groupe, this.user.id)
    // S'abonner aux nouveaux messages de ce groupe
    this.chatService.subscribeToGroupMessages(groupe.id);
  }


  /* async  selectChat(groupe:Groupe)
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
  
    this.messagesGroupe=messages;
  

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
  }*/
  async Member(groupe: Groupe) {
    try {
      const users = await this.chatService.getChatMembers(groupe.chat.id).toPromise();
      const username = this.token.getUser().username;
      console.log('users', users);
      const user = await this.userService.findByUsername(username).toPromise();
      console.log('this.user', user);
      for (const user of users) {

        if (this.user.id === user.id) {
          console.log('L\'utilisateur actuel est un membre du groupe de chat.');
          this.isMember = true;
          return;
        }
      } console.log('L\'utilisateur actuel n\'est pas un membre du groupe de chat.');
      this.isMember = false;

    } catch (error) {
      console.error('Erreur lors de la vérification des membres du groupe de chat :', error);
      this.isMember = false;
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
    console.log("handleChatItemClick called"); // Ajoutez ceci

    // Vérifier la largeur de la fenêtre
    if (window.innerWidth <= 780) {
      console.log("Window width is <= 780"); // Ajoutez ceci
      const leftPanel = document.querySelector('.left') as HTMLElement;
      const rightPanel = document.querySelector('.right') as HTMLElement;
      const rightMessage = document.querySelector('.right .message') as HTMLElement;

      console.log("this.actif", this.actif); // Vérifiez la valeur de this.actif

      if (this.actif === true) {
        console.log("this.actif is true"); // Ajoutez ceci
        // Masquer le panneau gauche et afficher le panneau droit
        if (leftPanel) {
          leftPanel.style.transition = 'width 0.5s ease, opacity 0.5s ease';
          leftPanel.style.width = '0';
          leftPanel.style.display = 'none';
        }
        if (rightPanel) {
          rightPanel.style.display = 'block';
          rightPanel.style.transition = 'width 0.5s ease';
          rightPanel.style.width = '88%';
        }
        if (rightMessage) {
          rightMessage.style.width = '90%';
          rightMessage.style.transition = 'width 0.5s ease';
        }
      } else {
        console.log("this.actif is false"); // Ajoutez ceci
        // Afficher le panneau gauche et masquer le panneau droit
        if (leftPanel) {
          leftPanel.style.transition = 'width 0.5s ease, opacity 0.5s ease';
          leftPanel.style.width = '88%';
          leftPanel.style.display = 'block'; // Corrigez 'blok' en 'block'
        }
        if (rightPanel) {
          rightPanel.style.transition = 'none';
          rightPanel.style.width = '0';
          rightPanel.style.opacity = '0';

          setTimeout(() => {
            rightPanel.style.display = 'none';
          }, 500);
        }
        if (rightMessage) {
          rightMessage.style.width = '88%';
          rightMessage.style.transition = 'width 0.5s ease';
        }
      }
    }
  }
  setupInitialDisplay(): void {
    const leftPanel = document.querySelector('.left') as HTMLElement;
    const rightPanel = document.querySelector('.right') as HTMLElement;

    if (window.innerWidth <= 780) {
      if (this.actif) {
        // Si actif, afficher le panneau droit
        leftPanel.style.display = 'none';
        rightPanel.style.display = 'block'; // Afficher le panneau droit
      } else {
        // Si inactif, afficher le panneau gauche
        leftPanel.style.display = 'block';
        rightPanel.style.display = 'none'; // Masquer le panneau droit
      }
    }
  }
  navProfile(user: User) {

    this.router.navigate(['/profile', user.id]).then(() => {
      window.location.reload();
    });
  }
  async isUserInChat(groupe: Groupe, userId: number) {
    const users = await this.chatService.getChatMembers(groupe.chat.id).toPromise();
    for (let user of users) {
      if (user.id === userId) {
        this.isMemberGroup = true;
        return;
      }
    }
  }



  async checkFriendStatus(follower: any): Promise<void> {
    // Vérifiez si le follower est ami avec l'utilisateur actuel
    const isFriend = await this.followService.isFollowing(this.user.id, follower.id).toPromise();

    // Ajoutez la propriété `isFriend` au follower pour l'affichage
    follower.isFriend = isFriend;
  }
  loadChatUsers() {
    // Supposons que cette méthode charge la liste des utilisateurs dans `filteredUserChat`
    // Après avoir chargé la liste, vérifiez leur statut d'amitié
    for (const chatUser of this.filteredUserChat) {
      this.checkFriendStatus(chatUser);
    }
  }
  // Méthode pour charger les followers et vérifier leur statut d'amitié
  async loadFollowers(id: number) {
    this.followService.getFollowers(id).subscribe(
      async (followers: any[]) => {
        this.followers = followers;

        // Vérifiez le statut d'amitié pour chaque follower
        for (const follower of this.followers) {
          await this.checkFriendStatus(follower);
        }

        console.log("Followers with friendship status:", this.followers);
      },
      (error) => {
        console.error("Erreur lors du chargement des followers:", error);
      }
    );
  }
}