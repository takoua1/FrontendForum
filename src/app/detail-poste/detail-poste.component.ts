import { ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, QueryList, Renderer2, ViewChild, ViewChildren, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Poste } from '../model/poste';
import { User } from '../model/user';
import { CommentComponent } from '../shared/comment/comment.component';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { PosteService } from '../services/poste.service';
import { NotificationService } from '../services/notification.service';
import { InteractionService } from '../services/interaction.service';
import { BlockService } from '../services/block.service';
import { TokenStorageService } from '../services/token-storage.service';
import { CommentService } from '../services/comment.service';
import { Notification } from '../model/notification';
import { Interaction } from '../model/interaction';
import { Comment } from '../model/comment';
import { SignaleService } from '../services/signale.service';
import { Signale } from '../model/signale';
import { SharedService } from '../shared/shared.service';
import { MatSnackBar } from '@angular/material/snack-bar';
export interface Report {
  type: string;
  description: string;  // Ajoutez cette ligne si elle est manquante
}
@Component({
    selector: 'app-detail-poste',
    templateUrl: './detail-poste.component.html',
    styleUrl: './detail-poste.component.css',
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class DetailPosteComponent implements OnInit {
  currentUser: any;
  user: User = new User();
  notifications: any[] = [];
  notificationsList: any[] = [];
  unreadCount: number = 0;
  showNotificationPopup: boolean = false;
  selectedPost:any;
  comment: Comment;
  notification:Notification;
  matchingIcon: any;
  isActive:any;
  increment = 10;
  textLimit = 100;
   showChilds:{ [key: number]: boolean } = {};
  commentsToShow: { [postId: string]: number } = {};
  textareaVisibility: { [key: string]: boolean } = {};
  isLike:  { [key: string]: boolean } = {};
  isDislike:  { [key: string]: boolean } = {};
  totalLikesMap: { [postId: number]: number } = {};
  totalDislikesMap: { [postId: number]: number } = {};
  textareaContent: string = '';
  reponseMessage: any;
  categorySelected: boolean = false;
  commentForm: any = FormGroup;
  isPopupPosteVisible: boolean = false;
  isOverlayVisible: boolean = false;
  filteredComments: any[] = [];
  commentHierarchy: Comment[] = [];
  postId!: number;
  notifId!:number;
  not:any ;
  poste:any
  errorMessageSignale = '';
  isSignalePoste: boolean = false;
  isSignaleComment:boolean = false;
  isModifierVisible = true;
  isAjoutVisible = true;
  imageUrl: string | ArrayBuffer | null = null;
  hasImage: boolean = false;
  fileImage: File | null = null;
  selectedFiles?: FileList;
  posteForm: any = FormGroup;
  selectedCategory = 'Catégorie';
  deleteImage:boolean=false;
  errorMessage :string | null = null;;
  errorMesCateg : string |  null = null;
  submissionAttempted: boolean = false;
  filteredPostes: Poste[] = [];
  isDeletePoste: boolean = false;
  isDeleteComment: boolean = false;
  filteredChildComments : any[] = [];
  isUserAuthenticated: boolean = false;
  @ViewChild(CommentComponent) childComponent!: CommentComponent; 
  @ViewChild('popupSignale') popupSignale: ElementRef ;
  @ViewChild('overlay') overlay: ElementRef ;
  report: Report = {
    type: '',
    description: ''
  };
 
  categories = [
    { name: 'Jeux', icon: 'bx bx-game', selected: false },
    { name: 'Education', icon: 'bx bxs-pen', selected: false },
    { name: 'Musique', icon: 'bx bx-music', selected: false },
    { name: 'Politique', icon: 'bx bxs-user-voice', selected: false },
    { name: 'Sport', icon: 'bx bx-football', selected: false },
  ] 
  reportTypes = [
    'Contenu à caractère sexuel',
    'Contenu violent ou abject',
    'Contenu abusif ou incitant à la haine',
    'Harcèlement ou intimidation',
    'Actes dangereux ou pernicieux',
    'Informations incorrectes',
    'Maltraitance d\'enfants',
    'Incitation au terrorisme',
    'Spam ou contenu trompeur',
    
  ];
  currentStep = 1;
  reportType: string = '';
  reportDescription: string = '';
  isPopupVisible: boolean = false;
  isDropdownVisible = true;
  @ViewChildren(CommentComponent) commentComponents: QueryList<CommentComponent>;
    @ViewChild('popupPoste') popupPoste: ElementRef ;

  @ViewChild('popupSupp', { static: false }) popupDelete!: ElementRef;
    constructor(private authService:AuthService, private userService: UserService,private snackBar: MatSnackBar,
      private posteService: PosteService,  private formBuilder: FormBuilder, private router :Router,
      private token: TokenStorageService,private notifService:NotificationService,private readonly changeDetectorRef: ChangeDetectorRef,
      private renderer: Renderer2, private interaService:InteractionService,private cdr: ChangeDetectorRef, private cdRef: ChangeDetectorRef,
      private commentService:CommentService, private blockService:BlockService,private route: ActivatedRoute, private signaleService :SignaleService, private sharedService:SharedService) {
    
    }

   
  async ngOnInit(): Promise<void>  {
   
   
    this.postId=  Number(this.route.snapshot.paramMap.get('id'));
    this.posteForm = this.formBuilder.group({
      messagePoste: ['', Validators.required]

    });
    this.isAuthenticated();
    this.commentForm = new FormGroup({
      messageComment: new FormControl('')
    });
    this.currentUser = this.token.getUser();
   await this.findUser(this.currentUser.username)
    this.notifId = this.route.snapshot.queryParams['notifId'];
  console.log('notification id:', this.notifId);

 
     
     
    if( this.notifId)
     {   console.log('Notification chargée:', this.not);
      this.not = await this.notifService.findByIdNotification(this.notifId).toPromise();
        // Mise à jour de selectedPost avec les données du poste
        this.selectedPost = this.not.poste;
        console.log("this.selectedPost:", this.selectedPost);

      

       this.matchingIcon = this.categories.find(catIcon => catIcon.name === this.not.poste.category);
       
       this.openPostPopup(this.not.poste);
     }


else 
{

  this.poste = await this.posteService.getPosteById(this.postId).toPromise();
  console.log('Notification chargée:', this.not);

  // Mise à jour de selectedPost avec les données du poste
  this.selectedPost = this.poste;
  console.log("this.selectedPost:", this.selectedPost);



 this.matchingIcon = this.categories.find(catIcon => catIcon.name === this.poste.category);
 
 this.openPostPopup(this.poste);

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
  isAuthenticated(){
    const user = this.token.getToken(); 
    this.isUserAuthenticated = user !== null; 
    console.log(this.isUserAuthenticated); 

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
  openPostPopup(poste: any ) {
   
    this.currentUser = this.token.getUser();
    this.findUser(this.currentUser.username).then(() => {
    this.loadFilteredComments(poste).then(() => {
    this.loadCommentsForPoste(poste);
    this.loadLikeInteraction(poste);
    this.loadDislikeInteraction(poste);
    this.getTotalLikes(poste);
    // Utilisez un délai pour attendre que `filteredComments` soit rempli
  
  // Affichez les commentaires après que `loadFilteredComments` a mis à jour `filteredComments`
  this.filteredComments.forEach((comment, index) => {
      console.log(`Index: ${index}, Comment ID: ${comment.id}, Content: ${comment.content}`);
  });
  
  
  
    this.matchingIcon = this.categories.find(catIcon => catIcon.name === poste.category);
    if(this.notifId)
  {
    setTimeout(() => {
      if (this.not.comment) {
          console.log("Notification comment:", this.not.comment);
         
         
  
 this.commentService.getCommentHierarchy(this.not.comment.id).subscribe(
  (hierarchy) => {
      this.commentHierarchy = hierarchy;
      console.log("Comment Hierarchy:", this.commentHierarchy);
      const firstComment = this.commentHierarchy[0];
      const targetIndex = this.filteredComments.findIndex(comment => comment.id === firstComment.id);
      console.log("targetIndex",targetIndex)
     this.commentsToShow[this.not.poste.id] = Math.ceil((targetIndex + 1) / 10) * 10;
    
      this.scrollToComment(firstComment.id.toString());
  },
  (error) => {
      console.error('Erreur lors du chargement de la hiérarchie des commentaires:', error);
  }
  );
  }
  }, 100);}
  });
});
  }
      
  
  
  expandHierarchy(hierarchy: Comment[]) {
  hierarchy.forEach(comment => {
  // Assurez-vous que chaque niveau est "ouvert" ou visible
  this.commentsToShow[this.selectedPost!.id] = Math.max(this.commentsToShow[this.selectedPost!.id], hierarchy.length * 10);
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
  loadNotification(notifId: number): void {
    this.notifService.findByIdNotification(notifId).subscribe(
      (notif) => {
        this.not = notif;
        console.log('Notification chargée:', this.notification);
      },
      (error) => {
        console.error('Erreur lors du chargement de la notification', error);
      }
    );
  }
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
    
  toggleExpand(poste: any): void {
    poste.expanded = !poste.expanded;
  }
  isTextOverflow(message: string): boolean {
    return message.length > 100; // Modifier la limite ici si nécessaire
  }
  
    toggleCommentParents(comments: any[], targetCommentId: string) {
      for (const comment of comments) {
        if (comment.childComments && comment.childComments.some((child: any) => child.id === targetCommentId)) {
          
          this.showChilds[comment.id] = true;
          
          this.toggleCommentParents(this.selectedPost!.comments, comment.id.toString());
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
      const enabledComments = this.selectedPost.comments.filter((comment:any)=> comment.enabled);
  
      // Mettre à jour le nombre de commentaires activés
      this.commentsToShow[this.selectedPost!.id] = enabledComments.length;
    
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
    user.nom = this.user.nom;
    user.prenom = this.user.prenom;
    user.username = this.user.username;
    user.role = this.user.role;
    user.tel = this.user.tel;
    user.password = this.user.password;
    user.pays = this.user.pays; user.id = this.user.id;
   
    let comment = new Comment();
    comment.text = this.commentForm.get('messageComment').value;
    comment.user = this.user;
    comment.poste = p;
    comment.enabled=true;
    comment.dateCreate= new Date();
    console.log(p);
    console.log("user comment", user);
    console.log(comment);
    this.selectedPost=poste;
   let notif=new  Notification;
   notif.enabled=true;
    notif.actor= this.user;
 let messageTruncate :string =this. truncateText(comment.text,15);

    notif.message= `${this.user.nom} a commenté ${this. truncateText(comment.text,15)}sur votre post ${this. truncateText(poste.message,30)}`;
    notif.recipients=[poste.user];
    notif.reaction="commente";
    notif.poste=p;
   
    notif.read=false;
    
 const reponse= await  this.commentService.addCommentToPost(comment).toPromise();
 
        
       
        this.reponseMessage = reponse;
        notif. comment=reponse;
       

      //  const index = this.filteredPostes.findIndex(p => p.id === poste.id);
       // console.log('Filtered Postes IDs:', this.filteredPostes.map(p => p.id));
        console.log('Poste ID à mettre à jour:', poste.id);
       // console.log('Index trouvé:', index);
    
       //* if (index !== -1) {
         // console.log('Commentaires existants avant ajout:', this.filteredPostes[index].comments);
          
        /*  if (!this.filteredPostes[index].comments) {
              this.filteredPostes[index].comments = []; // Assurez-vous que les commentaires sont initialisés
          }*/
      
          // Affichez le commentaire à ajouter
          console.log('Commentaire à ajouter:', comment);
         
          // Mettez à jour le poste dans filteredPostes
         // console.log('Poste avant mise à jour:', this.filteredPostes[index]);
         /* this.filteredPostes[index] = {
              ...this.filteredPostes[index],
              comments: [...this.filteredPostes[index].comments, reponse] // Ajouter le commentaire
          };*/
         // 
        //  console.log('Poste après mise à jour:', this.filteredPostes[index]);
         if(this.selectedPost)

     {  this.selectedPost.comments.push(reponse)
      this.loadCommentsForPoste(this.selectedPost);
       this.loadFilteredComments(this.selectedPost)
          this.commentsToShow[this.selectedPost.id] =  10;
          this.textareaVisibility[this.selectedPost.message]=false;
          
     }
      //} else {
         // console.warn('Poste non trouvé dans la liste des postes.');
     // }
      
     
  this.posteService.getPosteById(poste.id).subscribe(
    updatedPoste => {
        poste = updatedPoste;
      
  
    if(notif.actor.id!== p.user.id)
      { this.notifService.onSendNotification(notif);}
  })
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

  onTypeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.reportType = input.value;
  }

  goToNextStep(): void {
    if (this.reportType) {
      this.currentStep = 2;
    } else {
      this.errorMessageSignale = 'Veuillez sélectionner un raison!';
    }
  }
  openPopupSignale(poste:Poste) {
    this.selectedPost=poste;
    this.popupSignale.nativeElement.style.display = 'block';
  
    this.isOverlayVisible=true;
    // Ajout d'un seul écouteur pour la fermeture du popup
    //this.overlay.nativeElement.addEventListener('click', this.closePopup.bind(this));
  }
  
  closePopup(event: MouseEvent) {
    if (event.target === this.overlay.nativeElement) {
      this.popupSignale.nativeElement.style.display = 'none';
      this.overlay.nativeElement.style.display = 'none';
      // Supprimer l'écouteur après fermeture
    //  this.overlay.nativeElement.removeEventListener('click', this.closePopup.bind(this));
      this.currentStep=1;
    }
  }
  
  closeSignale() {
   // this.closePopup({ target: this.overlay.nativeElement } as MouseEvent);
    
    this.popupSignale.nativeElement.style.display = 'none';
    
      this.isOverlayVisible=false;
      const overlay = document.querySelector('.overlay') as HTMLElement;

   
      overlay.style.display = 'none';
      this.currentStep=1;
  }
sendSignale()
{
  let signale= new Signale();
  
  signale.raison=this.reportType;
  signale.description=this.reportDescription;
  signale.user=this.user;

  if(this.isSignalePoste===true)
  {
    signale.titre="Signaler un Poste";
    signale.poste!=this.selectedPost;
  }
  if(this.isSignaleComment===true)
    {
      signale.titre="Signaler un Commentaire";
      signale.comment=this.comment;
    }
  signale.estTraite=false;
  this.signaleService.sendSignale(signale);
  this.closeSignale();
  console.log("signlae", signale);

  this.reportDescription='';
  
}
modifierPoste() {

   

  let poste = new Poste();

  let user = new User();
  user.id = this.user.id;
  user.nom = this.user.nom;
  user.prenom = this.user.prenom;
  user.username = this.user.username;
  user.role = this.user.role;
  user.tel = this.user.tel;
  user.password = this.user.password;
  user.pays = this.user.pays;
  poste.message = this.posteForm.controls.messagePoste.value;
  poste.category = this.selectedCategory;
  poste.user = user;
  this.errorMessage = null;
  this.errorMesCateg = null;
  this.submissionAttempted = true;

  if (this.posteForm?.controls.messagePoste.errors?.required) {
    this.errorMessage = 'Remplir Ta Question !';

  }
  else if (this.selectedCategory === 'Catégorie') {
    this.errorMesCateg = 'Choisir ton Catégorie !';
  }
 
  else {
 
  this.posteService.updatePoste(poste.message, this.selectedCategory, this.fileImage,this.deleteImage,this.selectedPost!.id).subscribe(
    (updatedPoste: Poste) => {
      console.log('Poste mis à jour:', updatedPoste);
      this.reponseMessage = updatedPoste;
       
      console.log("this.reponseMessage", this.reponseMessage); // Cela devrait s'afficher

   
    
    

      this.selectedPost =updatedPoste;
   /*   let notif= new Notification();
     
       if(this.not!.reaction==='dislike')
        
    {  
      notif.message=`${this.not!.actor.nom} n'aime pas votre poste ${this.truncateText(updatedPoste.message,15)} `;
     
    
    
    }
    else if(this.not!.reaction==='like')
    {
      notif.message=`${this.not!.actor.nom} aime votre poste ${this.truncateText(updatedPoste.message,15)} `;

    }
    notif.actor= this.not!.actor;
    notif.reaction=this.not!.reaction;
    notif.read=this.not!.read;
    notif.recipients=[updatedPoste.user];    
     notif.poste=updatedPoste;
     notif.enabled=this.not!.enabled;
     notif.comment=this.not!.comment;
     notif.interaction=this.not!.interaction;
     notif.dateCreate=this.not!.dateCreate;

     this.notifService.updateNotification(this.not!.id,notif).subscribe(
      (response) => {
   
       
        console.log('Notification mise à jour avec succès', response);
      },
      (error) => {
        console.error('Erreur lors de la mise à jour de la notification', error);
      }
    );*/
    this.matchingIcon = this.categories.find(catIcon => catIcon.name === updatedPoste.category);
   
    this.posteForm.reset();
    this.closePopupOverlay();
},
    (error) => {
      console.error('Erreur lors de la mise à jour du poste:', error);
    
    }
  );


  console.log('Fonction Modifier appelée');
 
      
}}
closePopupOverlay() {
  this.isOverlayVisible = false;
  this.isPopupVisible = false;
  this.isPopupPosteVisible=false;

 
  const popupDelete = document.querySelector('.popupDelete') as HTMLElement;
  const overlay = document.querySelector('.overlay') as HTMLElement;

 
    popupDelete.style.display = 'none';
    overlay.style.display = 'none';

 
 
}
performAction() {

  if (this.isModifierVisible) {
    this.modifierPoste();
  }
  else if (this.isAjoutVisible) {
    

  }
}
toggleAction(action: string) {
  if (action === 'modifier') {
    this.isModifierVisible = true;
    this.isAjoutVisible = false;
  } else if (action === 'ajout') {
    this.isModifierVisible = false;
    this.isAjoutVisible = true;
  }
}

removeImage() {
  this.imageUrl = null;
  this.deleteImage=true;
  const dropText = document.querySelector('.drag-text');
  dropText?.classList.remove('active');
  const uploadImage = document.querySelector('.upload-button');
  uploadImage?.classList.remove('active');
  const deleteIcone = document?.querySelector('.delete-icon');
  deleteIcone?.classList.remove('active');
}
togglePopupModifier(poste: any, action: string) {

/*   const popupCardUser = document.querySelector('.popupCardUser') as HTMLElement;
  const overlay = document.querySelector('.overlay') as HTMLElement;
  popupCardUser.style.display = 'block';
  overlay.style.display = 'block';
 
  overlay.addEventListener('click', function () {
    location.reload();
    popupCardUser.style.display = 'none';
    overlay.style.display = 'none';

  });*/
  const overlay = document.querySelector('.overlay') as HTMLElement;

  overlay.style.display = 'block';
  this.isOverlayVisible = true;
  this.isPopupVisible = true;
  const closePopup = (event: MouseEvent) => {
    if (event.target === overlay) {
      this.closePopupOverlay();
    overlay.removeEventListener('click', closePopup);
    }
  };

  overlay.addEventListener('click', closePopup);
 
  console.log(poste);
  this.selectedPost = poste;
  this.selectedPost! .id = poste.id;
  this.imageUrl = poste.image;
  console.log("image poste",poste.image);
  console.log("test image", this.imageUrl);
/*  if (this.imageUrl === null) {
    const dropText = document.querySelector('.drag-text');
    dropText?.classList.add('active');
    const uploadImage = document.querySelector('.upload-button');
    uploadImage?.classList.add('active');
    const deleteIcone = document?.querySelector('.delete-icon');
    deleteIcone?.classList.add('active');
  }*/
    this.hasImage = this.imageUrl !== null && this.imageUrl !== '';
 /* if (this.imageUrl !== null) {
   
   const dropText = document.querySelector('.drag-text');
   dropText?.classList.add('active');
   const uploadImage = document.querySelector('.upload-button');
   uploadImage?.classList.add('active');
   const deleteIcone = document?.querySelector('.delete-icon');
   deleteIcone?.classList.add('active');
  }*/
  this.selectedCategory = this.selectedPost! .category;


  console.log(this.selectedPost );
  this.toggleAction(action);
}

onFileDropped($event: any) {
  let files = $event.dataTransfer.files;
  if (files.length > 0) {
    let file = files[0];
    let reader: FileReader = new FileReader();

    if (file) {
      reader.onload = (e: any) => {
        this.imageUrl = e.target.result;
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
onFileSelected(event: any) {
  //let file = event.target.files[0];


  this.selectedFiles = event.target.files;
  if (this.selectedFiles) {
    const file: File | null = this.selectedFiles.item(0);
    if (file) {

      const reader = new FileReader();

      reader.onload = (e: any) => {
        console.log(e.target.result);
        this.imageUrl = e.target.result;
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

clickMenuPopup() {
  const optionMenu = document.querySelector('.select-menu-popup');
  const selectbtn = document.querySelector('.btn-popup');
  selectbtn?.addEventListener('click', () => {
    optionMenu?.classList.toggle('active');
  })
}

deleteObject() {
  console.log("comment etat", this.isDeleteComment);
  console.log(this.comment);

  if (this.isDeletePoste === true) {
    console.log("suppression Poste");


    this.posteService.disablePost(this.selectedPost!.id).subscribe(
      (reponse: any) => {
        this.reponseMessage = reponse;
        console.log(this.reponseMessage),
          this.posteForm.reset();
         
          this.router.navigate(['/home']).then(() => {

            window.location.reload();
          });
        
      
        
      },

      (error) => {

        console.error('Error fetching user:', error);

      }
    );
    this.isDeletePoste = false;
  }
  else if (this.isDeleteComment === true) {
    this.commentService.disableComment(this.comment.id).subscribe(
      (reponse: any) => {
        this.reponseMessage = reponse;
        console.log(this.reponseMessage);
        
   /*     const posteIndex = this.filteredPostes.findIndex(poste => poste.comments.some(comment => comment.id === this.comment.id));
         const commentIndex =this.filteredComments.findIndex(comment=> comment.childComments.some((comment:any) => comment.id === this.comment.id));
         console.log("commentIndex " ,commentIndex )
         console.log("this.filteredComments poste", this.filteredChildComments)
if (posteIndex !== -1) { 
  this.filteredComments = this.filteredComments.filter(comment => comment.id !== this.comment.id);
  // Mettre à jour la liste des commentaires en supprimant le commentaire désactivé
 
 
  this.filteredPostes[posteIndex].comments = this.filteredPostes[posteIndex].comments.filter(comment => comment.id !== this.comment.id);
         this.loadCommentsForPoste(this.selectedPost);
        
  
  this.changeDetectorRef .detectChanges();

}


   else if (commentIndex !== -1)
   {
    
    const newChildComments = this.filteredComments[commentIndex].childComments.filter((childComment: any) => 
      childComment.id !== this.comment.id
    );
  
    this.filteredComments[commentIndex] = {
      ...this.filteredComments[commentIndex],
      childComments: newChildComments // nouvelle liste de sous-commentaires
    };
  
    // Mettre à jour la liste globale des sous-commentaires
    this.filteredChildComments = this.filteredChildComments.filter(comment => comment.id !== this.comment.id);
  
    // Forcer la mise à jour du DOM
    this.changeDetectorRef.detectChanges();*/
  /*  const result = this.findCommentIndex(this.filteredComments, this.comment.id);

    console.log("Résultat de la recherche d'index :", result);
    
    if (result) {
        if (!result.isChild) {
            // Si c'est un commentaire principal
            this.filteredComments.splice(result.index, 1);
            this.loadCommentsForPoste(this.selectedPost);
            this.changeDetectorRef.detectChanges();
            console.log("Commentaire principal supprimé. Liste actuelle des commentaires:", this.filteredComments);
        } else {
          let currentParentComment = this.filteredComments[result.parentIndex!];
          console.log("Parent avant suppression :", currentParentComment);

          // Appeler la fonction récursive pour chercher et supprimer le sous-commentaire
          this.removeChildComment(currentParentComment, this.comment.id);
          this.filteredChildComments=this.deepCopy( currentParentComment.childComments)
          // Mettre à jour les sous-commentaires du parent
          this.changeDetectorRef.detectChanges();}}*/
          this.loadCommentsForPoste(this.selectedPost);
          this.loadFilteredComments(this.selectedPost).then(() => {
           
       
          const posteIndex = this.filteredPostes.findIndex(poste => poste.comments.some(comment => comment.id === this.comment.id));
        
        
          const commentIndex =this.filteredComments.findIndex(comment=> comment.childComments.some((comment:any) => comment.id === this.comment.id));
          console.log("commentIndex " ,commentIndex )
          console.log("this.filteredComments poste", this.filteredChildComments)

   this.filteredComments = this.filteredComments.filter(comment => comment.id !== this.comment.id);
   // Mettre à jour la liste des commentaires en supprimant le commentaire désactivé
  
  
   this.selectedPost.comments = this.selectedPost.comments.filter((comment:any) => comment.id !== this.comment.id);
          
         
   
  

 
     if (commentIndex !== -1)
    {
     
     const newChildComments = this.filteredComments[commentIndex].childComments.filter((childComment: any) => 
       childComment.id !== this.comment.id
     );
   
     this.filteredComments[commentIndex] = {
       ...this.filteredComments[commentIndex],
       childComments: newChildComments // nouvelle liste de sous-commentaires
     };
   
     // Mettre à jour la liste globale des sous-commentaires
     this.filteredComments = this.filteredComments.filter(comment => comment.id !== this.comment.id);
    
     // Forcer la mise à jour du DOM
     this.changeDetectorRef.detectChanges();} else{
   
  this.triggerCommentChange()
 this.loadCommentsForPoste(this.not!.poste);
    this.changeDetectorRef .detectChanges();
 }
 
})



this.isPopupPosteVisible= false;
this.isOverlayVisible=false;
  
    

      },

      (error) => {

        console.error('Error delete:', error);

      }
    );
    console.log("suppression Comment");
    this.isDeleteComment = false;
  }
  this.closePopupOverlay()
}
triggerCommentChange() {
   
  this.childComponent.onChildCommentChange(this.comment);
}

onResirveSignale(event: Comment) {
  this.comment = event;
} 
onResirveConnect(event: Comment) {
  this.comment = event;
} 
onCommentDelete(event: boolean) {
  this.isDeleteComment = event; // Récupérer la valeur de isDeleteComment depuis le composant Comment
}
onCommentsignale(event: boolean) {
  this.isSignaleComment = event; // Récupérer la valeur de isDeleteComment depuis le composant Comment
}

callTogglePopupDelete(poste: any): void {

  this.selectedPost = poste;

  this.sharedService.togglePopupDelete();
  this.isDeletePoste = true;

}
callTogglePopupSignale(poste: any): void {

  this.selectedPost = poste;
  this.sharedService.togglePopupSignale();
  this.isSignalePoste= true;

}

copyPosteLink(poste:any)
  {
    const posteLink = `${window.location.origin}/detail/${poste.id}`;
  navigator.clipboard.writeText(posteLink).then(() => {
    this.snackBar.open('Le lien du poste a été copié dans le presse-papier !', '', {
      duration: 3000, // Durée en ms
    });
  }).catch(err => {
    console.error('Erreur lors de la copie du lien : ', err);
    this.snackBar.open('Échec de la copie du lien', 'Fermer', {
      duration: 3000,
    });
  });
  }
  }
  
  
  

