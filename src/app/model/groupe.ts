
import { Chat } from "./chat";

import { User } from "./user";

export class Groupe {
    id: number; 
    groupName: string;
    groupImage:string;
    category:string;
    dateCreate:Date;
    userCreature:User;
    chat:Chat;
    userJoinDates: { [userId: number]: string }
    blockedMembers:User[];
}
