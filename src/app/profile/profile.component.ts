import { ChangeDetectorRef, Component, ElementRef, OnInit, Renderer2, ViewChild, ViewEncapsulation } from '@angular/core';
import { TokenStorageService } from '../services/token-storage.service';
import { UserService } from '../services/user.service';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from '../model/user';
import { GlobalConstants } from '../shared/global-constants';
import { ActivatedRoute, Router } from '@angular/router';
import { observableToBeFn } from 'rxjs/internal/testing/TestScheduler';
import { MessageService } from '../services/message.service';

import { debounceTime, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { Message } from '../model/message';
import { ChatService } from '../services/chat.service';
import { PosteService } from '../services/poste.service';
import { FollowService } from '../services/follow.service';
import { BlockService } from '../services/block.service';
import { PosteComponent } from '../shared/poste/poste.component';
import { HttpErrorResponse } from '@angular/common/http';
import { Notification } from '../model/notification';
import { NotificationService } from '../services/notification.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';
@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css'],
    standalone: false
})
export class ProfileComponent implements OnInit {
  selectedFiles?: FileList;
  currentFile?: File;
 
  progress = 0;
  message = '';
  preview = '';
  currentUser: any;
  messages:Message[]=[];
  profileForm:any =FormGroup;
  passForm:any =FormGroup;
  reponseMessage:any;
  errorUpdate:any
  errorPassword:any;
  id:number;
errorMessage="";
successMessage="";
user: User= new User();
userCurrent :User= new User();
nom:string;
currentSection: string = 'posts';
currentMenu: string = 'overview';
postCount: number = 0;
selectedCountry: string='';
isFollowingStatus: boolean | null = null;
isOverlayVisible = false;
followers: User[] = [];
followedUsers: User[] = [];
blockedUsers: User[] = [];
users: any[] = [];
filteredUsers: any[] = [];
searchUsername = '';
searchEmail = '';
currentUsername = '';

usernameExists: boolean = false;
emailExists: boolean = false;
@ViewChild('overlay') overlay: ElementRef;
@ViewChild('popupBloque', { static: false }) popupBloque!: ElementRef;
@ViewChild('posteComponent') posteComponent!: PosteComponent;
countries: string[] = [
  "Afghanistan", "Albania", "Algeria", "American Samoa", "Andorra", "Angola", "Anguilla", "Antarctica",
  "Antigua and Barbuda", "Argentina", "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas",
  "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", 
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Bouvet Island", "Brazil", "British Indian Ocean Territory",
  "Brunei Darussalam", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada",
  "Cayman Islands", "Central African Republic", "Chad", "Chile", "China", "Christmas Island", "Cocos (Keeling) Islands",
  "Colombia", "Comoros", "Congo", "Congo (Democratic Republic of the)", "Cook Islands", "Costa Rica", "Côte d'Ivoire",
  "Croatia", "Cuba", "Curaçao", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Falkland Islands",
  "Faroe Islands", "Fiji", "Finland", "France", "French Guiana", "French Polynesia", "French Southern Territories",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Gibraltar", "Greece", "Greenland", "Grenada", "Guadeloupe",
  "Guam", "Guatemala", "Guernsey", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Heard Island and McDonald Islands",
  "Holy See", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", 
  "Isle of Man", "Italy", "Jamaica", "Japan", "Jersey", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea (North)",
  "Korea (South)", "Kuwait", "Kyrgyzstan", "Lao People's Democratic Republic", "Latvia", "Lebanon", "Lesotho",
  "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macao", "Madagascar", "Malawi", "Malaysia",
  "Maldives", "Mali", "Malta", "Marshall Islands", "Martinique", "Mauritania", "Mauritius", "Mayotte", "Mexico",
  "Micronesia (Federated States of)", "Moldova", "Monaco", "Mongolia", "Montenegro", "Montserrat", "Morocco",
  "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Caledonia", "New Zealand", "Nicaragua",
  "Niger", "Nigeria", "Niue", "Norfolk Island", "Northern Mariana Islands", "Norway", "Oman", "Pakistan", "Palau",
  "Palestine, State of", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Pitcairn", "Poland",
  "Portugal", "Puerto Rico", "Qatar", "Réunion", "Romania", "Russian Federation", "Rwanda", "Saint Barthélemy",
  "Saint Helena", "Saint Kitts and Nevis", "Saint Lucia", "Saint Martin", "Saint Pierre and Miquelon",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal",
  "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Sint Maarten", "Slovakia", "Slovenia", "Solomon Islands",
  "Somalia", "South Africa", "South Georgia and the South Sandwich Islands", "South Sudan", "Spain", "Sri Lanka",
  "Sudan", "Suriname", "Svalbard and Jan Mayen", "Sweden", "Switzerland", "Syrian Arab Republic", "Taiwan",
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tokelau", "Tonga", "Trinidad and Tobago", "Tunisia",
  "Turkey", "Turkmenistan", "Turks and Caicos Islands", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates",
  "United Kingdom of Great Britain and Northern Ireland", "United States of America", "Uruguay", "Uzbekistan",
  "Vanuatu", "Venezuela", "Viet Nam", "Western Sahara", "Yemen", "Zambia", "Zimbabwe"
];

dropdownOpen = false;
  constructor(private token: TokenStorageService,private route: ActivatedRoute,
    private userService: UserService,private formBuilder:FormBuilder,private snackBar: MatSnackBar,
    private messageService:MessageService, private chatService :ChatService,
    private router: Router,private renderer: Renderer2,private posteService:PosteService,
    private followService: FollowService, private blockService:BlockService,private authService:AuthService,
    private el: ElementRef,private cdRef: ChangeDetectorRef,private notifService:NotificationService
  ) {
    
   }
 
  ngOnInit(): void {

    this.id = Number(this.route.snapshot.paramMap.get('id'));
    
    window.addEventListener('btnEvent', this.checkSidebarStatus);
    this.currentUser = this.token.getUser();
    console.log( this.currentUser.username);
    this.reponseMessage=this.token.getToken();
     console.log(this.token.getToken());
     this.showSection(this.currentSection)
     this.ShowMenu(this.currentMenu)
     this.initDropdowun();
    // this.findByUsername(this.currentUser.username).then(() => {)

const user =this.token.getUser();
this.findUser(this.id);
this.findByUsername(user.username)
.then(() => {
  this.findUser(this.id).then(()=>{
  console.log('Utilisateur actuel récupéré:', this.userCurrent);
  if (this.userCurrent && this.user && this.user.id) {
    this.checkFollowingStatus(this.user.id);
    this.loadBlockedUsers();
    this.loadFollowers();
    this.loadFollowedUsers();
  } else {
    console.error('Utilisateur actuel ou cible non défini.');
  }
  
  // S'abonner au BehaviorSubject pour écouter les changements en temps réel
  this.followService.followStatus$.subscribe((isFollowing: boolean) => {
    this.isFollowingStatus = isFollowing;
    console.log('Statut de suivi mis à jour:', isFollowing);
  });});
})
.catch((error) => {
  console.error('Erreur lors de la récupération de l\'utilisateur:', error);
});
   this.profileForm = this.formBuilder.group({
 
    username:[null,[Validators.required,Validators.pattern(GlobalConstants.usernameRegex)]],
    nom:[null,[Validators.required,Validators.pattern(GlobalConstants.nameRegex)]],
    prenom:[null,[Validators.required,Validators.pattern(GlobalConstants.nameRegex)]],
   
  tel:[null ,[Validators.pattern(GlobalConstants.phoneRegex)]],
  
  email:[null,[Validators.required,Validators.pattern(GlobalConstants.emailRegex)]],
  adresse:[null],
  education:[null,],
  emploi:[null,],
  twitter:[null,],
  facebook:[null],
  linked:[null],
  instagram:[null],
  bio:[null],
 
});
this.passForm = this.formBuilder.group({
  currentPassword: ['', [Validators.required]],
  newPassword:[null,[Validators.required,this.passwordValidatorMinLength,this.passwordValidator]],
  confirmationPassword:[null,Validators.required] 
}, { validator: this.passwordMatchValidator });

 this.loadPostCount();
;
this.userService.findAll().subscribe(users => {
  this.users = users;
  this.filteredUsers = this.userService.filterUsers(users, this.searchUsername,this.searchEmail);
  
});

 
  
    this.profileForm.controls['username'].valueChanges.pipe(
      debounceTime(300)
    ).subscribe((username: string) => {
      this.searchUsername = username;
  
      // Filtrer la liste en excluant l'utilisateur actuel
      this.filteredUsers = this.users.filter(user => user.username !== this.user.username);
  
      // Vérifier si le nom d'utilisateur existe parmi les utilisateurs filtrés
      this.usernameExists = this.filteredUsers.some((user:any) => 
        user.username?.toLowerCase() === username?.toLowerCase()
      );
    });
  

  
  this.profileForm.controls['email'].valueChanges.pipe(
    debounceTime(300)
  ).subscribe((email: string) => {
    this.searchEmail= email;

    // Filtrer la liste en excluant l'utilisateur actuel
    this.filteredUsers = this.users.filter(user => user.email !== this.user.email);

    // Vérifier si le nom d'utilisateur existe parmi les utilisateurs filtrés
    this.emailExists = this.filteredUsers.some(user => 
      user.email?.toLowerCase() === email?.toLowerCase()
    );
  });
 
}

filterUser(): void {
  // Filtrer les utilisateurs en fonction de la recherche
  this.filteredUsers = this.userService.filterUsers(this.users, this.searchUsername, this.searchEmail);

  // Vérifier si le nom d'utilisateur existe dans les utilisateurs filtrés
  this.usernameExists = this.filteredUsers.some(user => 
    user.username.toLowerCase() === this.searchUsername.toLowerCase()
  );
}
  
toggleDropdown() {
  this.dropdownOpen = !this.dropdownOpen;
}

onSelectCountry(country: string) {
  this.user.pays = country;
  this.dropdownOpen = false; // Fermer le menu après sélection
}
  loadPostCount(): void {
    this.posteService.getPostCountByUser(this.id).subscribe(
      count => this.postCount = count,
      error => console.error('Erreur lors de la récupération du nombre de postes', error)
    );
  }
  openChat()
  {
    this.chatService.initiateChat(this.id, true);
   this.router.navigate(['/chat']);
  }

  openChatFriend(userId:number){

 this.chatService.initiateChat(userId, true);
   this.router.navigate(['/chat']);

  }
 clickMenu(){
  const poste = document.querySelector('.poste') as HTMLFormElement;
  const menuList = document.querySelector('.listeMenu') as HTMLFormElement;
  const posteLink =document.querySelector('.posteLink')as  HTMLFormElement;
  const general =document.querySelector('.general') as HTMLFormElement;
  const social =document.querySelector('.social') as HTMLFormElement;
  const password =document.querySelector('.changePassword') as HTMLFormElement;
  const generalLink =  document.querySelector('.generalLink') as HTMLFormElement;
  const passwordLink=document.querySelector('.passwordLink') as HTMLFormElement;
  const socialLink =document.querySelector('.socialLink') as HTMLFormElement;
  posteLink?.addEventListener('click',()=>{
    poste?.classList.remove('active');
    menuList.classList.remove('active');

  })
  generalLink?.addEventListener('click',()=>{
    menuList?.classList.add('active');
    poste?.classList.add('active');
    general?.classList.remove('active');
    password?.classList.remove('active');
    social?.classList.remove('active')

   })
   passwordLink?.addEventListener('click',()=>{
    menuList?.classList.add('active');
    poste?.classList.add('active');
    general?.classList.add('active');
    password?.classList.add('active');
    social?.classList.remove('active')

   })
   socialLink?.addEventListener('click',()=>{
    menuList?.classList.add('active');
    poste?.classList.add('active');
    social?.classList.add('active');
    password?.classList.remove('active');
    general?.classList.add('active');
   })
  console.log("generale");
 }

 clickLinkGenerale(){
  const poste = document.querySelector('.poste') as HTMLFormElement;
  const menuList = document.querySelector('.listeMenu') as HTMLFormElement;
  const general =document.querySelector('.general') as HTMLFormElement;
   const password =document.querySelector('.changePassword') as HTMLFormElement;
  const social =document.querySelector('.social') as HTMLFormElement;

    menuList?.classList.add('active');
    poste?.classList.add('active');
    general?.classList.remove('active');
    password?.classList.remove('active');
    social?.classList.remove('active')
  
 }
 clickLinkPoste(){
  const poste = document.querySelector('.poste') as HTMLFormElement;
  const menuList = document.querySelector('.listeMenu') as HTMLFormElement;
  poste?.classList.remove('active');
  menuList.classList.remove('active');
 }
 clickLinkPassword(){
  const poste = document.querySelector('.poste') as HTMLFormElement;
  const menuList = document.querySelector('.listeMenu') as HTMLFormElement;
  const password =document.querySelector('.changePassword') as HTMLFormElement;
  const general =document.querySelector('.general') as HTMLFormElement;
  const social =document.querySelector('.social') as HTMLFormElement;
  menuList?.classList.add('active');
  poste?.classList.add('active');
  general?.classList.add('active');
  password?.classList.add('active');
  social?.classList.remove('active')
 }
 clickLinkSocial(){
  const poste = document.querySelector('.poste') as HTMLFormElement;
  const menuList = document.querySelector('.listeMenu') as HTMLFormElement;
  const password =document.querySelector('.changePassword') as HTMLFormElement;
  const general =document.querySelector('.general') as HTMLFormElement;
  const social =document.querySelector('.social') as HTMLFormElement;
  menuList?.classList.add('active');
  poste?.classList.add('active');
  social?.classList.add('active');
  password?.classList.remove('active');
  general?.classList.add('active');
 }
  checkSidebarStatus():void{
    
    const sidebarActive = localStorage.getItem('sidebarActive');
    const container =document.querySelector('.container_profile');
    if (sidebarActive === 'true') {
        
      
      const newEvent = new Event('newEvent');
      container?.classList.add('active');
      window.dispatchEvent(newEvent);
    }
    
    if (sidebarActive === 'false') {
        
  
      const newEvent = new Event('newEvent');
      container?.classList.remove('active');
      window.dispatchEvent(newEvent);
    }
 
  }
 
  findByUsername(username:string): Promise<User>
 { return new Promise((resolve, reject) => {
    this.userService.findByUsername(username).subscribe(
      (user: User) => {
        this.userCurrent = user;
        console.log(this.userCurrent);
        resolve(user); // Résolvez la promesse avec l'utilisateur trouvé
      },
      (error) => {
        console.error('Error fetching user:', error);
        reject(error); // Rejetez la promesse en cas d'erreur
      }
    );
 });
} 

  findUser(id: number): Promise<User> {
    return new Promise((resolve, reject) => {
     this.userService.findById(id).subscribe(
         (user: User) => {
           this.user = user;
           this.preview=this.user.image;
           
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

   updateProfile(): void {
   /* if (!this.profileForm.controls['tel'].value) {
      this.profileForm.controls['tel'].clearValidators(); // Retirer la validation si tel est vide
      this.profileForm.controls['tel'].updateValueAndValidity();
    }*/
    
    if (this.profileForm.invalid) {
     /* console.log('Le formulaire contient des erreurs');
      Object.keys(this.profileForm.controls).forEach(key => {
        console.log(key, this.profileForm.controls[key].errors);
      });*/
      //this.errorUpdate = 'Une erreur est survenue lors de la mise à jour du profil';
      this.profileForm.markAllAsTouched();
      return;
    }
      let updatedUser = new User();
    updatedUser.username = this.profileForm.controls['username'].value;
    updatedUser.nom = this.profileForm.controls['nom'].value;
    updatedUser.prenom = this.profileForm.controls['prenom'].value;
    updatedUser.tel = this.profileForm.controls['tel'].value;
    updatedUser.email = this.profileForm.controls['email'].value;
    updatedUser.adresse = this.profileForm.controls['adresse'].value;
    updatedUser.education = this.profileForm.controls['education'].value;
    updatedUser.pays = this.selectedCountry !== '' ? this.selectedCountry : this.user.pays;
    updatedUser.bio = this.profileForm.controls['bio'].value;
    updatedUser.emploi = this.profileForm.controls['emploi'].value;
    updatedUser.compteFacebook = this.profileForm.controls['facebook'].value;
    updatedUser.compteTwitter = this.profileForm.controls['twitter'].value;
    updatedUser.compteInstagram = this.profileForm.controls['instagram'].value;
    updatedUser.compteLinked = this.profileForm.controls['linked'].value;
    console.log('updatedUser.username', updatedUser.username)
    
      
    
    // Appel au service pour mettre à jour l'utilisateur
    this.userService.updateUser(this.user.id, updatedUser)
    .subscribe({
      next: (response: User) => {
       
        this.user = response;
        
        this.user = { ...this.user, ...response }; 
        if(this.user.username !== updatedUser.username){
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
      },
      error: (error: HttpErrorResponse) => {
        this.errorUpdate = 'Une erreur est survenue lors de la mise à jour du profil';
        console.error('Erreur de mise à jour : ', error);
      }
    });
   
      

    
  }
  passwordValidatorMinLength(control: AbstractControl): { [key: string]: any } | null {
    const minLength = 8;

    if (control.value && control.value.length < minLength) {
      return { 'minlength': { requiredLength: minLength, actualLength: control.value.length } };
    }

    return null;
  }
  passwordValidator(control: FormControl): { [key: string]: boolean } | null {
    const value = control.value;
    if (!value) {
      return null;
    }
    const hasNumber = /[0-9]/.test(value);
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasSpecialCharacter = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const passwordValid = hasNumber && hasUpperCase && hasLowerCase && hasSpecialCharacter;
    if (!passwordValid) {
      return { passwordInvalid: true };
    }
    return null;
  }
  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const passwordControl = group.get('newPassword');
    const confirmPasswordControl = group.get('confirmationPassword');

    if (!passwordControl || !confirmPasswordControl) {
      return null; // Return null if controls are undefined
    }

    if (passwordControl.value !== confirmPasswordControl.value) {
      return { 'passwordMismatch': true };
    }

    return null;
  }
  get password() {
    return this.passForm.get('newPassword');
  }
  get confirmPassword() {
    return this.passForm.get('confirmationPassword');
  }
   async selectFile(event: any){
    this.message = '';
    this.preview = this.user.image;
    this.progress = 0;
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
        console.log(this.user.id);
        this.userService.updateUserImage(file,this.user.id).subscribe(
          (reponse:any) =>{ this.reponseMessage=reponse;
            console.log(this.reponseMessage)},
            (error) => {
              console.error('Error fetching user:', error);
              
            }
         
        );
      }
      
    }
    setTimeout(() => {
      window.location.reload(); // Recharge la page après un délai
    }, 2000); 
  }

  changerpassword()
  {  if(this.passForm.invalid)
  {    console.log('Le formulaire contient des erreurs');
    Object.keys(this.passForm.controls).forEach(key => {
      console.log(key, this.passForm.controls[key].errors);
    });
    this.errorUpdate = 'Une erreur est survenue lors de la mise à jour du profil';
    this.passForm.markAllAsTouched();
    return;
    
  }
  const passwordData = {
    currentPassword: this.passForm.value.currentPassword,
    newPassword: this.passForm.value.newPassword,
    confirmationPassword: this.passForm.value.confirmationPassword
  };
    this.userService.changePassword(this.passForm.value)
    .subscribe({
      next: (response) => {
        this.successMessage = 'Mot de passe mis à jour avec succès!';
        this.errorMessage = '';
      },
      error: (error) => {
        this.errorMessage = "Une erreur s'est produite lors de la mise à jour du mot de passe !";
        this.successMessage = '';
      }
    });
 
}

  
   
  showSection(section: string) {
    this.currentSection = section;
    
    // Enlever la classe 'active' de toutes les sections
    const sections = document.querySelectorAll('.section');
    sections.forEach((sec) => {
      sec.classList.remove('active');
    });
    
    // Ajouter la classe 'active' à la section sélectionnée
    const targetSection = document.getElementById(section);
    if (targetSection) {
      targetSection.classList.add('active');
    }
  }
 
  ShowMenu(menu:string)
  {  this.currentMenu=menu;
    const  mennus= document.querySelectorAll('.mennu');
    mennus.forEach((menu) => {
      menu.classList.remove('active');
    });
    
    // Ajouter la classe 'active' à la section sélectionnée
    const targetSection = document.getElementById(`${menu}-tab-pane`)
    if (targetSection) {
      targetSection.classList.add('active');
    }
  this.ShowLink(menu);
  }
    ShowLink(link:string)
    {  
      const  links= document.querySelectorAll('.nav-link');
      links.forEach((link) => {
        link.classList.remove('active');
      });
      
      // Ajouter la classe 'active' à la section sélectionnée
      const targetSection = document.getElementById(`${link}-tab`)
      if (targetSection) {
        targetSection.classList.add('active');
      }
  }
 

  togglePopup(event: MouseEvent) {
    const popupContent = (event.currentTarget as HTMLElement).nextElementSibling;
    if (popupContent) {
      (popupContent as HTMLElement).style.display = ((popupContent as HTMLElement).style.display === 'block') ? 'none' : 'block';
    }
  }

  popupBlock( user: any): void {
    this.user=user;
    this.renderer.setStyle(this.popupBloque.nativeElement, 'display', 'block');
   /* this.renderer.setStyle(this.overlay.nativeElement, 'display', 'block');
  
    const closePopup = (event: MouseEvent) => {
      if (event.target === this.overlay.nativeElement) {
        this.closePopup();
        this.overlay.nativeElement.removeEventListener('click', closePopup);
      }
    };
    
    this.overlay.nativeElement.addEventListener('click', closePopup);*/
    this.isOverlayVisible=true;
  }
  closePopup(): void {
    this.renderer.setStyle(this.popupBloque.nativeElement, 'display', 'none');
    this.renderer.setStyle(this.overlay.nativeElement, 'display', 'none');
  }
  initDropdowun(){

    document.querySelector('.select-trigger')?.addEventListener('click', function() {
      document.querySelector('.custom-select')?.classList.toggle('open');
    });
    
    document.querySelectorAll('.custom-option').forEach(option => {
      option.addEventListener('click', () => {
        const selectTriggerSpan = document.querySelector('.select-trigger span');
        if (selectTriggerSpan) {
          selectTriggerSpan.textContent = option.textContent; // Utilisation correcte de `option.textContent`
        }
        document.querySelector('.custom-select')?.classList.remove('open');
      });
    });
}

followUser() {
  this.followService.followUser(this.userCurrent.id, this.user.id).subscribe(
    response => {
      this.followService.updateFollowStatus(true); 
      let notif = new Notification()
      notif.actor= this.userCurrent;
      notif.recipients=[this.user];
      notif.reaction="suivre";
      notif.message =`${this.userCurrent.nom} ${this.userCurrent.prenom} vous suit `;
      notif.enabled = true;
      notif.read = false;
      this.notifService.onSendNotification(notif);
      console.log('Utilisateur suivi avec succès!');
    },
    error => {
      console.error('Erreur lors du suivi de l\'utilisateur', error);
    }
  );
}
unfollowUser()
{
  this.followService.unfollowUser(this.userCurrent.id, this.user.id).subscribe(
    response => {
      console.log('Utilisateur suivi avec succès!');
      this.followService.updateFollowStatus(false); 
     
    },
    error => {
      console.error('Erreur lors du suivi de l\'utilisateur', error);
    }
  );
}


isFollowing(followedId: number): Observable<boolean> {

  

  // Vérifier si l'utilisateur actuel est bien défini
  if (!this.userCurrent || !this.userCurrent.id) {
    console.error('Utilisateur actuel non défini.');
    return of(false); // Retourne "false" tant que l'utilisateur n'est pas défini
  }
   
  // Si l'utilisateur est défini, appeler le service de suivi
  return this.followService.isFollowing(this.userCurrent.id, followedId);
}
checkFollowingStatus(followedId: number): void {
  if (this.userCurrent && this.userCurrent.id) {
    this.isFollowing(followedId).subscribe(
      (isFollowing: boolean) => {
        console.log(`Suivi de l'utilisateur ${followedId} : ${isFollowing}`);
        this.isFollowingStatus = isFollowing; // Met à jour la variable locale
      },
      (error) => {
        console.error('Erreur lors de la vérification du suivi:', error);
        this.isFollowingStatus = null; // Gérer l'erreur
      }
    );
  } else {
    console.error('Utilisateur actuel non défini pour la vérification du suivi.');
  }
}

loadFollowers() {
  this.followService.getFollowers(this.id).pipe(
    switchMap((followers: any[]) =>
      forkJoin(
        followers.map((follower: any) =>
          forkJoin({
            isBlocked: this.blockService.isUserBlocked(this.user.id, follower.id),
            isBlockedByFollower: this.blockService.isUserBlocked(follower.id, this.user.id)
          }).pipe(
            map(({ isBlocked, isBlockedByFollower }) => 
              !isBlocked && !isBlockedByFollower ? follower : null
            )
          )
        )
      )
    ),
    map(filteredFollowers => filteredFollowers.filter(follower => follower !== null))
  ).subscribe(
    (filteredFollowers: any[]) => this.followers = filteredFollowers,
    error => console.error('Erreur lors du chargement et du filtrage des abonnés', error)
  );
}

// Charger et filtrer les utilisateurs suivis (followedUsers)
loadFollowedUsers() {
  this.followService.getFollowedUsers(this.id).pipe(
    switchMap((followedUsers: any[]) =>
      forkJoin(
        followedUsers.map((followedUser: any) =>
          forkJoin({
            isBlocked: this.blockService.isUserBlocked(this.user.id, followedUser.id),
            isBlockedByFollowedUser: this.blockService.isUserBlocked(followedUser.id, this.user.id)
          }).pipe(
            map(({ isBlocked, isBlockedByFollowedUser }) => 
              !isBlocked && !isBlockedByFollowedUser ? followedUser : null
            )
          )
        )
      )
    ),
    map(filteredFollowedUsers => filteredFollowedUsers.filter(followedUser => followedUser !== null))
  ).subscribe(
    (filteredFollowedUsers: any[]) => this.followedUsers = filteredFollowedUsers,
    error => console.error('Erreur lors du chargement et du filtrage des utilisateurs suivis', error)
  );
}
loadBlockedUsers()
{
  this.blockService.getBlockedUsers(this.userCurrent.id).subscribe(users => {
    this.blockedUsers = users;
  });
}
unblockUser(userBlockId:number): void {
 // ID de l'utilisateur connecté
  this.blockService.unblockUser(this.userCurrent.id, userBlockId).subscribe(response => {
    console.log(response);
    // Mettre à jour la liste après déblocage
    this.blockedUsers = this.blockedUsers.filter(user => user.id !== userBlockId);
    this.router.navigate(['/profile', userBlockId]).then(() => {
          window.location.reload();
        });
  });
}

blockUser(): void {
  if (this.user) {
    this.blockService.blockUser(this.userCurrent.id, this.user.id).subscribe(response => {
      console.log(response);
      this.router.navigate(['/home']);
    
    });
  }
}

handleOverlay(showOverlay: boolean) {
  this.isOverlayVisible = showOverlay;

}

handlePosteClose() {
  console.log("Le popup de poste a été fermé.");
  // Ici vous pouvez gérer toute action supplémentaire
  // que vous souhaitez prendre lorsque le popup est fermé
}

onOverlayClick(){
  this.isOverlayVisible=false;
  this.posteComponent.closePopupOverlay();
  this.renderer.setStyle(this.popupBloque.nativeElement, 'display', 'none');
}
/*
filterUser(): void {
  this.filteredUsers = this.userService.filterUsers(this.users, this.searchUsername, this.searchEmail);
}*/
checkUserExists(): boolean {
  return this.userService.checkUserExists(this.filteredUsers, this.searchUsername, this.searchEmail);
}
navProfile(user:User)
    {
     
        this.router.navigate(['/profile', user.id]).then(() => {
          window.location.reload();
        });
      }

      copyProfileLink()
      {
        const profileLink = `${window.location.origin}/profile/${this.id}`;
      navigator.clipboard.writeText(profileLink).then(() => {
        this.snackBar.open('Le lien du profile a été copié dans le presse-papier !', '', {
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
