import { Chat } from "./chat.model";

export interface UserInterface {
    uid?: string;
    email?: string;
    displayName?: string;
    claims?: {
        superAdmin: boolean,
        admin: boolean,
        basic: boolean
    };
    profilePicture?: string;
}

export type Claims = {
    superAdmin: boolean,
    admin: boolean,
    basic: boolean
}

export class UserClass extends Chat{
    [key: string] : string | undefined  | Claims
    constructor(
        id?:string,
       uid?: string,
       email?: string,
       displayName?: string,
       message?:string,
        date?: string,
       private claims?: Claims,
        public  profilePicture?: string,
    ){
        super(id, uid, displayName, email, message, date)
    }
}