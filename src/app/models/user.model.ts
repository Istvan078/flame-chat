export interface UserInterface {
    uid: string
    email: string
    displayName: string
    claims: {
        superAdmin: boolean,
        admin: boolean,
        basic: boolean
    }
    profilePicture: string
}