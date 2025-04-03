import Router from 'koa-router';
import { Context } from 'koa';
import bodyParser from 'koa-bodyparser';
import * as db from '../helpers/dbhelpers';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

const router = new Router({ prefix: '/api/v1/favourlist' });

// Middleware to verify member using token
const verifyMember = async (ctx: Context, next: any) => {
    try {
        // Get token from the request body or query parameters
        const { token } = ctx.request.body as { token: string } || ctx.request.query;

        if (!token) {
            ctx.status = 401;
            ctx.body = { message: 'Unauthorized: Missing token' };
            return;
        }

        // Check users collection for the token
        const user = await db.find('users', { token });

        if (user.length === 0) {
            ctx.status = 403;
            ctx.body = { message: 'Forbidden: Invalid session' };
            return;
        }

        // Attach user info to ctx.state for later use
        ctx.state.user = user[0];
        await next();
    } catch (err) {
        console.error('User verification error:', err);
        ctx.status = 500;
        ctx.body = { message: 'Internal server error during verification' };
    }
};

// GET /api/v1/favourlist - Retrieve user's favourites
const getFavourites = async (ctx: Context) => {
    try {
        const userId = ctx.state.user._id;
        const favourites = await db.find('favourlist', { userId });

        ctx.status = 200;
        ctx.body = {
            message: 'Favourites retrieved successfully',
            data: favourites,
        };
    } catch (err) {
        console.error('Get favourites error:', err);
        ctx.status = 500;
        ctx.body = { message: 'Internal server error' };
    }
};

// Verify token middleware
const verifyToken = async (ctx: Context, next: any) => {
    try {
        const body = ctx.request.body as any;
        const token = body.token;

        if (!token) {
            ctx.status = 401;
            ctx.body = { message: 'Unauthorized: Token missing' };
            return;
        }

        // Find user with matching token
        const users = await db.find('users', { token });
        if (users.length === 0) {
            ctx.status = 403;
            ctx.body = { message: 'Forbidden: Invalid session' };
            return;
        }

        // Store user info in context state
        ctx.state.user = users[0];
        await next();
    } catch (err) {
        console.error('Token verification error:', err);
        ctx.status = 500;
        ctx.body = { message: 'Internal server error' };
    }
};

// Add to Favourites
const addMember = async (ctx: Context) => {
    try {
        const body = ctx.request.body as any;
        const hotelId = body.hotelId;
        const userId = ctx.state.user._id;

        if (!hotelId) {
            ctx.status = 400;
            ctx.body = { message: 'Hotel ID is required' };
            return;
        }

        // Check if hotel exists
        const hotels = await db.find('hotels', { _id: new mongoose.Types.ObjectId(hotelId) });
        if (hotels.length === 0) {
            ctx.status = 404;
            ctx.body = { message: 'Hotel not found' };
            return;
        }

        // Check if already in favorites
        const existingFav = await db.find('favourlist', { 
            userId: userId,
            hotelId: new mongoose.Types.ObjectId(hotelId)
        });

        if (existingFav.length > 0) {
            ctx.status = 409;
            ctx.body = { message: 'Hotel already in favorites' };
            return;
        }

        // Add to favorites
        const result = await db.add('favourlist', {
            userId: userId,
            hotelId: new mongoose.Types.ObjectId(hotelId),
            createdAt: new Date()
        });

        if (result.acknowledged) {
            ctx.status = 201;
            ctx.body = { 
                message: 'Hotel added to favorites',
                id: result.insertedId
            };
        } else {
            ctx.status = 500;
            ctx.body = { message: 'Failed to add to favorites' };
        }
    } catch (err) {
        console.error('Add to favorites error:', err);
        ctx.status = 500;
        ctx.body = { message: 'Internal server error' };
    }
};

// DELETE /api/v1/favourlist - Remove a favourite using hotelId
const removeFavourite = async (ctx: Context) => {
    try {
        const { hotelId } = ctx.request.body as { hotelId: string };
        const userId = ctx.state.user._id;

        if (!hotelId) {
            ctx.status = 400;
            ctx.body = { message: 'hotelId is required' };
            return;
        }

        // Verify that the favourite exists for the user
        const favourite = await db.find('favourlist', { 
            userId,
            hotelId: new mongoose.Types.ObjectId(hotelId)
        });

        if (favourite.length === 0) {
            ctx.status = 404;
            ctx.body = { message: 'Favourite not found' };
            return;
        }

        // Remove the favourite using its _id
        const result = await db.remove('favourlist', { _id: favourite[0]._id });

        if (result.acknowledged) {
            ctx.status = 200;
            ctx.body = {
                message: 'Favourite removed successfully',
            };
        } else {
            ctx.status = 500;
            ctx.body = { message: 'Failed to remove favourite' };
        }
    } catch (err) {
        console.error('Remove favourite error:', err);
        ctx.status = 500;
        ctx.body = { message: 'Internal server error' };
    }
};

// Delete a favourite
const deleteFavourite = async (ctx: Context) => {
    try {
        const { id } = ctx.request.body as { id: string };
        const userId = ctx.state.user._id;
        
        if (!id) {
            ctx.status = 400;
            ctx.body = { msg: 'Favourite ID is required' };
            return;
        }

        // Find the favourite first and verify ownership
        const favourite = await db.find('favourlist', { 
            _id: new ObjectId(id),
            userId: userId
        });

        if (favourite.length === 0) {
            ctx.status = 404;
            ctx.body = { msg: 'Favourite not found' };
            return;
        }

        // Delete the favourite
        const result = await db.remove('favourlist', { _id: new ObjectId(id) });

        if (result.acknowledged) {
            ctx.status = 200;
            ctx.body = { msg: 'Favourite deleted successfully' };
        } else {
            ctx.status = 500;
            ctx.body = { msg: 'Failed to delete favourite' };
        }
    } catch (err) {
        console.error('Delete favourite error:', err);
        ctx.status = 500;
        ctx.body = { msg: 'Internal server error' };
    }
};

// Protect these routes with the verifyMember middleware
router.get('/', bodyParser(), verifyMember, getFavourites);
router.post('/', bodyParser(), verifyMember, addMember);
router.delete('/', bodyParser(), verifyMember, removeFavourite);

export { router };

// import Router from 'koa-router';
// import { Context } from 'koa';
// import bodyParser from 'koa-bodyparser';


// const router = new Router({prefix: '/api/v1/favourlist'});

// // Favour List
// const favList = async (ctx: Context, next: any)=> {
//    //
//     await next();
// }
// // New Favour Add
// const addFav = async (ctx: Context, next: any)=> {
//     //
//      await next();
//  }

// // Remove Favour 
// const removeFav = async (ctx: Context, next: any)=> {
//     //
//      await next();
//  }

// router.get('/', favList);
// router.post('/', bodyParser(), addFav);
// router.delete('/', removeFav);

// export { router };
