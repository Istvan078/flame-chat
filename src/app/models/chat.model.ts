export class Chat {
    
 [indexS:string]: string
    constructor(
        
        public id: string = "",
        public uid: string = "",
        public displayName: string = "",
        public email: string = "",
        public message: string = "",
        public date: string = "",
    ) { }
}