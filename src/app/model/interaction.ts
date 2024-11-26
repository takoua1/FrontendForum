import { Comment } from "./comment";
import { Poste } from "./poste";
import { User } from "./user";

export class Interaction {

id:number;
like:number;
dislike:number;
datecreation:Date;
user:User;
type:string;
poste:Poste;
comment:Comment;
}
