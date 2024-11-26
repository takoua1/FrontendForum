

import { Groupe } from "./groupe";
import { Message } from "./message";
import { User } from "./user";

export class Chat {
    id: number; 
  typeChat: string; 
  membres: User[]; 
  lastMessage:Date;
  messages: Message[];
  
}
