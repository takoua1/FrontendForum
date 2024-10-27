import { ElementRef, Injectable, ViewChild } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private showChildsSubject: BehaviorSubject<{ [id: number]: boolean }> = new BehaviorSubject({});
  public showChilds$: Observable<{ [id: number]: boolean }> = this.showChildsSubject.asObservable();
 /* @ViewChild('popupSignale') popupSignale: ElementRef ;
  @ViewChild('overlay') overlay: ElementRef ;*/
  currentStep = 1;
  constructor() { }
 
  updateShowChilds(showChilds: { [id: number]: boolean }) {
    this.showChildsSubject.next(showChilds);
    
  }

  triggerTogglePopupDelete(): void {
    this.togglePopupDelete();}
  togglePopupDelete(): void {
    const popupDelete = document.querySelector('.popupDelete') as HTMLElement;
    const overlay = document.querySelector('.overlay') as HTMLElement;
    popupDelete.style.display = 'block';
    overlay.style.display = 'block';
    overlay.addEventListener('click', function () {
      popupDelete.style.display = 'none';
      overlay.style.display = 'none';
    });
  }

  triggerTogglePopupSignale(): void {

this.togglePopupSignale();
  }
  togglePopupSignale() {
   const popupSignale  = document.querySelector('.popupSignale') as HTMLElement;
    const overlay = document.querySelector('.overlay') as HTMLElement;
    popupSignale.style.display = 'block';
    overlay.style.display = 'block';
  
    // Ajout d'un seul écouteur pour la fermeture du popup
    overlay.addEventListener('click', function(){
      popupSignale.style.display = 'none';
      overlay.style.display = 'none';
      // Supprimer l'écouteur après fermeture
    
     
    });
    this.currentStep=1;

    
      
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
  
  }
  
