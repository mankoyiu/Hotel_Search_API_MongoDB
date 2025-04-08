export interface User {
    username: string,
    password: string,
    token?: string,
    email: string,
    phone: string,
    name: {
        firstname: string,
        lastname: string,
        middlename?: string,
        nickname: string
    },
    status: boolean,
    role: number
    rofilePhoto?: string; 
}
    
