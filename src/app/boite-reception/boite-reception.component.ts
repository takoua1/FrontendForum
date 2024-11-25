import { Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { MessageMailService } from '../services/message-mail.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { TokenStorageService } from '../services/token-storage.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-boite-reception',

  templateUrl: './boite-reception.component.html',
  styleUrl: './boite-reception.component.css',
  animations: [
    trigger('mailAnimation', [
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

export class BoiteReceptionComponent  implements OnInit,OnDestroy{
 
  selectedMail: any = null;
  isPopupVisible = false;
  mails: any[]=[] ;
  mail:any;
  mailSubscription: Subscription | undefined;
  mailCountSubscription: Subscription | undefined;
  mailCount: number = 0;
  private mailSubject:  BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  @ViewChild('overlay') overlay: ElementRef ;
  @ViewChild('popupDelete', { static: false }) popupDelete!: ElementRef;
  constructor(private mailService:MessageMailService, private token:TokenStorageService,private renderer: Renderer2)
    
   {
    this.mails.forEach(mail => {
      mail.contenu = mail.contenu.replace(/\n/g, '<br>');
    });
    
  }
   

  ngOnInit(): void {

    
 this.mailSubscription=  this.mailService.getMailStatus().subscribe((mail) => {
  if (mail) {
          console.log("mail",mail)
    this.loadMails();
 
  }
},
(error) => {
  console.error('Error receiving signale status:', error);
});
this.loadMails();


}

    
  


 
  openDetails(mail: any): void {
    this.selectedMail = mail;
    this.isPopupVisible = true;
  }

  closePopup(): void {
    this.isPopupVisible = false;
    this.selectedMail = null;
  }


  toggleDetails(mail: any) {
    mail.showDetails = !mail.showDetails;
    console.log("this.mails",this.mails);
    this.mailService.markMessageAsRead(mail.id).subscribe(
      () => {
          console.log(`Messages in Mail ID ${mail.id} marked as read.`);
          const mailRead = this.mails.find((mailMsg:any) => mailMsg.id === mail.id);
          if(mailRead)
          {
            mailRead.read = true;
            this.mailService.updateUnTraitesCount(this.mails);
          }
      },
      (error) => {
          console.error(`Error marking messages as read for Mail ID ${mail.id}:`, error);
      }
  );

  }

  loadMails()
  { const user = this.token.getUser();
    this.mailService.getMails(user.username).subscribe(
      (data: any[]) => {
        this.mails = data;
      this.mailService.updateUnTraitesCount(this.mails);
        this.mails.forEach(mail => {
          mail.contenu = mail.contenu.replace(/\n/g, '<br>');
        });
        
        console.log("this.mailss",this.mails)
      
      })
     
      }




      disableMail(id: number): void {
        this.mailService.disableMail(id).subscribe(() => {
          this.loadMails(); 
        });
      }


      PopupDelete( mail: any): void {
        this.mail=mail;
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
      Delete(): void { 
        this.mailService.disableMail(this.mail.id).subscribe(() => {
          // Mise à jour de la liste des notifications
          this.loadMails();
          // Fermeture du popup
          this.closePopupDelete();
        
        })}
      ngOnDestroy(): void {
        if (this.mailSubscription) {
          this.mailSubscription.unsubscribe();
        }
      }
  }

