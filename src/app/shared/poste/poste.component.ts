import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, Renderer2, ViewChild, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { TokenStorageService } from '../../services/token-storage.service';
import { PosteService } from '../../services/poste.service';
import { User } from '../../model/user';
import { Poste } from '../../model/poste';

import { MatSnackBar } from '@angular/material/snack-bar';
import { Comment } from '../../model/comment';
import { CommentService } from '../../services/comment.service';

import { SharedService } from '../shared.service';
import { Interaction } from '../../model/interaction';
import { InteractionService } from '../../services/interaction.service';
import { UserService } from '../../services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Notification } from '../../model/notification';
import { NotificationService } from '../../services/notification.service';
import { SignaleService } from '../../services/signale.service';
import { Signale } from '../../model/signale';
import { firstValueFrom, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { BlockService } from '../../services/block.service';
import { AuthService } from '../../services/auth.service';
import { CommentComponent } from '../comment/comment.component';
export interface Report {
  type: string;
  description: string;  // Ajoutez cette ligne si elle est manquante
}

@Component({
    selector: 'app-poste',
    templateUrl: './poste.component.html',
    styleUrl: './poste.component.css',
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class PosteComponent implements OnInit {
  currentUser: any;
  categorySelected: boolean = false;
  submissionAttempted: boolean = false;
  posteForm: any = FormGroup;
  user: User ;
  reponseMessage: any;
  isSuccessful = false;
  isSignUpFailed = false;

  errorMessageSignale = '';
  errorMessage :string | null = null;;
  errorMesCateg : string |  null = null;
  preview = '';
  icons: string;
  posteIcons: string[] = [];
  text: string;
  selectedCategory = 'Catégorie';
   @Input() category:string;
   @Input() profile:number;
  
   @Input() username:string;
  isDropdownVisible = true;
  textToCopy = 'Texte à copier';
  selectedPost: any;
  displayedCommentsCount: number = 4;
  visibleComments: any[] = [];
  post = new Poste();
  isOverlayVisible: boolean = false;
  isPopupVisible: boolean = false;
  isPopupPosteVisible: boolean = false;
  isPopupConnectVisible: boolean = false;
  isUserAuthenticated: boolean = false;
  imageUrl: string | ArrayBuffer | null = null;
  hasImage: boolean = false;
  fileImage: File | null = null;
  selectedFiles?: FileList;
  isModifierVisible = true;
  isAjoutVisible = true;
  poste: Poste;
  matchingIcon: any;
  commentForm: any = FormGroup;
  deleteImage:boolean=false;
  textareaContent: string = '';
  showButtonFlag: boolean = false;
  textareaVisibility: { [key: string]: boolean } = {};
  isCommentsVisible: boolean = false;
  isDeleteComment: boolean = false;
  isSignaleComment:boolean = false;
  isConnectComment:boolean = false;
  isActive:any;
  isLike:  { [key: number]: boolean } = {};
  isDislike:  { [key: string]: boolean } = {};
  totalLikesMap: { [postId: number]: number } = {};
  totalDislikesMap: { [postId: number]: number } = {};
 
  @ViewChild('dropdownElement') dropdownElement: ElementRef;
  @ViewChild('popupPoste') popupPoste: ElementRef ;
  @ViewChild('popupSignale') popupSignale: ElementRef ;
  @ViewChild('overlay') overlay: ElementRef ;
  @ViewChild('fileInput') fileInput: ElementRef;
  @Input() disableOverlay: boolean = false;
 
  @Input() disablePoste: boolean = false;
  @ViewChild('posteElement') posteElement: ElementRef;
  popupStyle = {};
  public posts: any[];
  filteredPostes: Poste[] = [];
  showComments: { [id: number]: boolean } = {};
 commentsToShow: { [postId: string]: number } = {};
 @Input() commentsLimit!: number;
  increment = 10;
  isDeletePoste: boolean = false;
  isSignalePoste: boolean = false;
  comment: Comment;
  messageComment='';
  activeComments: Comment[] = [];
  activeCommentsCount: number = 0;
  textLimit = 100;
  filteredComments: any[] = [];
  filteredChildComments : any[] = [];
  @ViewChild(CommentComponent) childComponent!: CommentComponent; 
  parentComment:Comment|undefined;
  constructor(private formBuilder: FormBuilder, private readonly changeDetectorRef: ChangeDetectorRef,
    private userService: UserService, private token: TokenStorageService, private posteService: PosteService
    , private commentService: CommentService,private router: Router,private route: ActivatedRoute,
     private sharedService: SharedService,private  interaService: InteractionService,private notifService:NotificationService
    ,private signaleService :SignaleService,private blockService: BlockService,private snackBar: MatSnackBar,
    private authService: AuthService,private el: ElementRef, private renderer: Renderer2) {
      this.user = new User();
      
      this.totalLikesMap = {};
      this.totalDislikesMap={};
     /* window.addEventListener("load", () => {
        const popup = document.querySelector('.popupPoste') as HTMLElement;
        popup!.style.top = `${window.scrollY + 100}px`; // Place la popup 100px en dessous de la position de défilement
      });*/
  }

  id:number;

 
  categories = [
    { name: 'Jeux', icon: 'bx bx-game', selected: false },
    { name: 'Education', icon: 'bx bxs-pen', selected: false },
    { name: 'Musique', icon: 'bx bx-music', selected: false },
    { name: 'Politique', icon: 'bx bxs-user-voice', selected: false },
    { name: 'Sport', icon: 'bx bx-football', selected: false },
  ] 
  @Input() isProfile: boolean = false;
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
 

  popupElement: HTMLElement;

  report: Report = {
    type: '',
    description: ''
  };
  currentStep = 1;
  reportType: string = '';
  reportDescription: string = '';

  @Output() toggleOverlay = new EventEmitter<boolean>();
  @Output() togglePoste = new EventEmitter<boolean>();
  @Output() closePoste = new EventEmitter<void>(); 
  ngAfterViewChecked(): void {
    this.changeDetectorRef.detectChanges();
  }

 
 async ngOnInit(){
   
    this.isUserAuthenticated = this.authService.isUserAuthenticated();
    this.id = this.id =Number (this.route.snapshot.paramMap.get('id'));
    console.log("id:",this.id);
  
    this.selectedCategory=this.category;
    this.currentUser = this.token.getUser();
  
    console.log(this.token.getToken());
    this.posteForm = this.formBuilder.group({
      messagePoste: ['', Validators.required]

    });
    this.commentForm = new FormGroup({
      messageComment: new FormControl('')
    });
    this.isAuthenticated();

    //this.findUser(this.currentUser.username);

    window.addEventListener('btnEvent', this.checkSidebarStatus);

 await   this.findUser(this.currentUser.username)
    .then(user => {
      console.log('Utilisateur trouvé:', user); // Affichez l'utilisateur trouvé
      
       // Appelle loadPosts après avoir trouvé l'utilisateur
    })
    .catch(error => {
      console.error('Erreur lors de la recherche de l\'utilisateur:', error);
    });
    this.loadPosts();
      this.updateCommentsCount();
  
    
    this.syncTextareas();
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


  openPostPopup(event: MouseEvent, poste: any ) {
    this.selectedPost = poste;
    
    this.loadFilteredComments(this.selectedPost);
    this.loadCommentsForPoste(this.selectedPost);
  
    this.isOverlayVisible = true;
    this.isPopupPosteVisible = true;
  
    this.matchingIcon = this.categories.find(catIcon => catIcon.name === poste.category);
   
    this.toggleOverlay.emit(true);
   
    if( this.textareaVisibility[this.selectedPost.message]=== true)
      {  
        this.toggleTextarea( poste)
        console.log("this.textareaVisibility[poste.message]",this.textareaVisibility[this.selectedPost.message]);
      
       
      }
      
  

  }


  closePostePopup() {
    this.isPopupPosteVisible = false;
    this.closePoste.emit();  // Émet un événement de fermeture
  }
  toggleCommentsRe(postId: string, comments: Comment[]) {
    // Si tous les commentaires sont déjà affichés, basculez pour afficher les commentaires 10 par 10 en arrière
    if (this.commentsToShow[postId] === comments.length) {
      this.commentsToShow[postId] = Math.max(0, comments.length - 10);
    } else if (this.commentsToShow[postId] === 0) {
      // Si aucun commentaire n'est affiché, affichez les 10 derniers commentaires
      this.commentsToShow[postId] = comments.length - 10;
    } else {
      // Sinon, réduisez l'affichage des commentaires de 10
      this.commentsToShow[postId] = Math.max(0, this.commentsToShow[postId] - 10);
    }
  }

    

  loadPosts() {
    this.posteService.fetchPosts().pipe(
      switchMap(() => this.posteService.listePoste()), // Charger les postes
      map(postes => {
        // Filtrage des postes par profil ou catégorie
        if (this.profile !== 0) {
          return postes.filter(poste => poste.user.id === this.profile);
        } else if (this.category && this.category !== 'Catégorie') {
          return postes.filter(poste => poste.category === this.category);
        } else {
          return postes; // Aucun filtrage
        }
      }),
      switchMap(tempFilteredPostes => {
        if (this.isUserAuthenticated) {
          // Vérification des utilisateurs bloqués
          const blockedCheckObservables = tempFilteredPostes.map(poste => {
            if (poste.user.id !== this.user.id) {
              return forkJoin([
                this.blockService.isUserBlocked(this.user.id, poste.user.id),
                this.blockService.isUserBlocked(poste.user.id, this.user.id)
              ]).pipe(
                map(([isBlockedByCurrentUser, isBlockedByPostOwner]) => {
                  if (!isBlockedByCurrentUser && !isBlockedByPostOwner) {
                    const matchingIcons = this.categories.filter(catIcon => catIcon.name === poste.category);
                    return { ...poste, icons: matchingIcons };
                  } else {
                    return null; // Poste bloqué
                  }
                })
              );
            } else {
              const matchingIcons = this.categories.filter(catIcon => catIcon.name === poste.category);
              return of({ ...poste, icons: matchingIcons }); // Poste non bloqué
            }
          });
  
          return forkJoin(blockedCheckObservables).pipe(
            map(results => results.filter(post => post !== null)) // Filtrer les postes valides
          );
        } else {
          // Pour les utilisateurs non authentifiés
          return of(tempFilteredPostes.map(poste => {
            const matchingIcons = this.categories.filter(catIcon => catIcon.name === poste.category);
            return { ...poste, icons: matchingIcons };
          }));
        }
      })
    ).subscribe(
      filteredPostes => {
        this.filteredPostes = filteredPostes; // Mettre à jour les postes filtrés
        console.log('Postes filtrés et affichés :', this.filteredPostes);
      },
      error => {
        console.error('Erreur lors du chargement des postes :', error);
      }
    );
  }
  

  
 
   




  syncTextareas() {
    const userTextarea = document?.querySelector('#textPoste') as HTMLInputElement;
    const popupTextarea = document?.querySelector('#popupTextarea') as HTMLInputElement;
    if (userTextarea && popupTextarea) {
      popupTextarea.value = userTextarea.value;
    }

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
  togglePopup(event: MouseEvent) {
    const popupContent = (event.currentTarget as HTMLElement).nextElementSibling;
    if (popupContent) {
      (popupContent as HTMLElement).style.display = ((popupContent as HTMLElement).style.display === 'block') ? 'none' : 'block';
    }
  }
  addPosteFileImage() {
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
      this.errorMessage = null;
      this.errorMesCateg = null;
      console.log(this.fileImage);
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
      poste.user = this.user;


      console.log(poste);



      {
        this.posteService.addPosteWithImage(poste.message, poste.category, this.fileImage, this.user.id).subscribe(
          (reponse: any) => {
            this.reponseMessage = reponse;
            console.log(this.reponseMessage),
              console.log("teste", poste, user.id)
            this.posteForm.reset(); location.reload();
          },
          (error) => {

            console.error('Error fetching user:', error);
          }
        );
      }

      console.log('Fonction Ajout appelée');

    }
   
  }
  

  toggleDislike(poste:Poste){
    if(this.isUserAuthenticated)
   { let inter = new Interaction();
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
   const postMessage =  this.truncateText(poste.message, 10) ;
   notif.message = `${this.user.nom} n'aime pas votre post « ${postMessage} »`;
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
);}
else{
  this.openVerifierconnect();
}
  }

  async toggleLike(poste: Poste) {
    if(this.isUserAuthenticated)
  {  let inter = new Interaction();
    
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
                    const postMessage =  this.truncateText(poste.message, 10) ;
                    notif.message = `${this.user.nom} aime votre post « ${postMessage} »`;
                    
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
    );}
    else {
      this.openVerifierconnect();
    }
}
  loadLikeInteraction(poste: Poste) {
    this.interaService.getInteractionByUserIdAndPosteIdType(this.user.id, poste.id,"like").subscribe(
      (reponse: any) => {
        this.reponseMessage = reponse;
        if( reponse)
      {  this.isLike[poste.id] =true;
       
       }
       else{
        this.isLike[poste.id] =false;
       
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
        this.reponseMessage = reponse;
        if( reponse)
      {  this.isDislike[poste.id.toString()] =true;
      
       
       }
       else{
        this.isDislike[poste.id.toString()] =false;
       
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
    console.log("poste de modification", this.post)
    this.posteService.updatePoste(poste.message, this.selectedCategory, this.fileImage,this.deleteImage,this.post.id).subscribe(
      (updatedPoste: Poste) => {
        console.log('Poste mis à jour:', updatedPoste);
        this.reponseMessage = updatedPoste; // Vérifiez que cela est atteint
        console.log("this.reponseMessage", this.reponseMessage); // Cela devrait s'afficher

        this.posteForm.reset();
        this.closePopupOverlay();
      
        const index =  this.filteredPostes.findIndex(p => p.id === updatedPoste.id);
        console.log("index ",index )
        if (index !== -1) {
            this.filteredPostes[index] = updatedPoste;
           this.loadPosts()
            
        } else {
            console.warn('Poste non trouvé dans la liste des postes.');
        }
          

     
      
  },
      (error) => {
        console.error('Erreur lors de la mise à jour du poste:', error);
      
      }
    );

  
    console.log('Fonction Modifier appelée');
   
        
  }}
  performAction() {

    if (this.isModifierVisible) {
      this.modifierPoste();
    }
    else if (this.isAjoutVisible) {
      this.addPosteFileImage();

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

    this.isOverlayVisible = true;
    this.isPopupVisible = true;
    console.log(poste);
    this.post = poste;
    this.post.id = poste.id;
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
    this.selectedCategory = this.post.category;


    console.log(this.post);
    this.toggleAction(action);
  }

  closePopupOverlay() {
    this.isOverlayVisible = false;
    this.isPopupVisible = false;
    this.isPopupPosteVisible=false;
  this.isPopupConnectVisible=false;
    this.disableOverlay=false;
    const popupDelete = document.querySelector('.popupDelete') as HTMLElement;
    const overlay = document.querySelector('.overlay') as HTMLElement;

   
      popupDelete.style.display = 'none';
      overlay.style.display = 'none';

   
   
  }



  // Méthode pour gérer le clic sur l'overlay
  onOverlayClick() {
    this. closePopupOverlay();
    
   


  }
  togglePopupDelete(event: MouseEvent, poste: any) {
    const popupDelete = document.querySelector('.popupDelete') as HTMLElement;
    const overlay = document.querySelector('.overlay') as HTMLElement;
    popupDelete.style.display = 'block';
    overlay.style.display = 'block';
    overlay.addEventListener('click', function () {
      popupDelete.style.display = 'none';
      overlay.style.display = 'none';

    });



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
{this.loadPosts();
  
  
  
}
  callTogglePopupDelete(poste: any): void {

    this.poste = poste;
 
    this.sharedService.togglePopupDelete();
    this.isDeletePoste = true;

  }

  callTogglePopupSignale(poste: any): void {

    this.poste = poste;
    this.isSignalePoste= true;
    this.sharedService.togglePopupSignale();
    

  }
 


  clickUploadImagePoste(action: string) {
    this.syncTextareas();
  /*  const btnUpload = document.querySelector('.upload-image');
    const popupCardUser = document.querySelector('.popupCardUser') as HTMLElement;
    const overlay = document.querySelector('.overlay') as HTMLElement;
    btnUpload?.addEventListener('click', function () {

      popupCardUser.style.display = 'block';
      overlay.style.display = 'block';

    });

    overlay.addEventListener('click', function () {

      location.reload();
      popupCardUser.style.display = 'none';
      overlay.style.display = 'none';
      const userTextarea = document.querySelector('#textPoste') as HTMLInputElement;
      const popupTextarea = document.querySelector('#popupTextarea') as HTMLInputElement;

      popupTextarea?.addEventListener('input', function () {
        userTextarea.value = popupTextarea.value;

      });
    });*/
    if(this.isUserAuthenticated)
   { this.isOverlayVisible = true;
    this.isPopupVisible = true;

    this.toggleAction(action);}
    else {

      this.openVerifierconnect();
    }
  }



  onSubmit() {

    if(this.isUserAuthenticated)

 {  
   console.log("this.authService.isUserAuthenticated()",this.authService.isUserAuthenticated())
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
      console.log(poste);

      this.posteService.addPoste(poste)
        .subscribe((reponse: any) => {
          this.reponseMessage = reponse?.message;
          this.posteForm.reset();

        },
          err => {
            this.reponseMessage = err.error?.message;
            this.isSignUpFailed = true;
          })

      location.reload();


    }}
    else
  { this.openVerifierconnect();
    console.log("this.authService.isUserAuthenticated()",this.authService.isUserAuthenticated())}
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


  isAuthenticated() {
    const user = this.token.getToken()
    this.isUserAuthenticated = user !== null
    console.log(this.isUserAuthenticated)

  }
    navProfile(user:User)
    {
     
        this.router.navigate(['/profile', user.id]).then(() => {
          window.location.reload();
        });
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
   





  alertPoste() {
    const btnAdd = document.querySelector('#btnAdd');
    btnAdd?.addEventListener('click', function () {
      const textPoste = document.querySelector('#textPoste') as HTMLInputElement;
      const textCateg = document.querySelector('select-text') as HTMLInputElement;
      if (textPoste?.value.trim() === '') {
        alert('Veuillez remplir votre Question');

      }
      console.log(textCateg?.value);

    });
  }
  checkSidebarStatus(): void {

    const sidebarActive = localStorage.getItem('sidebarActive');
    const raw = document.querySelector('.raw');
    if (sidebarActive === 'true') {


      const newEvent = new Event('newEvent');
      raw?.classList.add('active');
      console.log("raw active")
      window.dispatchEvent(newEvent);
    }

    if (sidebarActive === 'false') {


      const newEvent = new Event('newEvent');
      raw?.classList.remove('active');
      window.dispatchEvent(newEvent);
    }

  }


  clickMenu() {
   
    const optionMenu = document.querySelector('.select-menu');
    const selectbtn = document.querySelector('.btn');
    selectbtn?.addEventListener('click', () => {
      optionMenu?.classList.toggle('active');
    })
  }
  clickMenuPopup() {
    const optionMenu = document.querySelector('.select-menu-popup');
    const selectbtn = document.querySelector('.btn-popup');
    selectbtn?.addEventListener('click', () => {
      optionMenu?.classList.toggle('active');
    })
  }
  listPoste() {


    this.posteService.listePoste().subscribe(posts => {
      this.posts = posts;

    });

  }


  /* @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
       const clickedInside = this.dropdownElement.nativeElement.contains(event.target);
    
       if (!clickedInside) {
         this.resetSelection();
       }
      
    }*/

  resetSelection() {
    this.selectedCategory = 'Catégorie';
    this.isDropdownVisible = true;
    this.categories.forEach(cat => {
      cat.selected = false;
    });
  }
  onCommentDelete(event: boolean) {
    this.isDeleteComment = event; // Récupérer la valeur de isDeleteComment depuis le composant Comment
  }
 onCommentsignale(event: boolean) {
    this.isSignaleComment = event; // Récupérer la valeur de isDeleteComment depuis le composant Comment
  }
  onCommentConnect(event: boolean) {
    this.isConnectComment = event; // Récupérer la valeur de isDeleteComment depuis le composant Comment
  }
  onResirveSignale(event: Comment) {
    this.comment = event;
  } 
  onResirveConnect(event: Comment) {
    this.comment = event;
  } 
  onResirve(event: Comment) {
    this.comment = event;
  }
  deepCopy<T>(data: T[]): T[] {
    return JSON.parse(JSON.stringify(data));
}


  deleteObject() {
    console.log("comment etat", this.isDeleteComment);
    console.log(this.comment);

    if (this.isDeletePoste === true) {
      console.log("suppression Poste");


      this.posteService.disablePost(this.poste.id).subscribe(
        (reponse: any) => {
          this.reponseMessage = reponse;
          console.log(this.reponseMessage),
            this.posteForm.reset();
            this.filteredPostes = this.filteredPostes.filter(poste => poste.id !== this.poste.id);

          //this.loadPosts();
          
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
            const posteIndex = this.filteredPostes.findIndex(poste => poste.comments.some(comment => comment.id === this.comment.id));
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
       this.filteredComments = this.filteredComments.filter(comment => comment.id !== this.comment.id);
     
       // Forcer la mise à jour du DOM
       this.changeDetectorRef.detectChanges();} else{
     
    this.triggerCommentChange()
   this.loadCommentsForPoste(this.selectedPost);
      this.changeDetectorRef .detectChanges();
   }
   
   
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

  filterChildCommentsForComment(comment: Comment): Comment[] {
    return comment.parentComment.childComments.filter(child => child.enabled);
  }
 

  removeChildComment(parentComment: any, commentId: number) {
    console.log("Liste des sous-commentaires du parent :", parentComment.childComments);

    const childIndex = parentComment.childComments.findIndex((child: any) => {
        console.log("Comparaison des IDs :", child.id, commentId);
        return child.id === commentId;
    });

    if (childIndex !== -1) {
        // Si le sous-commentaire est trouvé à ce niveau
        parentComment.childComments.splice(childIndex, 1);
        console.log("Sous-commentaire supprimé à ce niveau:", parentComment.childComments);
     
        
        this.filteredChildComments=   this.filteredChildComments.filter((comment:any )=> comment.id !== commentId)
    
  
        console.log("Hiérarchie des sous-commentaires mise à jour:", this.filteredChildComments);
       
        
      //  this.filteredChildComments = this.filteredChildComments.filter();
    } else {
        // Si le sous-commentaire n'est pas trouvé, parcourir les sous-commentaires enfants
        for (let child of parentComment.childComments) {
            if (child.childComments && child.childComments.length > 0) {
              const deleted = this.removeChildComment(child, commentId); // Recherche récursive dans les enfants
              if (deleted) {
                  // Si le commentaire a été supprimé dans un sous-niveau, on met à jour la hiérarchie complète
                  this.filteredChildComments.push(...this.deepCopy(parentComment.childComments));
                  console.log("Mise à jour de la hiérarchie complète :", this.filteredChildComments);
                  return true; // Sortir de la récursion après suppression
              }
           
            }
        }
    }
}


  getChildCommentsForComment(comment: any): any[] {
    return this.filteredChildComments.filter(childComment => childComment.parentCommentId === comment.id);
  }

  //////////////__________________ Commentaires _____________________________/////////////

  adjustTextareaSize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
  addNewLine(): void {
    this.textareaContent += '\n';
  }
  showButton(): void {
    this.showButtonFlag = true;
  }

  hideButton(): void {
    this.showButtonFlag = false;

  }
  toggleTextarea(object: any): void {
    if(this.isUserAuthenticated)
{
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
       
      }}
      else{

        this.openVerifierconnect();
      }
  }
  
  toggleTextareaComm(object: any): void {
    if (object && object.text) {
      this.textareaVisibility[object.text] = !this.textareaVisibility[object.text];
    }
  }

  isTextareaVisible(poste: any): boolean {
  
    return this.textareaVisibility[poste.message];
  }
  isTextareaVisibleComm(comment: any): boolean {
    return this.textareaVisibility[comment.text];
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {

    }
  }
  openFileInput() {
    this.fileInput.nativeElement.click();
  }
  truncateText(text: string, maxLength: number): string {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...';
    }
    return text;
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
   let notif=new  Notification;
   notif.enabled=true;
    notif.actor= this.user;
 let messageTruncate :string =this. truncateText(comment.text,10);

 const commentText =  this.truncateText(comment.text, 10) ;
const postMessage =  this.truncateText(poste.message, 20) ;

notif.message = `${this.user.nom} a commenté « ${commentText} » sur votre post « ${postMessage} »`;
    notif.recipients=[poste.user];
    notif.reaction="commente";
    notif.poste=p;
   
    notif.read=false;
    
 const reponse= await  this.commentService.addCommentToPost(comment).toPromise();
 
        
       
        this.reponseMessage = reponse;
        notif. comment=reponse;
       

        const index = this.filteredPostes.findIndex(p => p.id === poste.id);
        console.log('Filtered Postes IDs:', this.filteredPostes.map(p => p.id));
        console.log('Poste ID à mettre à jour:', poste.id);
        console.log('Index trouvé:', index);
    
        if (index !== -1) {
          console.log('Commentaires existants avant ajout:', this.filteredPostes[index].comments);
          
          if (!this.filteredPostes[index].comments) {
              this.filteredPostes[index].comments = []; // Assurez-vous que les commentaires sont initialisés
          }
      
          // Affichez le commentaire à ajouter
          console.log('Commentaire à ajouter:', comment);
         
          // Mettez à jour le poste dans filteredPostes
          console.log('Poste avant mise à jour:', this.filteredPostes[index]);
          this.filteredPostes[index] = {
              ...this.filteredPostes[index],
              comments: [...this.filteredPostes[index].comments, reponse] // Ajouter le commentaire
          };
          console.log('Poste après mise à jour:', this.filteredPostes[index]);
          this.loadFilteredComments(this.filteredPostes[index])
          this.commentsToShow[poste.id] =  10;
          this.loadCommentsForPoste(poste);

      } else {
          console.warn('Poste non trouvé dans la liste des postes.');
      }
      
     
    

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
 


  showImage() {

    const uploadImage = document.querySelector('.upload-delete') as HTMLElement;
    const iconeDelte = uploadImage?.querySelector('.bx-trash') as HTMLElement;
    if (this.imageUrl !== null) {
      iconeDelte.style.display = 'block';;

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
      this.isOverlayVisible=false;
    this.onOverlayClick()
     // this.overlay.nativeElement.removeEventListener('click', this.closePopup.bind(this));
      this.currentStep=1;
    }
  }
  
  closeSignale() {
   // this.closePopup({ target: this.overlay.nativeElement } as MouseEvent);
    this.isOverlayVisible=false;
    this.popupSignale.nativeElement.style.display = 'none';
    this.onOverlayClick()
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
    signale.poste=this.poste;
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

updateCommentsCount(): void {
  this.filteredPostes.forEach(poste => {
    // Filtrer les commentaires activés
    const enabledComments = poste.comments.filter(comment => comment.enabled);
  
    // Mettre à jour le nombre de commentaires activés
    this.commentsToShow[poste.id] = enabledComments.length;
  });
}
getActiveComments(poste: Poste): Comment[] {
  
  return poste.comments.filter(comment => comment.enabled) ;
}

async getFilteredAndSortedComments(poste: Poste): Promise<Comment[]> {
  if (!this.isUserAuthenticated) {
    // Si non authentifié, renvoyez tous les commentaires activés et triés par date
    return Promise.resolve(
      poste.comments
        .filter(comment => comment.enabled)  // Ajout du filtrage par 'enabled'
        .sort((a, b) => new Date(b.dateCreate).getTime() - new Date(a.dateCreate).getTime())
    );
  }

  const commentPromises: Promise<Comment | null>[] = poste.comments
    .filter(comment => comment.enabled)  // Filtrage par 'enabled' avant les vérifications de blocage
    .map(comment => {
      return new Promise((resolve, reject) => {
        // Vérifie si l'utilisateur actuel a bloqué l'utilisateur du commentaire
        this.blockService.isUserBlocked(this.user.id, comment.user.id).subscribe(
          (isBlockedByCurrentUser) => {
            // Vérifie également si l'utilisateur du commentaire a bloqué l'utilisateur actuel
            this.blockService.isUserBlocked(comment.user.id, this.user.id).subscribe(
              (isBlockedByCommentUser) => {
                // Si ni l'utilisateur actuel n'est bloqué par le propriétaire du commentaire ni l'inverse, renvoyez le commentaire
                if (!isBlockedByCurrentUser && !isBlockedByCommentUser) {
                  resolve(comment);  // Renvoyer le commentaire
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

  // Utiliser Promise.all pour attendre la résolution de toutes les vérifications
  return Promise.all(commentPromises).then(results => {
    // Filtrer les résultats pour enlever les commentaires bloqués (null)
    const filteredComments = results.filter(comment => comment !== null) as Comment[];

    // Trier les commentaires filtrés par date
    return filteredComments.sort((a, b) => new Date(b.dateCreate).getTime() - new Date(a.dateCreate).getTime());
  });
}



loadFilteredComments(poste: Poste): void {
  this.getFilteredAndSortedComments(poste).then(filteredComments => {
    this.filteredComments = filteredComments; // Met à jour la liste des commentaires filtrés
  });
  this.changeDetectorRef.detectChanges();
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



toggleExpand(poste: any): void {
  poste.expanded = !poste.expanded;
}

// Vérifie si le texte dépasse une certaine longueur (par exemple 100 caractères)
isTextOverflow(message: string): boolean {
  return message.length > 100; // Modifier la limite ici si nécessaire
}


checkBlockStatus(postUserId: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // Vérifier si l'utilisateur connecté a bloqué ou est bloqué par l'auteur du poste
    this.blockService.isUserBlocked(this.user.id, postUserId).subscribe(
      (isBlocked) => {
        resolve(isBlocked);
      },
      (error) => {
        console.error('Erreur lors de la vérification du blocage', error);
        reject(false);
      }
    );
  });
}

loadComments() {
 

  // Filtrage des commentaires
  this.filteredComments = [];

  this.poste.comments.forEach(comment => {
    this.blockService.isUserBlocked(this.user.id, comment.user.id).subscribe(isBlocked => {
      if (!isBlocked) {
        this.filteredComments.push(comment);
      }
    });
  });
}
// Fonction récursive pour trouver l'index du commentaire
// Fonction pour trouver l'index du commentaire
findCommentIndex(comments: any[], commentId: number): { index: number; isChild: boolean; parentIndex?: number } {
  for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];

      // Vérifiez si le commentaire courant est celui que nous recherchons
      if (comment.id === commentId) {
          return { index: i, isChild: false }; // C'est un commentaire principal
      }

      // Vérifiez dans les sous-commentaires
      if (comment.childComments && comment.childComments.length > 0) {
          const childCommentIndex = this.findCommentIndex(comment.childComments, commentId);
          if (childCommentIndex.index !== -1) {
              return {
                  index: childCommentIndex.index,
                  isChild: true,
                  parentIndex: i // Indice du parent
              };
          }
      }
  }

  // Si on ne trouve pas le commentaire, retourner un objet avec index -1
  return { index: -1, isChild: false };
}



// Utilisation de la fonction dans votre logique
async onCommentChanged(event: any) {
  const updatedComment = event.comment;

  
 
  
  this.parentComment= await this.commentService.getCommentWithParent(updatedComment.id).toPromise()
   this.filteredChildComments= this.parentComment!.childComments;
     console.log(" this.filteredChildComments", this.filteredChildComments);
  // Trouver l'index du commentaire mis à jour
 /* const { index, isChild, parentIndex } = this.findCommentIndex(this.filteredComments, updatedComment.id);

  if (index !== -1) {
    if (isChild && parentIndex !== undefined) {
      // Mise à jour du sous-commentaire
      const parentComment = this.filteredComments[parentIndex];

      // Vérifie si le commentaire trouvé est un sous-commentaire
      const childIndex = parentComment.childComments.findIndex((child: any) => child.id === updatedComment.id);

      if (childIndex !== -1) {
        // Si le sous-commentaire est trouvé, mets à jour ou supprime
        if (updatedComment.isDeleted) {
          // Supprimer le sous-commentaire
          parentComment.childComments.splice(childIndex, 1);
          console.log("Sous-commentaire supprimé:", parentComment.childComments);
        } else {
          // Mettre à jour le sous-commentaire avec les nouvelles données
          parentComment.childComments[childIndex] = {
            ...updatedComment,
            childComments: updatedChildComments // Nouvelle liste de sous-commentaires si nécessaire
          };
          console.log("Mise à jour des sous-commentaires:", parentComment.childComments);
        }
      }
    } else {
      // Si c'est un commentaire principal
      if (updatedComment.isDeleted) {
        // Supprimer le commentaire principal
        this.filteredComments.splice(index, 1);
        console.log("Commentaire principal supprimé:", this.filteredComments);
      } else {
        // Mise à jour du commentaire principal
        this.filteredComments[index] = {
          ...updatedComment,
          childComments: updatedChildComments // Nouvelle liste de sous-commentaires
        };
        console.log("Mise à jour des commentaires principaux:", this.filteredComments);
      }
    }
    this.changeDetectorRef.detectChanges();*/
  }
  trackByCommentId(index: number, comment: any): number {
    return comment.id;  // Angular se base sur l'id pour suivre les modifications
  }


  openVerifierconnect(){

    this.isOverlayVisible = true;
    this.isPopupConnectVisible = true;
  }
  login(){
    this.router.navigate(['/login']);  

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


