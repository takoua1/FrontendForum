import { Component, OnInit } from '@angular/core';
import { User } from '../model/user';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { GlobalConstants } from '../shared/global-constants';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';
import { UserService } from '../services/user.service';
import { Subject, debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

 

  
   
    registerForm:any =FormGroup;
    loginForm:any =FormGroup;
    reponseMessage:any;
 isSuccessful= false;
 isSignUpFailed= false;
 errorMessage="";
 isLoggedIn = false;
 isLoginFailed = false;
 users: any[] = [];
 filteredUsers: any[] = [];
 searchUsername = '';
 searchEmail = '';
 usernameChecked: boolean | null = null;
 private usernameInput: Subject<string> = new Subject();
 rememberMe = false; 
 forgotPasswordForm: FormGroup;
 message: string = '';
 constructor(private formBuilder:FormBuilder,private userService:UserService, private router:Router, private authService: AuthService,private tokenStorage: TokenStorageService) {

 }
 ngOnInit(): void {
  
  this.ValidatorRegiter();
 this.ValidatorLogin();
 this.forgotPasswordForm = this.formBuilder.group({
  email:[null,[Validators.required,Validators.pattern(GlobalConstants.emailRegex)]],
});
 this.userService.findAll().subscribe(users => {
  this.users = users;
  this.filteredUsers = this.userService.filterUsers(users, this.searchUsername,this.searchEmail);
  
});

 

 

}

onSubmit() {
  if (this.forgotPasswordForm.valid) {
    const email = this.forgotPasswordForm.value.email;
    this.authService.forgotPassword(email)
      .subscribe({
        next: (response: any) => {
          
          window.localStorage.setItem('resetPasswordToken', response.resetToken);
          this.message = 'Un lien de réinitialisation du mot de passe a été envoyé à votre adresse e-mail.';
        },
        error: (err) => {
          //this.errorMessage = 'Erreur : ' + err.error.message;
          this.errorMessage='Une erreur s\'est produite. Veuillez réessayer.';

        }
      });
  }else{
    if (this.loginForm.invalid) {
      // Marque tous les champs comme touchés pour déclencher les validations
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

  }
}
filterUser(): void {
  this.filteredUsers = this.userService.filterUsers(this.users, this.searchUsername, this.searchEmail);
}
checkUserExists(): boolean {
  return this.userService.checkUserExists(this.filteredUsers, this.searchUsername, this.searchEmail);
}
 
   ValidatorRegiter()
   {
     this.registerForm = this.formBuilder.group({
  
       username:[null,[Validators.required,Validators.pattern(GlobalConstants.usernameRegex)]],
       nom:[null,[Validators.required,Validators.pattern(GlobalConstants.nameRegex)]],
       prenom:[null,[Validators.required,Validators.pattern(GlobalConstants.nameRegex)]],
       email:[null,[Validators.required,Validators.pattern(GlobalConstants.emailRegex)]],
       password:[null,[Validators.required,this.passwordValidatorMinLength,this.passwordValidator]],
       confirmPassword:[null,Validators.required] 
      }, { validator: this.passwordMatchValidator });
   }
 
   ValidatorLogin()
   {
     this.loginForm = this.formBuilder.group({
       username:[null,[Validators.required]],
       password:[null,[Validators.required]]
      })
 
   }
  passwordValidatorMinLength(control: AbstractControl): { [key: string]: any } | null {
     const minLength = 8;
 
     if (control.value && control.value.length < minLength) {
       return { 'minlength': { requiredLength: minLength, actualLength: control.value.length } };
     }
 
     return null;
   }
   
   passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
     const passwordControl = group.get('password');
     const confirmPasswordControl = group.get('confirmPassword');
 
     if (!passwordControl || !confirmPasswordControl) {
       return null; // Return null if controls are undefined
     }
 
     if (passwordControl.value !== confirmPasswordControl.value) {
       return { 'passwordMismatch': true };
     }
 
     return null;
   }
 
   get password() {
     return this.registerForm.get('password');
   }
   get confirmPassword() {
     return this.registerForm.get('confirmPassword');
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
     login(){
    
      if (this.loginForm.invalid) {
        // Marque tous les champs comme touchés pour déclencher les validations
        this.loginForm.markAllAsTouched();
        return;
      }
    this.loginForm.controls.password.value;
    
    
    
    this.authService.login(this.loginForm.controls.username.value,this.loginForm.controls.password.value)
      .subscribe((response:any)=>{
       
       console.log(response?.access_token);
       this.tokenStorage.saveToken(response.access_token);
       this.tokenStorage.saveUser(response);
      
         
       
 
 
       this.isLoginFailed = false;
       this.isLoggedIn = true;
       this.router.navigateByUrl("/");
      
        
      },
       err=>
       {
         this.reponseMessage=err.error?.message;
         this.isLoginFailed = true;
       }
     );
     }
    
   regisetr(){
    if (this.registerForm.invalid) {
      // Marque tous les champs comme touchés pour déclencher les validations
      this.registerForm.markAllAsTouched();
      return;
    }
    var etat:boolean;
    etat=true;
    let user = new User();
     user.username=this.registerForm.controls.username.value;
     user.nom=this.registerForm.controls.nom.value;
     user.prenom=this.registerForm.controls.prenom.value;
     user.password=this.registerForm.controls.password.value;
     user.email=this.registerForm.controls.email.value;
     user.role="USER";
     user.status="CONNECTE";
    
     console.log(user);
     this.authService.register(user)
      .subscribe((reponse:any)=>{
       this.reponseMessage=reponse?.message;
       this.linkLogin();
      
        
      },
       err=>
       {
         this.reponseMessage=err.error?.message;
         this.isSignUpFailed= true;
         
       }
     );
     
   }
    
 
  

    public  myMenuFunction(): void {
     const i = document.getElementById("navMenu") ;
     if (i) {
         if (i.className === "nav-menu") {
             i.className += " responsive";
         } else {
             i.className = "nav-menu";
         }
     }
 }
 
  public linkLogin(): void {
   
   const x = document.getElementById("login")  ;
   const y = document.getElementById("register")  ;
   const z=  document.getElementById("forgotPassword");
   if (x && y && z) {
       x.style.left = "4px";
       y.style.right = "-520px";
       z.style.right = "-520px";

       x.style.opacity = "1";
      
       z.style.opacity = "0";
   }
   this.registerForm.reset();
 
 }
 
 public linkRegister(): void {
 
   const x = document.getElementById("login")  ;
   const y= document.getElementById("register")  ;
   if (x && y )
     {  x.style.left = "-510px";
       y.style.right = "5px";
      
       x.style.opacity = "0";
       y.style.opacity = "1";
   }
   this.loginForm.reset();
 }
  
 public linkforget(): void {
 
  const x = document.getElementById("login")  ;
  const y= document.getElementById("forgotPassword")  ;
  if (x && y )
    {  x.style.left = "-510px";
      y.style.right = "5px";
     
      x.style.opacity = "0";
      y.style.opacity = "1";
  }
  this.loginForm.reset();
}
}
