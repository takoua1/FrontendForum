
import { Poste } from "./poste";
import { User } from "./user";

export class Comment {
 id: number;
 idtag:number;
 text: string;
 poste:Poste;

 parentComment: Comment; 
 childComments: Comment[];
 user:User;
 enabled:boolean;
 dateCreate: Date ;
}
