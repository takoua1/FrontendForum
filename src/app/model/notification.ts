import { Comment } from "./comment";
import { Interaction } from "./interaction";
import { Poste } from "./poste";
import { User } from "./user";

export class Notification {

    id:number;
    actor:User;
    message:string;
    recipients:User[];
    poste: Poste; 
    comment: Comment;
    interaction:Interaction;
    reaction:string;
    dateCreate:Date;
    read:boolean;
  
    enabled:boolean;
}
