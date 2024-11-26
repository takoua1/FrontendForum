import { Comment } from "./comment";
import { Poste } from "./poste";
import { User } from "./user";

export class Signale {
    id: number;
  titre: string;
  raison: string;
  description: string;
  dateSignale: Date;
  user: User;
  poste: Poste;
  comment: Comment;
  estTraite: boolean;
  decision: string;
  admin: User;
}
