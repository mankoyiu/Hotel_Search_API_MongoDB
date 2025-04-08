/* models/message.ts */
export interface Message {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    timestamp: Date;
    }
    
    export class MessageModel {
    private static messages: Message[] = [];
    
    // Send a new message
    static sendMessage(senderId: number, receiverId: number, content: string): Message {
    const newMessage: Message = {
    id: this.messages.length + 1,
    senderId,
    receiverId,
    content,
    timestamp: new Date(),
    };
    this.messages.push(newMessage);
    return newMessage;
    }
    
    // Retrieve all messages
    static getAllMessages(): Message[] {
    return this.messages;
    }
    }