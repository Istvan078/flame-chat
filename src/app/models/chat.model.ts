

export class Chat {
    public static  count: number 

    public static increaseCount(count:number) {
       return count++;
    }
 [indexS:string]: string|number 
    constructor(
        
        public id: string = '',
        public uid: string = '',
        public displayName: string = '',
        public email: string = '',
        public message: string = '',
        public date: string = '',
        public count: number = 0
       // public count: number = 0
    ) { }
}