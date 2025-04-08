import Router from 'koa-router';
import { Context } from 'koa';
import * as db from '../helpers/dbhelpers';

const router = new Router({ prefix: '/api/v1/user' });

// Get all users
const getAllUsers = async (ctx: Context) => {
    try {
        console.log('Attempting to fetch all users...');
        const users = await db.find('users', {});
        console.log(`Successfully fetched ${users.length} users`);
        
        // Remove sensitive information before sending
        const sanitizedUsers = users.map(user => {
            const { password, token, ...sanitizedUser } = user;
            return sanitizedUser;
        });
        
        ctx.status = 200;
        ctx.body = {
            success: true,
            count: sanitizedUsers.length,
            users: sanitizedUsers
        };
    } catch (err) {
        console.error('Get All Users Error:', err);
        ctx.status = 500;
        ctx.body = { 
            success: false,
            msg: 'Internal Server Error',
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
};

// Register routes
router.get('/', getAllUsers);

export { router }; 