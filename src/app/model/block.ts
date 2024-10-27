import { User } from "./user";

export class Block {
    id:number;
    blocker:User;
    blocked:User;
    blockedAt:Date;
}
