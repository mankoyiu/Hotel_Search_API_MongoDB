import { Context } from 'koa';
import * as db from '../helpers/dbhelpers';


export const basicAuth = async (ctx: Context, next: any) => {
    try {
        console.log('Basic auth middleware called');
        const authHeader = ctx.headers.authorization;
        console.log('Auth header:', authHeader);
        
        if (!authHeader || !authHeader.startsWith('Basic ')) {
            console.log('Missing or invalid auth header');
            ctx.status = 401;
            ctx.set('WWW-Authenticate', 'Basic realm="Secure Area"');
            ctx.body = { msg: 'Authorization header missing or invalid' };
            return;
        }

        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');
        console.log('Attempting authentication for username:', username);
        
        if (!username || !password) {
            console.log('Missing username or password');
            ctx.status = 401;
            ctx.body = { msg: 'Missing username or password' };
            return;
        }

        // Find user in database
        console.log('Looking for user in database...');
        const [user] = await db.find('users', { username });
        console.log('User found:', user);
        
        if (!user) {
            console.log('User not found in database');
            ctx.status = 401;
            ctx.body = { msg: 'User not found' };
            return;
        }

        // Verify password (plaintext comparison - not recommended for production)
        // In production, use hashed password comparison
        console.log('Verifying password...');
        if (user.password !== password) {
            console.log('Invalid password');
            ctx.status = 401;
            ctx.body = { msg: 'Invalid password' };
            return;
        }

        // Attach complete user info to context
        console.log('Authentication successful, attaching user info:', {
            username: user.username,
            role: user.role
        });
        ctx.state.user = {
            username: user.username,
            role: user.role  // This is critical for role verification
        };

        await next();
    } catch (err) {
        console.error('Authentication error:', err);
        ctx.status = 500;
        ctx.body = { msg: 'Internal server error during authentication' };
    }
};
// import { Context } from 'koa'; // Import Context from 'koa'
// import { sampleAgency } from '../models/agency';
// import * as db from '../helpers/dbhelpers'; // Your database helper functions

// export const basicAuth = async (ctx: Context, next: any) => {
//     const authHeader = ctx.request.headers.authorization;
//     if(!authHeader || !authHeader.startsWith('Basic ')) {
//         ctx.status = 401;
//         ctx.headers['www-authenticate'] = 'Basic realm="Secure Area';
//         ctx.body = { msg: 'Authorization required'};
//     } else {
//         const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
//         const [username, password] = auth.split(':');
//         console.log(`${username} is trying to access`);
//         if(await validationCredentials(username, password)){
//             ctx.state.user = {username}
//         } else {
//             ctx.status = 401;
//             ctx.body = { msg: 'Authorization failed'};
//         }
//     }
//     await next();
// }

// const validationCredentials = async (u: string, p: string): Promise<boolean> => {
//     let result = false;
//     //1. Check if user exist;
//     const user = await db.find('users', {username: u});

//     //2. Check if password match
//     sampleAgency.forEach((user) => {
//         if(user.username=== u && user.password === p) result = true;
//     })
//     return result;
// }