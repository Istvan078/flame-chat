import { Claims } from "./user.model";

export class Chat {
    
 [indexS:string]: string | undefined | Claims
    constructor(
        
        public id: string = "",
        public uid: string = "",
        public displayName: string = "",
        public email: string = "",
        public message: string = "",
        public date: string = "",
    ) { }
}