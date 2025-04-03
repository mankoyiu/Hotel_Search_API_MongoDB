import { User } from "./user";

/* models/members.ts */
export interface Member extends User {} 

export class MemberModel {
    private static members: Member[] = [];

    // Create a new member account
    static createMember(
        username: string,
        password: string,
        email: string,
        phone: string,
        name: {
            firstname: string,
            lastname: string,
            middlename?: string,
            nickname: string
        }
    ): Member {
        const newMember: Member = {
            username,
            password,
            email,
            phone,
            name,
            status: true,
            role: 1 // Assuming 1 is for regular members
        };
        this.members.push(newMember);
        return newMember;
    }

    // Update an existing member account
    static updateMember(username: string, data: Partial<Member>): Member | null {
        const member = this.members.find(m => m.username === username);
        if (!member) return null;
        
        // Update basic user fields
        if (data.password) member.password = data.password;
        if (data.email) member.email = data.email;
        if (data.phone) member.phone = data.phone;
        if (data.status !== undefined) member.status = data.status;
        if (data.role !== undefined) member.role = data.role;

        // Update name fields
        if (data.name) {
            if (data.name.firstname) member.name.firstname = data.name.firstname;
            if (data.name.lastname) member.name.lastname = data.name.lastname;
            if (data.name.middlename !== undefined) member.name.middlename = data.name.middlename;
            if (data.name.nickname) member.name.nickname = data.name.nickname;
        }

        return member;
    }

    // Delete a member account
    static deleteMember(username: string): boolean {
        const index = this.members.findIndex(m => m.username === username);
        if (index === -1) return false;
        this.members.splice(index, 1);
        return true;
    }

    // Retrieve a member by username
    static getMemberByUsername(username: string): Member | undefined {
        return this.members.find(m => m.username === username);
    }

    // Retrieve all members
    static getAllMembers(): Member[] {
        return [...this.members]; // Return copy to prevent direct manipulation
    }
}