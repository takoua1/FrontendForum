import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
 
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  newPassword: string = '';
  confirmPassword: string = '';
  successMessage: string = '';
  errorMessage: string = '';
 message='';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.resetPasswordForm = this.fb.group({
      newPassword: [null,[Validators.required,this.passwordValidatorMinLength,this.passwordValidator]],
      confirmPassword:[null,Validators.required] 
      }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Récupérer le token de l'URL
   
  }

  onSubmit() {
    if (this.resetPasswordForm.valid) {
      const newPassword = this.resetPasswordForm.value.newPassword;
      const resetToken = window.localStorage.getItem('resetPasswordToken');
      if (!resetToken) {
        //this.errorMessage = "Token de réinitialisation introuvable.";
        this.errorMessage ="Erreur de réinitialisé de mot de passe."
      }
  else{
    
      this.authService.resetPassword(resetToken, newPassword).subscribe({
        next: (response: any) => {

          this.message = 'Mot de passe réinitialisé avec succès.';
          window.localStorage.removeItem('resetPasswordToken'); 
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        
        },
        error: (err:any) => {
          //this.errorMessage = 'Erreur lors de la réinitialisation : ' + err.error.message;
           this.errorMessage ="Erreur de réinitialisé de mot de passe."
        }
      });
      console.log(this.message)
    }}else{

      this.resetPasswordForm.markAllAsTouched();
      return;
    }
  }

  login()
  {
    this.router.navigate(['/login']);
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
}
