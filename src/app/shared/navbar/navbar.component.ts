import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, OnInit, QueryList, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { PosteService } from '../../services/poste.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { UserService } from '../../services/user.service';
import { TokenStorageService } from '../../services/token-storage.service';
import { User } from '../../model/user';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../model/notification';
import { CommentComponent } from '../comment/comment.component';
import { Poste } from '../../model/poste';
import { Interaction } from '../../model/interaction';
import { InteractionService } from '../../services/interaction.service';
import { Comment } from '../../model/comment';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommentService } from '../../services/comment.service';
import { FormControl, FormGroup } from '@angular/forms';
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  animations: [
    trigger('notificationAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-100%)' }),
        animate('2000ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('2000ms ease-in', style({ opacity: 0, transform: 'translateY(100%)' }))
      ])
    ])
  ]
})
export class NavbarComponent implements OnInit {
  searchTerm: Subject<string> = new Subject<string>();
  
  isUserAuthenticated:boolean=false;
  currentUser: any;
  user: User = new User();
  notifications: any[] = [];
  notificationsList: any[] = [];
  unreadCount: number = 0;
  showNotificationPopup: boolean = false;
  selectedPost: Poste;
  comment: Comment;
  notification:Notification;
  matchingIcon: any;
  isActive:any;
  increment = 10;
 
   showChilds:{ [key: number]: boolean } = {};
  commentsToShow: { [postId: string]: number } = {};
  textareaVisibility: { [key: string]: boolean } = {};
  isLike:  { [key: string]: boolean } = {};
  isDislike:  { [key: string]: boolean } = {};
  totalLikesMap: { [postId: number]: number } = {};
  totalDislikesMap: { [postId: number]: number } = {};
  textareaContent: string = '';
  reponseMessage: any;
  commentForm: any = FormGroup;
  categories = [
    { name: 'Jeux', icon: 'bx bx-game', selected: false },
    { name: 'Education', icon: 'bx bxs-pen', selected: false },
    { name: 'Musique', icon: 'bx bx-music', selected: false },
    { name: 'Politique', icon: 'bx bxs-user-voice', selected: false },
    { name: 'Sport', icon: 'bx bx-football', selected: false },
  ]
 
  @ViewChildren(CommentComponent) commentComponents: QueryList<CommentComponent>;
    @ViewChild('popupPoste') popupPoste: ElementRef ;
  @ViewChild('overlay') overlay: ElementRef ;
  @ViewChild('popupSupp', { static: false }) popupDelete!: ElementRef;
    constructor(private authService:AuthService, private userService: UserService
      ,private router: Router,private posteService: PosteService,  
      private token: TokenStorageService,private notifService:NotificationService,
      private renderer: Renderer2, private interaService:InteractionService,private cdr: ChangeDetectorRef,private commentService:CommentService) {
      this.user = new User();
    }

  ngOnInit(): void {


    this.commentForm = new FormGroup({
      messageComment: new FormControl('')
    });
    this.searchTerm.pipe(
      debounceTime(300), // Attendez 300ms après la dernière pression de touche
      distinctUntilChanged(), // Ignorez les termes de recherche identiques consécutifs
   ).subscribe(term => {
      if (term === '') {
        this.posteService.resetPostes(); // Restaurez la liste complète des "postes" si le terme de recherche est supprimé
      } else {
        this.posteService.filterPostes(term);
      }
   });
   this.currentUser = this.token.getUser();
   this.findUser(this.currentUser.username);
    this. isAuthenticated();
   window.addEventListener('btnEvent', this.checkSidebarStatus);
   this.settingActive();
  
  this.getUnreadCount();
    this.notifService.getPrivateNotification().subscribe((notif: any) => {
      console.log('Before adding notification, notifications array:', this.notifications);
      if (this.notifications) {
        this.notifications.push(notif);
        this.unreadCount++;
        console.log('Notification added:', notif);
        setTimeout(() => {
          this.notifications = this.notifications.filter(n => n !== notif);
        }, 300000); 
      } else {
        console.error('Notifications array is undefined');
      }
      console.log('After adding notification, notifications array:', this.notifications);
    }, (error:any) => {
      console.error('Error receiving notification:', error);
    });
    this.notifService.notifications$.subscribe(
      notifications => this.notificationsList = notifications
    );

  }


  
  closeNotification(notif: Notification): void {
    this.notifications = this.notifications.filter(n => n !== notif);
  }
  isAuthenticated(){
    const user = this.token.getToken(); 
    this.isUserAuthenticated = user !== null; 
    console.log(this.isUserAuthenticated); 

  }
 async  getUnreadCount(){
  const user = this.token.getUser();
    this.notifService.getUnreadCount(user.username).subscribe((count:number)=>{
      this.unreadCount= count;
      this.cdr.detectChanges();
    })

  }
  toggleNotificationPopup(): void {
    this.showNotificationPopup = !this.showNotificationPopup;
   
      const user = this.token.getUser();
      this.notifService.getNotificationsForUser(user.username).subscribe(notifications => {
        this.notificationsList = notifications;
      });
      this.notifService.markNotificationsAsRead(user.username).subscribe(() => {
        this.unreadCount = 0;
        


      });
      
  }
goToNotification(){
  this.router.navigate(['/notification']);
}
  findUser(username: string): Promise<User> {
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
   
  onProfile()
   {
    this.router.navigate(['/profile', this.user.id]).then(() => {
      // Rafraîchir la page après la navigation
      window.location.reload();
    });  
  }
    

  checkSidebarStatus():void{
    
    const sidebarActive = localStorage.getItem('sidebarActive');
    const navBar =document.querySelector('.navbar');
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
   settingActive():void{
    
    const setting = document.querySelector('.setting');
    const icon =document.querySelector('.bx-cog');
    icon?.addEventListener('click', () => {
       setting?.classList.toggle('active');
   
     } );
  }
  logout(): void {
    console.log(this.user);
    this.authService.logout().subscribe((response) =>{
       
        console.log('Logout successful:', response);
       // Redirection vers la page d'accueil
      },
       (err) => {
        console.error('Logout failed', err);
        // Gérer l'erreur de déconnexion
      }
    );
    this.token.signOut(); // Supprimez toutes les données du session storage
    this.router.navigate(['/home']);
    location.reload();
  }
  login()
  {
    this.router.navigate(['/login']);  
  }
  onSearch(term: string) {
    this.searchTerm.next(term);
 }
 OnMeassages()
 {
  
    this.router.navigate(['/chat']).then(() => {
      // Rafraîchir la page après la navigation
      window.location.reload();
    }); 
  }
  BoiteMail()
  {this.router.navigate(['/mail']).then(() => {
    // Rafraîchir la page après la navigation
    window.location.reload();
  }); 

  }

  formatDate(notification: Notification): string {
    const now = new Date();
    const diff = now.getTime() - new Date(notification.dateCreate).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const years = Math.floor(days / 365);

    if (days < 1) {
      if (hours < 1) {
        // Moins d'une heure
        if (minutes < 1) {
            // Moins d'une minute
            return `${seconds} sec`;
        } else {
            return `${minutes} mn`;
        }
    } else {
        return `${hours} h`;
    }
    } else if (years >= 1) {
      const date = new Date(notification.dateCreate);
      const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
      return formattedDate;
    } else {
      const date = new Date(notification.dateCreate);
      const formattedDate = `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:${date.getMinutes()}`;
      return formattedDate;
    }
    
  }
  loadCommentsForPoste(posteId: number) {
    this.commentService.getCommentsByPostId(posteId).subscribe(
      (comments: any[]) => {
        this.selectedPost.comments = comments.filter(comment => comment.enabled);
        
        
      },
      error => {
        console.error('Error fetching comments:', error);
      }
    );
  }

  openPostPopup(event: MouseEvent, not: any) {
    console.log("Notification post:", not.poste);
    this.loadLikeInteraction(not.poste);
    this.loadDislikeInteraction(not.poste);
    this.getTotalLikes(not.poste);
    this.getTotalDislikes(not.poste);
    if (!not || !not.poste) {
      console.error("Notification or post is undefined");
      return;
    }

    this.selectedPost = not.poste;
    this.loadCommentsForPoste(this.selectedPost.id);
    this.updateCommentsCount();
    this.matchingIcon = this.categories.find(catIcon => catIcon.name === not.poste.category);

    console.log("Matching icon:", this.matchingIcon.name);

    if (!this.popupPoste || !this.overlay) {
      console.error("Popup or overlay element not found");
      return;
    }

    this.renderer.setStyle(this.popupPoste.nativeElement, 'display', 'block');
    this.renderer.setStyle(this.overlay.nativeElement, 'display', 'block');

    const closePopup = (event: MouseEvent) => {
      if (event.target === this.overlay.nativeElement) {
        this.renderer.setStyle(this.popupPoste.nativeElement, 'display', 'none');
        this.renderer.setStyle(this.overlay.nativeElement, 'display', 'none');
        this.overlay.nativeElement.removeEventListener('click', closePopup);
      }
    };

    this.overlay.nativeElement.addEventListener('click', closePopup);

    setTimeout(() => {
      const container = this.popupPoste.nativeElement.querySelector('.containerPopupPoste');
      const comment = this.popupPoste.nativeElement.querySelector('.listeComment');

      if (!container) {
        console.error("Container element not found");
        return;
      }

      if (!comment) {
        console.error("Comment element not found");
        return;
      }

      if (not.comment ) {
        console.log(not.comment);
        this.renderer.addClass(container, 'active');
        this.renderer.addClass(comment, 'active');
        setTimeout(() => {
          const commentId = not.comment.id;
          this.expandParentComments(this.selectedPost.comments, commentId);

          setTimeout(() => {
            const commentElement = document.getElementById('comment-' + commentId);
            if (commentElement) {
              commentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              console.warn("Comment element not found for ID:", commentId);
            }
          }, 1000); // Adjust delay if necessary
        }, 300);
      } else {
        this.renderer.removeClass(container, 'active');
        this.renderer.removeClass(comment, 'active');
      }
    }, 0); // Adjust delay if necessary
  }



  toggleForComment()
  {
    const container = this.popupPoste.nativeElement.querySelector('.containerPopupPoste');
    const comment = this.popupPoste.nativeElement.querySelector('.listeComment');
    this.renderer.addClass(container, 'active');
      this.renderer.addClass(comment, 'active');
  }
  toggleTextarea(object: any): void {

    const container = document.querySelector('.containerPopupPoste');
    const comment = document.querySelector('.listeComment');
    if (object && object.message) {
      this.textareaVisibility[object.message] = !this.textareaVisibility[object.message];
    }

   if( this.textareaVisibility[object.message]=== true)
      {
        container?.classList.add('active');
        console.log( "textArea2",this.textareaVisibility[object.message]);
      }
     else if( this.textareaVisibility[object.message]=== false && this.isActive===true)
      {
        container?.classList.add('active');
        console.log( "textArea1",this.textareaVisibility[object.message]);
      }
      else  {
        container?.classList.remove('active');
        comment?.classList.remove('active');
        console.log( "textArea",this.textareaVisibility[object.message]);
       
      }
  }

  scrollToComment(commentId: string) {
    const commentElement = document.getElementById('comment-' + commentId);
    if (commentElement) {
      commentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      console.warn("Comment element not found for ID:", commentId);
    }
  }
  
  expandParentComments(comments: any[], targetCommentId: string) {
    const findParentRecursive = (comments: any[], targetId: string): boolean => {
      for (const comment of comments) {
        if (comment.id === targetId) {
          // Marquer le commentaire cible comme visible
          this.showChilds[comment.id] = true;
          return true;
        }

        if (comment.childComments && comment.childComments.length > 0) {
          // Chercher récursivement dans les enfants
          if (findParentRecursive(comment.childComments, targetId)) {
            // Marquer le parent comme visible si l'un des enfants contient le commentaire cible
            this.showChilds[comment.id] = true;
            console.log("comment show",comment.id)
            return true;
          }
        }
      }
      return false;
    };

    // Appeler la fonction récursive pour trouver et marquer les parents jusqu'au premier niveau
    findParentRecursive(comments, targetCommentId);
  }

  toggleCommentParents(comments: any[], targetCommentId: string) {
    for (const comment of comments) {
      if (comment.childComments && comment.childComments.some((child: any) => child.id === targetCommentId)) {
        
        this.showChilds[comment.id] = true;
        
        this.toggleCommentParents(this.selectedPost.comments, comment.id.toString());
        console.log("passer la ",this.selectedPost);
      }
    }
  }

  showCommentPath(commentId: string, comments: any[]) {
    comments.forEach(comment => {
      if (comment.id === commentId) {
        comment.showChilds = true; // Show this comment and its children
      } else {
        comment.showChilds = false; // Hide other comments and their children
      }
      if (comment.childComments) {
        this.showCommentPath(commentId, comment.childComments);
      }
    });
  }
  

  
onResirve(event: Comment) {
  this.comment = event;
}
toggleComments(postId: string, comments: Comment[]) {


  // Nombre de commentaires à afficher à chaque fois
  const totalComments = comments.length;

  // Si commentsToShow[postId] n'est pas défini, initialisez-le à increment
  if (!this.commentsToShow[postId]) {
    this.commentsToShow[postId] = this.increment;
  } else {
    // Si tous les commentaires sont déjà affichés, réinitialisez à increment
    if (this.commentsToShow[postId] >= totalComments) {
      this.commentsToShow[postId] = this.increment;
    } else {
      // Sinon, augmentez le nombre de commentaires à afficher
      this.commentsToShow[postId] += this.increment;
      // Assurez-vous que le nombre de commentaires à afficher ne dépasse pas le total
      this.commentsToShow[postId] = Math.min(this.commentsToShow[postId], totalComments);
    }

  }
}
toggleCommentsBackwards(postId: string, comments: Comment[]): void {
  const decrement = 10; // Nombre de commentaires à masquer à chaque fois

  // Si commentsToShow[postId] est inférieur ou égal à decrement, réinitialisez à 0
  if (this.commentsToShow[postId] <= decrement) {
    this.commentsToShow[postId] = 0;
  } else {
    // Sinon, décrémentez le nombre de commentaires à afficher
    this.commentsToShow[postId] -= decrement;
  }
  console.log("back");
}
toggleCommentsPart(postId: string, poste:any, event: MouseEvent) {
  this.commentsToShow[postId] = this.commentsToShow[postId] ? 0 : poste.comments.length;
 
  const container = document.querySelector('.containerPopupPoste');
  const comment = document.querySelector('.listeComment');
 
  const commentPopup = document.querySelector('.commentPopup');
  
 
      if( this.textareaVisibility[poste.message]=== true)
        {  
          container?.classList.add('active');
          
         
        }
        else
          {
            console.log( this.textareaVisibility[poste.message])
          
            container?.classList.toggle('active');
            comment?.classList.toggle('active');
           console.log( "teste comment",comment?.classList.contains('active'));
          }
  
          this.isActive = comment?.classList.contains('active');

 
 console.log(this.isActive);
  const overlay = document.querySelector('.overlay') as HTMLElement;
  overlay?.addEventListener('click', function () {
    container?.classList.remove('active');
            comment?.classList.remove('active');
         
  
  });
 
 
 
}
isTextareaVisible(poste: any): boolean {

  return this.textareaVisibility[poste.message];
}
truncateText(text: string, maxLength: number): string {
  if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
  }
  return text;
}

toggleDislike(poste:Poste){
  let inter = new Interaction();
  this.posteService.getPosteById(poste.id).subscribe(
    updatedPoste => {
        poste = updatedPoste;
        
        if (poste.enabled === true) {
  if (this.isDislike[poste.id.toString()]) {
    this.interaService.getInteractionByUserIdAndPosteIdType(this.user.id, poste.id,"dislike").subscribe(
      (reponse: any) => {
        
        if(reponse){
          inter =reponse;
          console.log(inter);
          console.log(inter.id);
          this.interaService.removeInteraction(inter.id).subscribe(
            (reponce: any) => {
              this.reponseMessage = reponce;
              console.log(this.reponseMessage);
              this.totalDislikesMap[poste.id]--;
            
            },
    
            (error) => {
    
              console.error('Error fetching inter:', error);
    
            }
          );
         
        } },
        (error) => {
    
          console.error('Error fetching inter:', error);
        }
      );
      this.isDislike[poste.id.toString()] = false;

    }else{

inter.user=this.user;
inter.poste=poste;
inter.dislike=1;
inter.type="dislike";
let notif=new  Notification;
notif.actor= this.user;
notif.reaction="dislike";
notif.read=false;
notif.recipients=[poste.user];    
  notif.poste=poste;
 notif.enabled=true;
  notif.message=`${this.user.nom} n'aime pas votre poste ${this.truncateText(poste.message,15)} `;
 this.interaService.onInteractionPoste(inter).subscribe(
  (reponse: any) => {
    this.reponseMessage = reponse;
    console.log(this.reponseMessage);
    this.totalDislikesMap[poste.id]++;
    notif.interaction=reponse;
    if(notif.actor.id!==poste.user.id)
      { this.notifService.onSendNotification(notif);}
    this.interaService.getInteractionByUserIdAndPosteIdType(this.user.id, poste.id,"like").subscribe(
      (reponse: any) => {
        if( reponse){
          let inter =new Interaction();
          inter=reponse;
         
          this.interaService.removeInteraction(inter.id).subscribe(
            (reponse: any) => {
              this.reponseMessage=reponse;
              
              this.totalLikesMap[poste.id]--;
            },(error)=>{
              console.error('Error fetching like interaction:', error);
            }
          )
          this.isLike[poste.id] =false;
        }
      });
    
  },
  (error) => {

    console.error('Error fetching inter:', error);
  }
  
);
this.isDislike[poste.id.toString()] =true;
}
} else {
  this.openPopupInfo();
}
},
(error) => {
console.error('Error fetching poste:', error);
}
);
}

async toggleLike(poste: Poste) {
  let inter = new Interaction();
  
  // Rafraîchissement des données du poste avant d'effectuer une action
  this.posteService.getPosteById(poste.id).subscribe(
      updatedPoste => {
          poste = updatedPoste;
          
          if (poste.enabled === true) {
              if (this.isLike[poste.id]) {
                  this.interaService.getInteractionByUserIdAndPosteIdType(this.user.id, poste.id, "like").subscribe(
                      (reponse: any) => {
                          if (reponse) {
                              inter = reponse;
                              console.log(inter);
                              console.log(inter.id);
                              this.interaService.removeInteraction(inter.id).subscribe(
                                  (reponce: any) => {
                                      this.reponseMessage = reponce;
                                      console.log(this.reponseMessage);
                                      this.totalLikesMap[poste.id]--; 
                                  },
                                  (error) => {
                                      console.error('Error fetching inter:', error);
                                  }
                              );
                          }
                      },
                      (error) => {
                          console.error('Error fetching inter:', error);
                      }
                  );
                  this.isLike[poste.id] = false;
              } else {
                  inter.user = this.user;
                  inter.poste = poste;
                  inter.like = 1;
                  inter.type = "like";
                  
                  let notif = new Notification();
                  notif.actor = this.user;
                  notif.reaction = "like";
                  notif.read = false;
                  notif.recipients = [poste.user];    
                  notif.poste = poste;
                  notif.enabled = true;
                  notif.message = `${this.user.nom} aime votre poste ${this.truncateText(poste.message, 15)} `;
                  
                  this.interaService.onInteractionPoste(inter).subscribe(
                      (reponse: any) => {
                          this.reponseMessage = reponse;
                          console.log(this.reponseMessage);
                          this.totalLikesMap[poste.id]++;
                          notif.interaction = reponse;
                          
                          if (notif.actor.id !== poste.user.id) {
                              this.notifService.onSendNotification(notif);
                          }
                          
                          this.interaService.getInteractionByUserIdAndPosteIdType(this.user.id, poste.id, "dislike").subscribe(
                              (reponse: any) => {
                                  if (reponse) {
                                      let inter = new Interaction();
                                      inter = reponse;
                                      
                                      this.interaService.removeInteraction(inter.id).subscribe(
                                          (reponse: any) => {
                                              this.reponseMessage = reponse;
                                              this.totalDislikesMap[poste.id]--;
                                          },
                                          (error) => {
                                              console.error('Error fetching dislike interaction:', error);
                                          }
                                      );
                                      this.isDislike[poste.id.toString()] = false;
                                  }
                              }
                          );
                      },
                      (error) => {
                          console.error('Error fetching inter:', error);
                      }
                  );
                  this.isLike[poste.id] = true;
              }
          } else {
              this.openPopupInfo();
          }
      },
      (error) => {
          console.error('Error fetching poste:', error);
      }
  );
}

loadLikeInteraction(poste: Poste) {
this.interaService.getInteractionByUserIdAndPosteIdType(this.user.id, poste.id,"like").subscribe(
  (reponse: any) => {
  
    if( reponse)
  {  this.isLike[poste.id] =true;
    console.log(this.isLike[poste.id]);
   }
   else{
    this.isLike[poste.id] =false;
    console.log(this.isLike[poste.id]);
   }
   
  },
  (error) => {
    console.error('Error fetching like interaction:', error);
  }
);


}
loadDislikeInteraction(poste: Poste) {
this.interaService.getInteractionByUserIdAndPosteIdType(this.user.id, poste.id,"dislike").subscribe(
  (reponse: any) => {
   
    if( reponse)
  {  this.isDislike[poste.id.toString()] =true;
    console.log(this.isDislike[poste.id.toString()]);
   
   }
   else{
    this.isDislike[poste.id.toString()] =false;
    console.log(this.isDislike[poste.id.toString()]);
   }
  
  },
  (error) => {
    console.error('Error fetching like interaction:', error);
  }
);
}

getTotalLikes(poste:Poste): void {
this.posteService.getTotalLikes(poste.id)
  .subscribe(totalLikes => {
    this.totalLikesMap[poste.id] = totalLikes;
  
    console.log("Total likes for post with ID " + poste.id + ": " + totalLikes);
  });
}
getTotalDislikes(poste:Poste): void {
this.posteService.getTotalDislikes(poste.id)
  .subscribe(totalDislikes => {
    this.totalDislikesMap[poste.id] = totalDislikes;
  
    console.log("Total likes for post with ID " + poste.id + ": " +totalDislikes);
  });
}

PopupDelete( not: any): void {
  this.notification=not;
  this.renderer.setStyle(this.popupDelete.nativeElement, 'display', 'block');
  this.renderer.setStyle(this.overlay.nativeElement, 'display', 'block');

  const closePopup = (event: MouseEvent) => {
    if (event.target === this.overlay.nativeElement) {
      this.closePopupDelete();
      this.overlay.nativeElement.removeEventListener('click', closePopup);
    }
  };

  this.overlay.nativeElement.addEventListener('click', closePopup);
}
closePopupDelete(): void {
  this.renderer.setStyle(this.popupDelete.nativeElement, 'display', 'none');
  this.renderer.setStyle(this.overlay.nativeElement, 'display', 'none');
}
confirmDelete(): void { 
  this.notifService.disableNotification(this.notification.id).subscribe(() => {
    // Mise à jour de la liste des notifications
    this.notificationsList = this.notificationsList.filter(not => not.id !== this.notification.id);
    // Fermeture du popup
    this.closePopupDelete();
  
  })}
  updateCommentsCount(): void {
   
    // Filtrer les commentaires activés
    const enabledComments = this.selectedPost.comments.filter(comment => comment.enabled);

    // Mettre à jour le nombre de commentaires activés
    this.commentsToShow[this.selectedPost.id] = enabledComments.length;
  
}

getSortedComments(comments: Comment[]): Comment[] {
  // Trier les commentaires par date de création
  return comments.slice().sort((a, b) => {
    return new Date(b.dateCreate).getTime() - new Date(a.dateCreate).getTime();
  });
}
adjustTextareaSize(event: Event): void {
  const textarea = event.target as HTMLTextAreaElement;
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}
addNewLine(): void {
  this.textareaContent += '\n';
}

getActiveComments(poste: Poste): Comment[] {

  return poste.comments.filter(comment => comment.enabled) ;
}

async addCommentToPost(poste: Poste) {
  let p = new Poste();
  p.id = poste.id;
  p.message = poste.message;
  p.category = poste.category;
  p.dateCreate = poste.dateCreate;
  p.user = poste.user;

  let user = new User();
  user.id = this.user.id;
  user.nom = this.user.nom;
  user.prenom = this.user.prenom;
  user.username = this.user.username;
  user.role = this.user.role;
  user.tel = this.user.tel;
  user.password = this.user.password;
  user.pays = this.user.pays;
  let comment = new Comment();
  comment.text = this.commentForm.get('messageComment').value;
  comment.user = user;
  comment.poste = p;
  comment.enabled=true;
  
  console.log(p);
  console.log("user comment", user);
  console.log(comment);
 let notif=new  Notification;
 notif.enabled=true;
  notif.actor= this.user;
let messageTruncate :string =this. truncateText(comment.text,15);

  notif.message= `${this.user.nom} a commenté ${this. truncateText(comment.text,15)}sur votre post ${this. truncateText(poste.message,30)}`;
  notif.recipients=[poste.user];
  notif.reaction="commente";
  notif.poste=p;
 
  notif.read=false;
  
 this.commentService.addCommentToPost(comment).subscribe(
    (reponse: any) => {
      comment =reponse;
     
      this.reponseMessage = reponse;
      notif. comment=reponse;poste.comments.push(comment);
     
     
    },
    (error) => {

      console.error('Error add comment:', error);
    }
  );
  

this.posteService.getPosteById(poste.id).subscribe(
  updatedPoste => {
      poste = updatedPoste;
      if(poste.enabled===false)
  this.openPopupInfo();
else{
  if(notif.actor.id!== p.user.id)
    { this.notifService.onSendNotification(notif);}
}

},
(error) => {
console.error('Error fetching poste:', error);
});
  this.textareaVisibility[poste.message]=false;
  
}


openPopupInfo()
{
  const popupInform = document.querySelector('.popupInform') as HTMLElement;
  const overlay = document.querySelector('.overlay') as HTMLElement;
  popupInform.style.display = 'block';
  overlay.style.display = 'block';
  overlay.addEventListener('click', function () {
    popupInform.style.display = 'none';
    overlay.style.display = 'none';

  });
}
validerInform()
{window.location.reload();



}
togglePopup(event: MouseEvent) {
const popupContent = (event.currentTarget as HTMLElement).nextElementSibling;
if (popupContent) {
  (popupContent as HTMLElement).style.display = ((popupContent as HTMLElement).style.display === 'block') ? 'none' : 'block';
}
}
}


