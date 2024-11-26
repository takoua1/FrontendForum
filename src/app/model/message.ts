import { Chat } from "./chat";
import { Groupe } from "./groupe";
import { User } from "./user";

export class Message {

    id: number;
    content: string;
    image:string;
    video:string;
    audio:string;
    time: Date;
    sender: User;
    receivers: User[];
    read:boolean;
    chat: Chat;
}
