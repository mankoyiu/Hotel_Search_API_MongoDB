import { User } from "./user";

export const sampleAgency: User[] = [
    {
        username: "agencyq",
        password: "abc123",
        email: "agencyq@wanderlust.com",
        phone: "86123402",
        name: {
            firstname: "Q",
            lastname: "No Last Name",
            nickname: "iamq"
        },
        status: true,
        role: 1  // 1 for agency; 2 for member
    },
    {
        username: "kachun01",
        password: "abc123",
        email: "kachun@wanderlust.com",
        phone: "86123422",
        name: {
            firstname: "Shing On",
            lastname: "Kam",
            nickname: "kachun"
        },
        status: false,
        role: 1  // 1 for agency; 2 for member
    }
];
