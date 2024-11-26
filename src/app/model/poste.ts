import { Comment } from "./comment";
import { Interaction } from "./interaction";
import { Notification } from "./notification";
import { User } from "./user";

export class Poste {
    id:number;
    message:string;
    category:string;
    dateCreate:Date;
    image:string;
    user:User;
 
    comments:Comment[];
    enabled:boolean;
    expanded :boolean;
  
  
}
