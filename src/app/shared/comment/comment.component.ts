import { Component, Input, OnInit, Output,EventEmitter, ChangeDetectorRef, Renderer2, ElementRef, ViewChild, AfterViewChecked, output, HostListener } from '@angular/core';

import { User } from '../../model/user';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { CommentService } from '../../services/comment.service';
import { Poste } from '../../model/poste';
import { SharedService } from '../shared.service';

import { MatDialog } from '@angular/material/dialog';
import { PopupDeleteComponent } from '../popup-delete/popup-delete.component';
import { ActivatedRoute, Router } from '@angular/router';
import { Interaction } from '../../model/interaction';
import { InteractionService } from '../../services/interaction.service';
import { Comment } from '../../model/comment';
import { Notification } from '../../model/notification';
import { NotificationService } from '../../services/notification.service';
import { BlockService } from '../../services/block.service';
import { forkJoin, map, Observable, tap } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-comment',
    templateUrl: './comment.component.html',
    styleUrl: './comment.component.css',
    standalone: false
})
export class CommentComponent implements OnInit,AfterViewChecked{
 
  @Input() comment: Comment;
  @Input() isReplyVisible: { [key: number]: boolean } = {};
  @Input() user:User;
   poste:Poste;
  @Input() isDeletePost: boolean = false;
  textareaContent: string = '';
  repondForm :any =FormGroup;
 showChild =false;
 @Input() showChilds: { [key: number]: number } = {};
  @Output() replyAdded = new EventEmitter();
  @Output() deleteComment: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() deleteCommentWithInfo: EventEmitter<Comment> = new EventEmitter<Comment>();
  @Output() signaleComment: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() connectComment: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() signaleCommentWithInfo: EventEmitter<Comment> = new EventEmitter<Comment>();
  @Output() connectCommentWithInfo: EventEmitter<Comment> = new EventEmitter<Comment>();
  @Input() comments :Comment[];
  @Input() parentComment: Comment|undefined;
  @Output() commentChanged : EventEmitter<Comment> = new EventEmitter<Comment>();
  @Output() commentShow: EventEmitter<any> = new EventEmitter<any>();
 

  id:number;
  
  commentDelete:Comment;
  isPopupConnectVisible: boolean = false;
  isOverlayVisible:boolean=false;
 @Input() isUserAuthenticated: boolean;
  @ViewChild('textRep') textRep: ElementRef;
  //isCommentsVisible :{ [key: number]: boolean } = {}; 
  replyText = '';
  showComments: boolean = false;
 tag:string;
 tagAdded = false;
 @Input() isCommentsVisible:boolean=false;
 
 showChildComments=false
  reponseMessage:'';
  isHovered: boolean = false;
  isLike:  { [key: number]: boolean } = {};
  isDislike:  { [key: string]: boolean } = {};
  totalLikesMap: { [postId: number]: number } = {};
  totalDislikesMap: { [postId: number]: number } = {};

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
  @ViewChild('popupSignale') popupSignale: ElementRef ;
  @ViewChild('overlay') overlay: ElementRef ;

  currentStep = 1;
  reportType: string = '';
  reportDescription: string = '';
  @Input() commentsToShow: { [postId: number]: number } = {};
  increment = 10;
 @Input()filteredChildComments: any[] = []; 
 
  constructor(private sharedService:SharedService,private router: Router,private  interaService: InteractionService,
    private route: ActivatedRoute,private commentService:CommentService,private renderer: Renderer2,private cdr: ChangeDetectorRef,
     private elementRef: ElementRef,private dialog: MatDialog, private authService: AuthService, private notifService:NotificationService,private blockService: BlockService){
    this.totalLikesMap = {};
    this.totalDislikesMap={};
  
  }
  ngOnInit(): void {
   console.log("this.isUserAuthenticated",this.isUserAuthenticated)
 
    console.log("id:",this.id);
    this.repondForm= new FormGroup({
      messageRepond: new FormControl('')
    });
   
    this.loadLikeInteraction(this.comment);
    this.loadDislikeInteraction(this.comment);
    this.getTotalLikes(this.comment);
    this.getTotalDislikes(this.comment);
    this.loadFilteredChildComments(this.comment);
   this.commentService.listUpdated$.pipe(tap(()=>{
    this.loadFilteredChildComments(this.comment);
   }))
 
  }
  ngAfterViewChecked() {
    // Assurer que textRep est défini après l'initialisation de la vue
    if (this.textRep) {
      this.adjustTextareaSize();
    }
  }
  toggleIcon(state: boolean) {
    this.isHovered = state;
    console.log('toggleIcon called with state:', state);
    console.log('isHovered is now:', this.isHovered);
}
 
toggleComments() {
    this.showComments = !this.showComments;
}
toggleCommentChildsPart(comment: Comment): void {
  // Basculer entre afficher 0 sous-commentaires (fermé) et 10 sous-commentaires (ouvert)
  this.commentsToShow[comment.id] = this.commentsToShow[comment.id] ? 0 : 10;
}

toggleChildComments(commentId: number, childComments: Comment[]) {
  const totalChildComments = childComments.length;

  // Si commentsToShow[commentId] n'est pas défini, initialisez-le à increment
  if (!this.commentsToShow[commentId]) {
    this.commentsToShow[commentId] = this.increment;
  } else {
    // Si tous les sous-commentaires sont déjà affichés, réinitialisez à increment
    if (this.commentsToShow[commentId] >= totalChildComments) {
      this.commentsToShow[commentId] = this.increment;
    } else {
      // Sinon, augmentez le nombre de sous-commentaires à afficher
      this.commentsToShow[commentId] += this.increment;
      // Assurez-vous que le nombre de sous-commentaires à afficher ne dépasse pas le total
      this.commentsToShow[commentId] = Math.min(this.commentsToShow[commentId], totalChildComments);
    }
  }
}

clickEdit(active: boolean) {
  const iconeComment = document.querySelector('.edit-comment');
  const iconeEdit = iconeComment?.querySelector('.bxs-edit-alt');

  if (iconeEdit) {
    iconeEdit.addEventListener('click', () => {
      active = !active; // Toggle the active state
      console.log(active);
      this.isReplyVisible[this.comment.id] = active; // 'this' should now be correctly typed
    });
  }

  this.isReplyVisible[this.comment.id] = active; // Update the visibility based on the initial 'active' state
}


 
  toggleReplyVisibility(comment:Comment) {
    if(this.isUserAuthenticated)
  {  this.isReplyVisible[comment.id] = !this.isReplyVisible[comment.id];
    if (this.isReplyVisible[comment.id]) {
          this.addTagToTextarea(comment);
    }}
    else{
    this.openVerifierconnect()}
    }
     formatComment(comment:any) {
      // Vérifie si le symbole @ suivi du nom d'utilisateur est présent dans la chaîne de caractères
      const pattern = new RegExp(`@${comment.user.nom}\\s*`);
      if (!pattern.test(comment.user.nom)) {
         // Si le symbole @ suivi du nom d'utilisateur n'est pas présent, l'ajoute
         return `@${comment.user.nom} `;
      }
      // Si le symbole @ suivi du nom d'utilisateur est déjà présent, retourne la chaîne telle quelle
       return `@${comment.user.nom} `;
     }
   /* verifierEtAjouterNomUtilisateur(texte: string, comment: any) {
    // Vérifier si le nom d'utilisateur est présent
    const usernamePattern = new RegExp(`@${comment.user.nom}\\s*`);
    if (!usernamePattern.test(texte)) {
        // Si le nom d'utilisateur n'est pas trouvé, l'ajouter avec un espace au début
        texte = `@${comment.user.nom}  ${texte}`;
    } else {
        // Si le nom d'utilisateur est trouvé mais pas l'espace qui le suit, l'ajouter
        const spaceAfterUsernamePattern = new RegExp(`@${comment.user.nom}\\s`);
        if (!spaceAfterUsernamePattern.test(texte)) {
            // Ajouter un espace après le nom d'utilisateur s'il n'est pas présent
            texte = texte.replace(usernamePattern, `@${comment.user.nom} `);
        }
    }
    return texte;
}*/
private verifierEtAjouterNomUtilisateur(texte: string, comment: any): string {
  const usernameRegex = new RegExp(`@${comment.user.nom}`);
  const usernameWithSpace = `@${comment.user.nom}`;

  if (!usernameRegex.test(texte)) {
    texte = `@${comment.user.nom} ` + texte;
  } else {
    const spaceAfterUsernameRegex = new RegExp(`@${comment.user.nom}\\b`);
    if (!spaceAfterUsernameRegex.test(texte)) {
      texte = texte.replace(usernameRegex, usernameWithSpace);
    }
  }
  return texte;
}
adjustTextareaSize() {
  if (this.textRep) {
    const textarea: HTMLTextAreaElement = this.textRep.nativeElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}


  // Vérifier si replyText est défini et non null avant d'utiliser includes
  addTagToTextarea(comment: any): void {
    // Vérifier si replyText est défini et non null
    if (this.replyText !== null && this.replyText !== undefined) {
      const tag = `@${comment.user.nom} ${comment.user.prenom}`; // Créer le tag
      const tagWithSpace = `${tag} `; // Ajouter un espace après le tag
  
      // Vérifier si le tag n'est pas déjà présent dans replyText
      if (!this.replyText.includes(tagWithSpace)) {
        this.replyText += tagWithSpace; // Ajouter le tag au texte de réponse
        this.id = comment.user.id; // Stocker l'ID de l'utilisateur pour référence
      }
    }
  }

  getCommentText(text: string ,comment:Comment): string {
   
    return text.replace(/@(\w+ \w+)/g,  `<a href="/profile/${comment.idtag}">@$1</a>`);
  }

  goToProfile(id: number): void {
    this.router.navigate(['/profile', id]).then(() => {
      window.location.reload();
    });
  }
  
  handleLinkClick(event: MouseEvent, id: number): void {
    event.preventDefault(); // Empêche le comportement par défaut du lien
    this.goToProfile(id);
  }

  addNewLine(): void {
    this.textareaContent += '\n';
  }
  addChildComment(newComment: Comment) {
    if (!this.comment.childComments) {
       this.comment.childComments = [];
    }
    this.comment.childComments.push(newComment);
   }
   extractTextAfterMention(text: string): string {
    const mentionPattern = /@\w+\s*(.*)/;
    const match = text.match(mentionPattern);
    if (match && match[1]) {
        return match[1].trim();
    }
    return text;
  }
  truncateText(text: string, maxLength: number): string {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...';
    }
    return text;
  }
  async addCommentToComment(parentComment: Comment) {
    let newComment = new Comment();
    const messageRepondValue = this.repondForm.get('messageRepond').value;
    console.log("comment", parentComment);
    
    newComment.user = this.user;
    newComment.enabled = true;
    newComment.parentComment = parentComment;
  
    // Récupérer le poste associé au commentaire
    this.poste = await this.commentService.getPosteByCommentId(parentComment.id).toPromise();
  
    // Vérifier si le poste est désactivé avant de continuer
    if (this.poste.enabled === false) {
      this.openPopupInfo();
      return; // Arrêter l'exécution si le poste est désactivé
    }
  
    newComment.text = this.verifierEtAjouterNomUtilisateur(messageRepondValue, this.comment);
    newComment.idtag = this.id;
  
    let notif = new Notification();
    notif.actor = this.user;
    notif.reaction = "commente";
    notif.read = false;
    notif.recipients = [parentComment.user];
    notif.poste = this.poste;
    const newText = newComment?.text ? this.truncateText(this.extractTextAfterMention(newComment.text), 10) : 'un commentaire';
const parentText = parentComment?.text ? this.truncateText(this.extractTextAfterMention(parentComment.text), 10) : 'un commentaire parent';

notif.message = `${this.user.nom} a commenté « ${newText} » sur votre commentaire « ${parentText} »`;
  
    // Ajouter le commentaire enfant au parent
    this.commentService.addCommentToComment(newComment).subscribe(
      (reponse: any) => {
        this.reponseMessage = reponse;
        notif.comment = reponse;
        notif.enabled = true;
        console.log(reponse);
  
        // Mettre à jour le commentaire enfant avec la réponse du serveur
        newComment = reponse;
       // this.addNewChildComment(reponse, parentComment);
        
        if (notif.actor.id !== parentComment.user.id) {
          this.notifService.onSendNotification(notif);
        }
       parentComment.childComments.push(newComment);
       this.filteredChildComments.push(newComment)
       this.isReplyVisible[this.comment.id]= !this.isReplyVisible[this.comment.id];
      this.loadFilteredChildComments(this.comment)
      
        // Mettre à jour l'affichage des sous-commentaires
        this.commentsToShow[parentComment.id] = (this.commentsToShow[parentComment.id] || 0) + 10;
        // Vérifier l'état du parent après l'ajout
      /*  this.commentService.getCommentById(parentComment.id).toPromise().then(updatedParent => {
          if (updatedParent.enabled === false) {
            // Retirer le commentaire si le parent est désactivé
            const index = parentComment.childComments.findIndex(c => c.id === newComment.id);
            if (index > -1) {
              parentComment.childComments.splice(index, 1);
            }
            this.loadFilteredChildComments(this.comment)
           
            this.openPopupInfo();
          } else {*/
            // Envoyer la notification si le parent est toujours actif
            
          //}
       // });
      },
      (error) => {
        console.error('Error add comment:', error);
      }
    );
  
    // Réinitialiser le formulaire et cacher le formulaire de réponse
    this.replyAdded.emit(this.repondForm.value.messageRepond);
    this.repondForm.reset();
    this.replyText = '';
    
   // this.isReplyVisible = false;
    


  }
 /*  toggleIsCommentsVisible(comment:any):void {
    if(comment&& comment.id)
    { this.isCommentsVisible[comment.id] = !this.isCommentsVisible[comment.id];
    }
        }

    isCommentsVisibility(comment:any):boolean{
          return  this.isCommentsVisible[comment.id];
        }
        toggleCommentsVisibility() {
          this.isCommentsVisible = !this.isCommentsVisible;
      }*/
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
        {
          this.loadComments(this.comment);
        
           }

          insertTag() {
            const textarea: HTMLTextAreaElement = this.textRep.nativeElement;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const tag = `@${this.comment.user.nom} `;
        
            // Vérifier si le tag est déjà présent dans le texte
            const tagRegex = new RegExp(`@${this.comment.user.nom}\\b`, 'g');
            if (!tagRegex.test(text)) {
              textarea.value = text.substring(0, start) + tag + text.substring(end);
              this.repondForm.get('messageRepond').setValue(textarea.value);
              textarea.setSelectionRange(start + tag.length, start + tag.length);
              textarea.focus();
            }
          }
         
      togglePopupDelete(event: MouseEvent){
        const popupDelete =document.querySelector('.popupDelete')as HTMLElement;
       const overlay =  document.querySelector('.overlay')as HTMLElement;
       popupDelete.style.display = 'block';
       overlay.style.display = 'block';
       overlay.addEventListener('click', function() {
        popupDelete.style.display = 'none';
        overlay.style.display = 'none';
      
      });
     
        
       
        
       }


     
    
    

       callTogglePopupDelete(comment:Comment): void {
        
        this.deleteComment.emit(true);
        this.deleteCommentWithInfo.emit(comment);
      
        this.sharedService.togglePopupDelete();

    
            }



            callTogglePopupSignale(comment:Comment): void {
              this.signaleComment.emit(true);
              this.signaleCommentWithInfo.emit(comment);
             
              this.sharedService.togglePopupSignale();
      
          
                  }

                  callTogglePopupComment(comment:Comment): void{
                   this.connectComment.emit(true)
                   this.connectCommentWithInfo.emit(comment)
                   this.sharedService.togglePopupConnect();
                  }
           

            onDeleteChildComment(deleted: boolean): void {
              this.deleteComment.emit(deleted);
             
             
          }
           
         async onResirveChildDelete(deleted:Comment)
          {
            this.deleteCommentWithInfo.emit(deleted); 
           this.commentDelete=deleted;
            
          }
          onSignaleChildComment(deleted: boolean): void {
            this.signaleComment.emit(deleted);
        }
         
        onResirveChildSignale(deleted:Comment)
        {
          this.signaleCommentWithInfo.emit(deleted);
        }
  tagUser(comment:Comment)
 {

 const chatButton = document.querySelector('.btnCommIte button:nth-child(3)') as  HTMLButtonElement;

// Ajoutez un écouteur d'événements pour le clic sur le bouton de l'icône de chat
chatButton.addEventListener('click', () => {
  // Récupérez le commentaire parent
  const commentContainer: HTMLElement | null = chatButton.closest('.container');
 const  nom :string= comment.user.nom;
  console.log(nom);
  if (commentContainer) {
      // Récupérez le texte du commentaire
      const commentTextElement: HTMLSpanElement | null = commentContainer.querySelector('span');
     
      if (commentTextElement) {
          const commentText: string = commentTextElement.textContent || '';
          // Créez un tag pour l'utilisateur auquel vous voulez répondre
          const tag: string = '<tag>@nom</tag>'; // Remplacez "nom_utilisateur" par le nom de l'utilisateur

          // Ajoutez le tag au commentaire parent
          commentTextElement.innerHTML += tag;
      }
  }
});
          }

 async  toggleLike(comment: Comment){

  if (this.isUserAuthenticated )
{          let inter = new Interaction();
           this.commentService.getCommentById(comment.id).subscribe(
            updatedComment => {
                comment = updatedComment;
                if(comment.enabled)
         {   if (this.isLike[comment.id]) {
              this.interaService.getInteractionByUserIdAndCommentIdType(this.user.id, comment.id,"like").subscribe(
                (reponse: any) => {
                  
                  if(reponse){
                    inter =reponse;
                    console.log(inter);
                    console.log(inter.id);
                    this.interaService.removeInteraction(inter.id).subscribe(
                      (reponce: any) => {
                        this.reponseMessage = reponce;
                        console.log(this.reponseMessage);
                        this.totalLikesMap[comment.id]--; 
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
                this.isLike[comment.id] = false;
        
            }else{
              inter.user=this.user;
              inter.comment=comment;
              inter.like=1;
              inter.type="like";
              let notif=new  Notification;
              notif.actor= this.user;
              notif.reaction="like";
              notif.read=false;
              this.commentService.getPosteByCommentId(comment.id).subscribe(poste=>{this.poste=poste});
              notif.recipients=[this.comment.user];    
                notif.poste=this.poste;
                notif.comment=comment;
                const commentText = this.extractTextAfterMention(comment.text);
                const truncatedComment = this.truncateText(commentText, 10);
                notif.message = `${this.user.nom} aime votre commentaire « ${truncatedComment} »`;
              this.interaService.onInteractionComment(inter).subscribe(
                (reponse: any) => {
                  
                  this.reponseMessage = reponse;
                  console.log(this.reponseMessage);
                  this.totalLikesMap[comment.id]++;
                  notif.interaction=reponse;
                  if(notif.actor.id!==comment.user.id)
                    { this.notifService.onSendNotification(notif);}
                  this.interaService.getInteractionByUserIdAndCommentIdType(this.user.id, comment.id,"dislike").subscribe(
                    (reponse: any) => {
                      if( reponse){
                        let inter =new Interaction();
                        inter=reponse;
                        this.interaService.removeInteraction(inter.id).subscribe(
                          (reponse: any) => {
                            this.reponseMessage=reponse;
                            this.totalDislikesMap[comment.id]--;
                          },(error)=>{
                            console.error('Error fetching like interaction:', error);
                          }
                        )
                        this.isDislike[comment.id.toString()] =false;
                      }
                    });
                  
                  
                },
                (error) => {
            
                  console.error('Error fetching inter:', error);
                }
                
              );
              this.isLike[comment.id] = true;
            }
          } else {
            this.openPopupInfo();
        }
    },
    (error) => {
        console.error('Error fetching comment:', error);
    }
);}
else{
  this.openVerifierconnect();
}
}

       async  toggleDislike(comment:Comment){

        if(this.isUserAuthenticated)
     {      let inter = new Interaction();
            this.commentService.getCommentById(comment.id).subscribe(
              updatedComment => {
                  comment = updatedComment;
                  if(comment.enabled)
           {
            if (this.isDislike[comment.id.toString()]) {
              this.interaService.getInteractionByUserIdAndCommentIdType(this.user.id, comment.id,"dislike").subscribe(
                (reponse: any) => {
                  
                  if(reponse){
                    inter =reponse;
                    console.log(inter);
                    console.log(inter.id);
                    this.interaService.removeInteraction(inter.id).subscribe(
                      (reponce: any) => {
                        this.reponseMessage = reponce;
                        console.log(this.reponseMessage);
                        this.totalDislikesMap[comment.id]--;
                      
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
                this.isDislike[comment.id.toString()] = false;
        
              }else{
        
          inter.user=this.user;
          inter.comment=comment;
          inter.dislike=1;
          inter.type="dislike";
          let notif=new  Notification;
          notif.actor= this.user;
          notif.reaction="dislike";
          notif.read=false;
          this.commentService.getPosteByCommentId(comment.id).subscribe(poste=>{this.poste=poste;});
          notif.recipients=[this.comment.user];    
            notif.poste=this.poste;
            notif.comment=comment;
            const commentText = this.extractTextAfterMention(comment.text);
            const truncatedComment = this.truncateText(commentText, 10);
            notif.message = `${this.user.nom} n'aime pas votre commentaire « ${truncatedComment} »`;
           this.interaService.onInteractionComment(inter).subscribe(
            (reponse: any) => {
              this.reponseMessage = reponse;
              console.log(this.reponseMessage);
              this.totalDislikesMap[comment.id]++;
              notif.interaction=reponse;
              if(notif.actor.id!==comment.user.id)
                { this.notifService.onSendNotification(notif);}
              this.interaService.getInteractionByUserIdAndCommentIdType(this.user.id, comment.id,"like").subscribe(
                (reponse: any) => {
                  if( reponse){
                    let inter =new Interaction();
                    inter=reponse;
                   
                    this.interaService.removeInteraction(inter.id).subscribe(
                      (reponse: any) => {
                        this.reponseMessage=reponse;
                        
                        this.totalLikesMap[comment.id]--;
                      },(error)=>{
                        console.error('Error fetching like interaction:', error);
                      }
                    )
                    this.isLike[comment.id] =false;
                  }
                });
              
            },
            (error) => {
        
              console.error('Error fetching inter:', error);
            }
            
          );
          this.isDislike[comment.id.toString()] =true;
        }
      } else {
        this.openPopupInfo();
    }
},
(error) => {
    console.error('Error fetching comment:', error);
}
);}

else{
this.openVerifierconnect()}
}


          loadLikeInteraction(comment: Comment) {
            this.interaService.getInteractionByUserIdAndCommentIdType(this.user.id, comment.id,"like").subscribe(
              (reponse: any) => {
                this.reponseMessage = reponse;
                if( reponse)
              {  this.isLike[comment.id] =true;
                console.log(this.isLike[comment.id]);
               }
               else{
                this.isLike[comment.id] =false;
                console.log(this.isLike[comment.id]);
               }
               
              },
              (error) => {
                console.error('Error fetching like interaction:', error);
              }
            );
            
           
          }
          loadDislikeInteraction(comment: Comment) {
            this.interaService.getInteractionByUserIdAndCommentIdType(this.user.id, comment.id,"dislike").subscribe(
              (reponse: any) => {
                this.reponseMessage = reponse;
                if( reponse)
              {  this.isDislike[comment.id.toString()] =true;
                console.log(this.isDislike[comment.id.toString()]);
               
               }
               else{
                this.isDislike[comment.id.toString()] =false;
                console.log(this.isDislike[comment.id.toString()]);
               }
              
              },
              (error) => {
                console.error('Error fetching like interaction:', error);
              }
            );
          }

          getTotalLikes(comment:Comment): void {
            this.commentService.getTotalLikes(comment.id)
              .subscribe(totalLikes => {
                this.totalLikesMap[comment.id] = totalLikes;
              
                console.log("Total likes for post with ID " + comment.id + ": " + totalLikes);
              });
          }
          getTotalDislikes(comment:Comment): void {
            this.commentService.getTotalDislikes(comment.id)
              .subscribe(totalDislikes => {
                this.totalDislikesMap[comment.id] = totalDislikes;
              
                console.log("Total likes for post with ID " + comment.id + ": " +totalDislikes);
              });
          }



getActiveChildComments(comment: Comment): Comment[] {
  return comment.childComments?.filter(child => child.enabled) || [];
}

getSortedComments(comments: Comment[]): Comment[] {
  // Trier les commentaires par date de création
  return comments.slice().sort((a, b) => {
    return new Date(b.dateCreate).getTime() - new Date(a.dateCreate).getTime();
  });
}


loadCommentsForPoste(posteId: number) {
  this.commentService.getCommentsByPostId(posteId).subscribe(
    (comments: Comment[]) => {
      this.comments = comments.filter(comment => comment.enabled);
        
    
      
      // Optionnel: Pour chaque commentaire, filtrer les commentaires enfants
      this.comments.forEach(comment => {
        comment.childComments = this.getActiveChildComments(comment);
      });
    },
    error => {
      console.error('Error fetching comments:', error);
    }
  );
}

loadComments(comment:Comment)
{
  
  this.commentService.getCommentById(comment.id).subscribe(comment=>{
  this.comment=comment;
  })
 
}

openPopupSignale(poste:Poste) {
  this.poste=poste;
  this.popupSignale.nativeElement.style.display = 'block';
  this.overlay.nativeElement.style.display = 'block';

  // Ajout d'un seul écouteur pour la fermeture du popup
  this.overlay.nativeElement.addEventListener('click', this.closePopup.bind(this));
}

closePopup(event: MouseEvent) {
  if (event.target === this.overlay.nativeElement) {
    this.popupSignale.nativeElement.style.display = 'none';
    this.overlay.nativeElement.style.display = 'none';
    // Supprimer l'écouteur après fermeture
    this.overlay.nativeElement.removeEventListener('click', this.closePopup.bind(this));
    this.currentStep=1;
  }
}

closeSignale() {
  this.closePopup({ target: this.overlay.nativeElement } as MouseEvent);
  this.currentStep=1;
}
loadFilteredChildComments(parentComment: Comment): Promise<Comment[]> {
  if (!this.isUserAuthenticated) {
    // Si non authentifié, renvoyez tous les sous-commentaires activés et triés par date
    this.filteredChildComments = parentComment.childComments
      .filter(childComment => childComment.enabled) // Filtrer par 'enabled'
      .sort((a, b) => new Date(b.dateCreate).getTime() - new Date(a.dateCreate).getTime());
    return Promise.resolve(this.filteredChildComments);
  }

  const childCommentPromises: Promise<Comment | null>[] = parentComment.childComments
    .filter(childComment => childComment.enabled) // Filtrer par 'enabled' avant la vérification de blocage
    .map(childComment => {
      return new Promise((resolve, reject) => {
        // Vérifiez si l'utilisateur actuel a bloqué l'utilisateur du sous-commentaire
        this.blockService.isUserBlocked(this.user.id, childComment.user.id).subscribe(
          (isBlockedByCurrentUser) => {
            // Vérifiez également si l'utilisateur du sous-commentaire a bloqué l'utilisateur actuel
            this.blockService.isUserBlocked(childComment.user.id, this.user.id).subscribe(
              (isBlockedByCommentUser) => {
                // Si ni l'utilisateur actuel n'est bloqué par le propriétaire du sous-commentaire ni l'inverse
                if (!isBlockedByCurrentUser && !isBlockedByCommentUser) {
                  resolve(childComment);  // Renvoyer le sous-commentaire
                } else {
                  resolve(null);  // Renvoyer null si l'utilisateur est bloqué
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

  // Utiliser Promise.all pour attendre la résolution de toutes les vérifications de blocage
  return Promise.all(childCommentPromises).then(results => {
    // Filtrer les résultats pour enlever les sous-commentaires bloqués (null)
    this.filteredChildComments = results.filter(comment => comment !== null) as Comment[];

    // Trier les sous-commentaires filtrés par date
    return this.filteredChildComments.sort((a, b) => new Date(b.dateCreate).getTime() - new Date(a.dateCreate).getTime());
  });
}


addNewChildComment(newComment: Comment, parentComment: Comment): void {
  // Vérifiez si l'utilisateur actuel a bloqué l'utilisateur du nouveau sous-commentaire
  this.blockService.isUserBlocked(this.user.id, newComment.user.id).subscribe(
    (isBlockedByCurrentUser) => {
      // Vérifiez également si l'utilisateur du nouveau sous-commentaire a bloqué l'utilisateur actuel
      this.blockService.isUserBlocked(newComment.user.id, this.user.id).subscribe(
        (isBlockedByCommentUser) => {
          // Si ni l'utilisateur actuel n'est bloqué par le propriétaire du sous-commentaire
          // ni l'inverse, ajoutez le sous-commentaire
          if (!isBlockedByCurrentUser && !isBlockedByCommentUser) {
            // Ajoutez le sous-commentaire dans la liste des commentaires enfants filtrés
           
         
            
         
            
            console.log(" this.filteredChildComments", this.filteredChildComments)
          } else {
            console.warn('Sous-commentaire bloqué.');
          }
        },
        (error) => {
          console.error('Erreur lors de la vérification du blocage (commentaire utilisateur) :', error);
        }
      );
    },
    (error) => {
      console.error('Erreur lors de la vérification du blocage (utilisateur actuel) :', error);
    }
  );
}

async onChildCommentChange(comment:Comment) {

  this.parentComment= await this.commentService.getCommentWithParent(comment.id).toPromise()
  console.log("comentDelte", this.commentDelete);
  

  this.removeCommentById(this.filteredChildComments, comment);



// Vous pouvez ajouter un changement de détection si nécessaire
this.cdr.detectChanges();
  // Vous pouvez ajouter un changement de détection si nécessaire
 
  
}

async removeCommentById(comments: any[], comment: Comment) {
  for (let i = 0; i < comments.length; i++) {
    console.log(" this.filteredChildComments avant", this.filteredChildComments);

    if (comments[i].id === comment.id) {
      // Supprimer le commentaire trouvé
      comments.splice(i, 1);

      // Mettre à jour la liste filtrée après suppression
      this.filteredChildComments = [...comments];
      this.cdr.detectChanges(); // Forcer la détection de changements
      console.log(" this.filteredChildComments après suppression", this.filteredChildComments);
      return; // Quitter après la suppression
    }

    // Si le commentaire a des enfants, vérifier dans les enfants (récursion)
    if (comments[i].childComments && comments[i].childComments.length > 0) {
      const initialChildCount = comments[i].childComments.length;
      console.log(`Inspecting child comments of comment ${comments[i].id} with ${initialChildCount} children`);

      this.removeCommentById(comments[i].childComments, comment);

      // Si le nombre d'enfants a changé, mettre à jour l'état d'ouverture
      if (comments[i].childComments.length !== initialChildCount) {
        console.log(`Child comments count changed for parent ${comments[i].id}, updating display...`);
        this.commentsToShow[comments[i].id] = (this.commentsToShow[comments[i].id] || 0) + 10;
      }

      // Mettre à jour la liste parent avec les enfants après la récursion
      comments[i].childComments = [...comments[i].childComments];
      this.filteredChildComments = [...comments]; // Actualiser la liste complète
      console.log("Filtered comments après récursion", this.filteredChildComments);

      this.cdr.detectChanges(); // Forcer la mise à jour après la récursion
    }
  }
}


trackByCommentId(index: number, comment: any): number {
  return comment.id;  // Angular se base sur l'id pour suivre les modifications
}

navProfile(user:User)
  {
   
      this.router.navigate(['/profile', user.id]).then(() => {
        window.location.reload();
      });
    }

    openVerifierconnect(){

      this.isOverlayVisible = true;
      this.isPopupConnectVisible = true;
    }

    login(){
      this.router.navigate(['/login']);  
  
    }
}