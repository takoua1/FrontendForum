import { ChangeDetectorRef, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { TokenStorageService } from '../services/token-storage.service';
import { UserService } from '../services/user.service';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from '../model/user';
import { GlobalConstants } from '../shared/global-constants';
import { ActivatedRoute, Router } from '@angular/router';
import { observableToBeFn } from 'rxjs/internal/testing/TestScheduler';
import { MessageService } from '../services/message.service';

import { Observable, of } from 'rxjs';
import { Message } from '../model/message';
import { ChatService } from '../services/chat.service';
import { PosteService } from '../services/poste.service';
import { FollowService } from '../services/follow.service';
import { BlockService } from '../services/block.service';
import { PosteComponent } from '../shared/poste/poste.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
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
  id:number;
errorMessage="";
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
@ViewChild('overlay') overlay: ElementRef;
@ViewChild('popupBloque', { static: false }) popupBloque!: ElementRef;
@ViewChild('posteComponent') posteComponent!: PosteComponent;
  constructor(private token: TokenStorageService,private route: ActivatedRoute,
    private userService: UserService,private formBuilder:FormBuilder
    ,private messageService:MessageService, private chatService :ChatService,
    private router: Router,private renderer: Renderer2,private posteService:PosteService,
    private followService: FollowService, private blockService:BlockService,private el: ElementRef
  ) {
    
   }
 
  ngOnInit(): void {

    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.findUser(this.id);
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
this.findByUsername(user.username)
.then((userFound) => {
  console.log('Utilisateur actuel récupéré:', this.userCurrent);
  if (this.userCurrent && this.user && this.user.id) {
    this.checkFollowingStatus(this.user.id);
    this.loadBlockedUsers();
  } else {
    console.error('Utilisateur actuel ou cible non défini.');
  }
  
  // S'abonner au BehaviorSubject pour écouter les changements en temps réel
  this.followService.followStatus$.subscribe((isFollowing: boolean) => {
    this.isFollowingStatus = isFollowing;
    console.log('Statut de suivi mis à jour:', isFollowing);
  });
})
.catch((error) => {
  console.error('Erreur lors de la récupération de l\'utilisateur:', error);
});
   this.profileForm = this.formBuilder.group({
 
    username:[null,[Validators.required,Validators.pattern(GlobalConstants.usernameRegex)]],
    nom:[null,[Validators.required,Validators.pattern(GlobalConstants.nameRegex)]],
    prenom:[null,[Validators.required,Validators.pattern(GlobalConstants.nameRegex)]],
   
  tel:[null],
  email:[null,[Validators.required,Validators.pattern(GlobalConstants.emailRegex)]],
  adresse:[null,[Validators.required]],
  education:[null,[Validators.required]],
  emploi:[null,[Validators.required]],
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
 this.loadFollowers();
this.loadFollowedUsers();

  }
  onSelectCountry(country: string): void {
    this.selectedCountry = country;
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

  findUser(id: number) {
   
       this.userService.findById(id).subscribe(
         (user: User) => {
           this.user = user;
           this.preview=this.user.image;
           
           console.log(this.user);

          
         },
         (error) => {
           console.error('Error fetching user:', error);
        
         }
       );
   
   }

  updateProfile()

  {
    let user = new User();
    user.username = this.profileForm.controls['username'].value;
    user.nom = this.profileForm.controls['nom'].value;
    user.prenom = this.profileForm.controls['prenom'].value;
       
    user.tel = this.profileForm.controls['tel'].value;
    user.email = this.profileForm.controls['email'].value;
   user.adresse=this.profileForm.controls['adresse'].value;
   user.education=this.profileForm.controls['education'].value;
   if(this.selectedCountry!=='')
   { user.pays=this.selectedCountry;}
   else{  user.pays=this.user.pays;}
 
    user.bio=this.profileForm.controls['bio'].value;
    user.emploi =this.profileForm.controls['emploi'].value;
    user.compteFacebook=this.profileForm.controls['facebook'].value;
    user.compteTwitter=this.profileForm.controls['twitter'].value;
    user.compteInstagram=this.profileForm.controls['instagram'].value;
    user.compteLinked=this.profileForm.controls['linked'].value;
    // Appel au service pour mettre à jour l'utilisateur
    this.userService.updateUser(this.user.id, user)
      .subscribe({
        next: (response: any) => {
          this.reponseMessage = 'Profil mis à jour avec succès';
        },
        error: (error: any) => {
          this.reponseMessage = 'Une erreur est survenue lors de la mise à jour du profil';
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
  selectFile(event: any): void {
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
  }

  changerpassword()
  {

    this.userService.changePassword(this.passForm.value)
    .subscribe({
      next: (response) => {
        
        this.router.navigate(['/profile']);  // Redirige vers la page de profil
      },
      error: (error) => {
        this.errorMessage = error.error || 'Une erreur est survenue';
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
    this.renderer.setStyle(this.overlay.nativeElement, 'display', 'block');
  
    const closePopup = (event: MouseEvent) => {
      if (event.target === this.overlay.nativeElement) {
        this.closePopup();
        this.overlay.nativeElement.removeEventListener('click', closePopup);
      }
    };
  
    this.overlay.nativeElement.addEventListener('click', closePopup);
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
  this.followService.getFollowers(this.id).subscribe(
    (data: User[]) => {
      this.followers = data;
    },
    error => {
      console.error('Erreur lors du chargement des abonnés', error);
    }
  );
}

// Charger les utilisateurs suivis
loadFollowedUsers() {
  this.followService.getFollowedUsers(this.id).subscribe(
    (data: User[]) => {
      this.followedUsers = data;
    },
    error => {
      console.error('Erreur lors du chargement des utilisateurs suivis', error);
    }
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
}
}
