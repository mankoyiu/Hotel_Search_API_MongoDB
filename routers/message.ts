import Router from 'koa-router';
import { Context } from 'koa';
import bodyParser from 'koa-bodyparser';
import * as db from '../helpers/dbhelpers'; // Import your database helper functions
import { ObjectId } from 'mongodb';
import { basicAuth } from '../controllers/basicauth';

const router = new Router({ prefix: '/api/v1/message' });

// Use basicAuth middleware for all routes
router.use(basicAuth);

// Get all messages for the authenticated user
const getMsg = async (ctx: Context) => {
    try {
        // User info is already attached to ctx.state by basicAuth middleware
        const messages = await db.find('messages', {
            $or: [
                { sender: ctx.state.user.username },
                { receiver: ctx.state.user.username }
            ]
        });

        ctx.status = 200;
        ctx.body = {
            message: 'Messages retrieved successfully',
            data: messages
        };
    } catch (err) {
        console.error('Get messages error:', err);
        ctx.status = 500;
        ctx.body = { message: 'Internal server error' };
    }
};

// Send a new message
const sendMessage = async (ctx: Context) => {
    try {
        console.log('Received message request:', ctx.request.body);
        const { receiver, content, type = 'text' } = ctx.request.body as { receiver: string; content: string; type?: string };
        const sender = ctx.state.user.username;
        const senderRole = ctx.state.user.role;

        console.log('Message details:', { sender, receiver, content, type, senderRole });

        if (!receiver || !content) {
            console.log('Missing required fields:', { receiver, content });
            ctx.status = 400;
            ctx.body = { message: 'Receiver username and content are required' };
            return;
        }

        // Validate message type
        if (!['text', 'image', 'file'].includes(type)) {
            console.log('Invalid message type:', type);
            ctx.status = 400;
            ctx.body = { message: 'Invalid message type' };
            return;
        }

        // Check if receiver exists
        const receiverUser = await db.find('users', { username: receiver });
        console.log('Receiver lookup result:', receiverUser);

        if (receiverUser.length === 0) {
            console.log('Receiver not found:', receiver);
            ctx.status = 404;
            ctx.body = { message: 'Receiver not found' };
            return;
        }

        const receiverRole = receiverUser[0].role;
        console.log('Receiver role:', receiverRole);

        // Validate sender and receiver roles
        if (senderRole === 2 && receiverRole === 2) {
            console.log('Members cannot send messages to other members');
            ctx.status = 403;
            ctx.body = { message: 'Members cannot send messages to other members' };
            return;
        }

        if (senderRole === 1 && receiverRole === 1) {
            console.log('Agencies cannot send messages to other agencies');
            ctx.status = 403;
            ctx.body = { message: 'Agencies cannot send messages to other agencies' };
            return;
        }

        if (senderRole !== 1 && senderRole !== 2) {
            console.log('Invalid sender role:', senderRole);
            ctx.status = 403;
            ctx.body = { message: 'Only members and agencies can send messages' };
            return;
        }

        // Create new message
        const newMessage = {
            sender,
            receiver,
            content,
            type,
            createdAt: new Date(),
        };

        console.log('Attempting to save message:', newMessage);
        const result = await db.add('messages', newMessage);
        console.log('Database result:', result);

        if (result.acknowledged) {
            console.log('Message sent successfully');
            ctx.status = 201;
            ctx.body = {
                message: 'Message sent successfully',
                data: {
                    id: result.insertedId,
                    ...newMessage,
                },
            };
        } else {
            console.log('Failed to save message:', result);
            ctx.status = 500;
            ctx.body = { message: 'Failed to send message' };
        }
    } catch (err) {
        console.error('Send message error:', err);
        ctx.status = 500;
        ctx.body = { 
            message: 'Internal server error',
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
};

// Delete a message
const deleteMsg = async (ctx: Context) => {
    try {
        const { messageId } = ctx.request.body as { messageId: string };

        if (!messageId) {
            ctx.status = 400;
            ctx.body = { message: 'Message ID is required' };
            return;
        }

        // Convert string ID to ObjectId
        let objectId;
        try {
            objectId = new ObjectId(messageId);
        } catch (err) {
            ctx.status = 400;
            ctx.body = { message: 'Invalid message ID format' };
            return;
        }

        // Fetch the message to verify the sender or receiver
        const message = await db.findById('messages', messageId);

        if (!message) {
            ctx.status = 404;
            ctx.body = { message: 'Message not found' };
            return;
        }

        const sender = message.sender;
        const receiver = message.receiver;
        const currentUser = ctx.state.user.username;

        // Check if the authenticated user is the sender or receiver
        if (sender === currentUser || receiver === currentUser) {
            const result = await db.remove('messages', { _id: objectId });
            
            if (result && result.deletedCount > 0) {
                ctx.status = 200;
                ctx.body = { message: 'Message deleted successfully' };
            } else {
                ctx.status = 500;
                ctx.body = { message: 'Failed to delete message' };
            }
        } else {
            ctx.status = 403;
            ctx.body = { message: 'Forbidden: You cannot delete this message' };
        }
    } catch (err) {
        console.error('Delete message error:', err);
        ctx.status = 500;
        ctx.body = { message: 'Internal server error' };
    }
};

// Set up routes
router.get('/', getMsg);
router.post('/', sendMessage);
router.delete('/', deleteMsg);

export { router };


// import Router from 'koa-router';
// import { Context } from 'koa';

// import bodyParser from 'koa-bodyparser';


// const router = new Router({prefix: '/api/v1/message'});

// // Get a message
// const getMsg = async (ctx: Context, next: any)=> {
//    //
//     await next();
// }
// // Post a message
// const postMsg = async (ctx: Context, next: any)=> {
//     //
//      await next();
// }

// router.get('/', getMsg);
// router.post('/', bodyParser(), postMsg);

// export { router };
