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

export class UserClass {
    [key: string] : string | undefined | object | Date
    constructor(
       private uid?: string,
       public email?: string,
       public displayName?: string,
       private claims?: {
            superAdmin: boolean,
            admin: boolean,
            basic: boolean
        },
        public  profilePicture?: string,
    ){}
}