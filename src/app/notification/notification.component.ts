import { ChangeDetectorRef, Component, ElementRef, Input, OnInit, QueryList, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import { NotificationService } from '../services/notification.service';
import { TokenStorageService } from '../services/token-storage.service';
import { Poste } from '../model/poste';
import { Notification } from '../model/notification';
import { UserService } from '../services/user.service';
import { User } from '../model/user';
import { CommentComponent } from '../shared/comment/comment.component';
import { Interaction } from '../model/interaction';
import { InteractionService } from '../services/interaction.service';
import { PosteService } from '../services/poste.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommentService } from '../services/comment.service';
import { Comment } from '../model/comment';
import { FormControl, FormGroup } from '@angular/forms';
import { BlockService } from '../services/block.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-notification',
  
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css',
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
export class NotificationComponent implements OnInit{
  notificationsList:Notification[] = [];
  selectedPost: Poste;
  comment: Comment;
  notification:Notification;
  matchingIcon: any;
  isActive:any;
  increment = 10;
  user: User = new User();currentUser:any;
   showChilds:{ [key: number]: boolean } = {};
  commentsToShow: { [postId: string]: number } = {};
  commentsChildShow: { [postId: string]: number } = {};
  textareaVisibility: { [key: string]: boolean } = {};
  isLike:  { [key: string]: boolean } = {};
  isDislike:  { [key: string]: boolean } = {};
  totalLikesMap: { [postId: number]: number } = {};
  totalDislikesMap: { [postId: number]: number } = {};
  textareaContent: string = '';
  reponseMessage: any;
  isOverlayVisible: boolean = false;
  isPopupPosteVisible: boolean = false;
  filteredComments: any[] = [];
  commentHierarchy: Comment[] = [];
  categories = [
    { name: 'Jeux', icon: 'bx bx-game', selected: false },
    { name: 'Education', icon: 'bx bxs-pen', selected: false },
    { name: 'Musique', icon: 'bx bx-music', selected: false },
    { name: 'Politique', icon: 'bx bxs-user-voice', selected: false },
    { name: 'Sport', icon: 'bx bx-football', selected: false },
  ]
  commentForm: any = FormGroup;
    @ViewChildren(CommentComponent) commentComponents: QueryList<CommentComponent>;
    @ViewChild('popupPoste') popupPoste: ElementRef ;
  @ViewChild('overlay') overlay: ElementRef ;
  @ViewChild('popupDelete', { static: false }) popupDelete!: ElementRef;
  isUserAuthenticated: boolean = false;
  constructor(private notifService:NotificationService,private readonly changeDetectorRef: ChangeDetectorRef,private blockService:BlockService,
    private token :TokenStorageService, private userService :UserService,private authService:AuthService,
    private interaService:InteractionService,private router:Router,
     private posteService:PosteService,private renderer: Renderer2, private commentService:CommentService){

  }
  ngOnInit(): void { 
    
  
    this.currentUser = this.token.getUser();
    this.findUser( this.currentUser.username);
    this.listeNotification();
    this.notifService.notifications$.subscribe(
      notifications => this.notificationsList = notifications
    );
   
    this.commentForm = new FormGroup({
      messageComment: new FormControl('')
    });
    this.isAuthenticated();
  }

 
  isAuthenticated(){
    const user = this.token.getToken(); 
    this.isUserAuthenticated = user !== null; 
    console.log(this.isUserAuthenticated); 

  }

   listeNotification() {
    console.log('passer')
    const user =  this.token.getUser();
    console.log()
    this.notifService.getNotificationsForUser(user.username).subscribe
       ((notifications:Notification[]) => {
       
        this.notificationsList = notifications;
        console.log('--------------------', this.notificationsList); // Affiche les notifications une fois récupérées
        // Vous pouvez exécuter d'autres logiques ici qui dépendent des notifications
    } )
      
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
     
     formatDateTime(notification: Notification): string {
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
 
   /* openPostPopup(event: MouseEvent, not: any): void {
      if (!not || !not.poste) {
        console.error("Notification or post is undefined");
        return;
      }
      
      console.log("Notification post:", not.poste);
    
      // Charger les interactions
      this.loadLikeInteraction(not.poste);
      this.loadDislikeInteraction(not.poste);
      this.getTotalLikes(not.poste);
      this.getTotalDislikes(not.poste);
    
      this.selectedPost = not.poste;
      this.loadCommentsForPoste(this.selectedPost.id);
      console.log("this.selectedPost", this.selectedPost);
    
      // Charger l'icône de catégorie
      this.matchingIcon = this.categories.find(catIcon => catIcon.name === not.poste.category);
      if (this.matchingIcon) {
        console.log("Matching icon:", this.matchingIcon.name);
      } else {
        console.warn("Matching icon not found for category:", not.poste.category);
      }
    
      if (!this.popupPoste || !this.overlay) {
        console.error("Popup or overlay element not found");
        return;
      }
    
      // Afficher le popup et l'overlay
      this.renderer.setStyle(this.popupPoste.nativeElement, 'display', 'block');
      this.renderer.setStyle(this.overlay.nativeElement, 'display', 'block');
    
      // Gestion de la fermeture du popup
      const closePopup = (event: MouseEvent) => {
        if (event.target === this.overlay.nativeElement) {
          this.renderer.setStyle(this.popupPoste.nativeElement, 'display', 'none');
          this.renderer.setStyle(this.overlay.nativeElement, 'display', 'none');
          this.overlay.nativeElement.removeEventListener('click', closePopup);
        }
      };
      this.overlay.nativeElement.addEventListener('click', closePopup);
    
      // Délai pour afficher le commentaire (ajuster si nécessaire)
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
    
        // Si une notification est liée à un commentaire spécifique
        if (not.comment) {
          console.log("Notification comment:", not.comment);
      this.toggleCommentsPart(this.selectedPost.id.toString(),this.selectedPost, event)
         // this.renderer.addClass(container, 'active');
         // this.renderer.addClass(comment, 'active');
    
          // Attente pour que les commentaires parents soient affichés
          setTimeout(() => {
            const commentId = not.comment.id;
            this.expandParentComments(this.selectedPost.comments, commentId);
    
            // Délai pour défiler jusqu'au commentaire
            setTimeout(() => {
              const commentElement = document.getElementById('comment-' + commentId);
              if (commentElement) {
                commentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else {
                console.warn("Comment element not found for ID:", commentId);
              }
            }, 300); // Délai ajusté
    
          }, 300); // Délai ajusté
    
        } else {
         this.renderer.removeClass(container, 'active');
         this.renderer.removeClass(comment, 'active');
        }
      }, 0); // Délai pour le chargement du popup
    }*/


      openPostPopup(event: MouseEvent, not: Notification ) {
        this.selectedPost = not.poste;
        
        this.loadFilteredComments(not.poste).then(() => {
        this.loadCommentsForPoste(not.poste);
        this.loadLikeInteraction(not.poste);
        this.loadDislikeInteraction(not.poste);
        this.getTotalLikes(not.poste);
        // Utilisez un délai pour attendre que `filteredComments` soit rempli
   
      // Affichez les commentaires après que `loadFilteredComments` a mis à jour `filteredComments`
      this.filteredComments.forEach((comment, index) => {
          console.log(`Index: ${index}, Comment ID: ${comment.id}, Content: ${comment.content}`);
      });
  
        this.isOverlayVisible = true;
        this.isPopupPosteVisible = true;
      
        this.matchingIcon = this.categories.find(catIcon => catIcon.name === not.poste.category);
        setTimeout(() => {
          if (not.comment) {
              console.log("Notification comment:", not.comment);
             
             
     
     this.commentService.getCommentHierarchy(not.comment.id).subscribe(
      (hierarchy) => {
          this.commentHierarchy = hierarchy;
          console.log("Comment Hierarchy:", this.commentHierarchy);
          const firstComment = this.commentHierarchy[0];
          const targetIndex = this.filteredComments.findIndex(comment => comment.id === firstComment.id);
          console.log("targetIndex",targetIndex)
         this.commentsToShow[not.poste.id] = Math.ceil((targetIndex + 1) / 10) * 10;
        
          this.scrollToComment(firstComment.id.toString());
      },
      (error) => {
          console.error('Erreur lors du chargement de la hiérarchie des commentaires:', error);
      }
  );
}
}, 100);
});
}
          
      

expandHierarchy(hierarchy: Comment[]) {
  hierarchy.forEach(comment => {
      // Assurez-vous que chaque niveau est "ouvert" ou visible
      this.commentsToShow[this.selectedPost.id] = Math.max(this.commentsToShow[this.selectedPost.id], hierarchy.length * 10);
      console.log("Déroulement des commentaires dans la hiérarchie :", comment);
  });
}
       
          
       
            expandHierarchyForTargetComment(postId: number, targetCommentId: number): Promise<void> {
              return new Promise((resolve) => {
                  const expandRecursively = (comments: any[]): boolean => {
                      for (const comment of comments) {
                          if (comment.id === targetCommentId) {
                              // Marquer le commentaire cible comme visible
                              this.commentsToShow[comment.id] = comment.childComments ? comment.childComments.length : 1;
                              resolve(); // Résoudre la promesse lorsque le commentaire cible est trouvé
                              return true;
                          }
          
                          // Si le commentaire a des enfants
                          if (comment.childComments && comment.childComments.length > 0) {
                              // Si un enfant est le commentaire cible, on marque le parent comme visible
                              if (expandRecursively(comment.childComments)) {
                                  this.commentsToShow[comment.id] = comment.childComments.length;
                                  return true;
                              }
                          }
                      }
                      return false;
                  };
          
                  expandRecursively(this.filteredComments);
              });
          }
          
       loadFilteredComments(poste: Poste): Promise<void> {
        return this.getFilteredAndSortedComments(poste).then(filteredComments => {
            this.filteredComments = filteredComments;
            this.changeDetectorRef.detectChanges();
        });
    }
      getFilteredAndSortedComments(poste: Poste): Promise<Comment[]> {
       
        
        const commentPromises: Promise<Comment | null>[] = poste.comments.map(comment => {
          return new Promise((resolve, reject) => {
            // Vérifiez si l'utilisateur actuel a bloqué l'utilisateur du commentaire
            this.blockService.isUserBlocked(this.user.id, comment.user.id).subscribe(
              (isBlockedByCurrentUser) => {
                // Vérifiez également si l'utilisateur du commentaire a bloqué l'utilisateur actuel
                this.blockService.isUserBlocked(comment.user.id, this.user.id).subscribe(
                  (isBlockedByCommentUser) => {
                    // Si ni l'utilisateur actuel n'est bloqué par le propriétaire du commentaire
                    // ni l'inverse, renvoyez le commentaire
                    if (!isBlockedByCurrentUser && !isBlockedByCommentUser) {
                      resolve(comment);  // Renvoie le commentaire
                    } else {
                      resolve(null);  // Renvoie null si l'utilisateur est bloqué
                    }
                  },
                  (error) => {
                    reject(error);
                  }
                );
              },
              (error) => {
                reject(error);
              }
            );
          });
        });
      
        // Utiliser Promise.all pour attendre la résolution de toutes les vérifications
        return Promise.all(commentPromises).then(results => {
          // Filtrer les résultats pour enlever les commentaires bloqués (null)
          const filteredComments = results.filter(comment => comment !== null) as Comment[];
      
          // Trier les commentaires filtrés par date
          return filteredComments.sort((a, b) => new Date(b.dateCreate).getTime() - new Date(a.dateCreate).getTime());
        });
      }
      loadCommentsForPoste(poste: Poste) {
        this.commentService.getCommentsByPostId(poste.id).subscribe(
          (comments: Comment[]) => {
            poste.comments = comments.filter(comment => comment.enabled);
            
            
          },
          error => {
            console.error('Error fetching comments:', error);
          }
        );
        this.changeDetectorRef.detectChanges();
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
  
   /* scrollToComment(commentId: string): void {
      const commentElement = document.getElementById('comment-' + commentId);
      if (commentElement) {
        commentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        console.warn("Comment element not found for ID:", commentId);
      }
    }*/
      scrollToComment(commentId: string) {
        // Attendre que le DOM se mette à jour pour vérifier la présence du commentaire
        setTimeout(() => {
            const targetComment = document.getElementById(`comment-${commentId}`);
            if (targetComment) {
                // Si le commentaire est visible, on scrolle vers lui
                targetComment.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                console.warn('Le commentaire cible n’a pas pu être localisé dans le DOM.');
            }
        }, 100);
    }
    // Fonction récursive pour marquer les parents comme visibles jusqu'au commentaire cible
    expandParentComments(comments: any[], targetCommentId: string): void {
      // Fonction récursive interne pour rechercher le commentaire cible et marquer les parents
      const findParentRecursive = (comments: any[], targetId: string): boolean => {
        for (const comment of comments) {
          // Vérifie que le commentaire est activé avant de vérifier les enfants
          if (comment.enabled) {
            // Si l'ID du commentaire correspond à l'ID cible
            if (comment.id === targetId) {
              this.commentsToShow[comment.id] = 10; // Marquer le commentaire cible comme visible
              return true;
            }
    
            // Vérifie les commentaires enfants s'ils existent
            if (comment.childComments && comment.childComments.length > 0) {
              if (findParentRecursive(comment.childComments, targetId)) {
                this.commentsToShow[comment.id] = 10; // Marquer les parents comme visibles
                console.log("Comment parent marked as visible:", comment.id);
                return true;
              }
            }
          }
        }
        return false; // Retourne false si le commentaire cible n'est pas trouvé dans la hiérarchie actuelle
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
    toggleExpand(poste: any): void {
      poste.expanded = !poste.expanded;
    }
    isTextOverflow(message: string): boolean {
      return message.length > 100; // Modifier la limite ici si nécessaire
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
    this.loadCommentsForPoste(poste);
     
     this.commentsToShow[postId] = this.commentsToShow[postId] ? 0 : 10;
    
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

goToPostDetail(not: Notification) {
  if(not.poste)
{ this.router.navigate(['/detail', not?.poste.id], { queryParams: { notifId: not.id } }).then(() => {

    window.location.reload();
  });}
else{
    this.router.navigate(['/profile', not.actor.id]).then(() => {
      window.location.reload();

    })
  
}}


}