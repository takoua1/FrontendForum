import { ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../services/user.service';
import { TokenStorageService } from '../services/token-storage.service';
import { PosteService } from '../services/poste.service';
import { User } from '../model/user';
import { Poste } from '../model/poste';

import { Subject, forkJoin, from, map, mergeMap, switchMap, tap, toArray } from 'rxjs';
import { Comment } from '../model/comment';
import { CommentService } from '../services/comment.service';
import { CommentComponent } from '../shared/comment/comment.component';
import { SharedService } from '../shared/shared.service';
import { Interaction } from '../model/interaction';
import { InteractionService } from '../services/interaction.service';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  
  

})
export class HomeComponent implements OnInit {
 
  @Input() categorie:string;
  ngOnInit(): void {
   
  
   
  }


   



}
