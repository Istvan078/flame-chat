

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


export class UserClass{
    [key: string] : string | object | undefined

    public friends: {
        
        key: {uid: string,
        displayName: string,
        email: string}
    }

    constructor(
      public uid: string = '',
      public email: string = '',
      public displayName: string = '',
    //   public message?:string,
    //   public  date?: string,
       private claims?: {    
       superAdmin: boolean ,
       admin: boolean ,
       basic: boolean ,
    },
        public  profilePicture: string = '',
    ){
        this.friends = 
            
          { key:  {
                uid: "",
                displayName: "",
                email: "",
            }}
        
    }
}