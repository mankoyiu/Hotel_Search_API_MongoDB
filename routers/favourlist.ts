import Router from 'koa-router';
import { Context } from 'koa';
import bodyParser from 'koa-bodyparser';
import * as db from '../helpers/dbhelpers';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { basicAuth } from '../controllers/basicauth';

const router = new Router({ prefix: '/api/v1/favourlist' });

// GET /api/v1/favourlist - Retrieve user's favourites
const getFavourites = async (ctx: Context) => {
    try {
        if (!ctx.state.user?.username) {
            ctx.status = 401;
            ctx.body = { message: 'Unauthorized: Not authenticated' };
            return;
        }

        // Find user's ID from users collection
        const [user] = await db.find('users', { username: ctx.state.user.username });
        if (!user) {
            ctx.status = 404;
            ctx.body = { message: 'User not found' };
            return;
        }

        const favourites = await db.find('favourlist', { userId: user._id });

        // Fetch hotel details for each favorite
        const favouriteHotels = await Promise.all(
            favourites.map(async (fav) => {
                const [hotel] = await db.find('hotels', { _id: fav.hotelId });
                return hotel;
            })
        );

        // Filter out any null values (in case a hotel was deleted)
        const validHotels = favouriteHotels.filter(hotel => hotel);

        ctx.status = 200;
        ctx.body = {
            message: 'Favourites retrieved successfully',
            data: validHotels,
        };
    } catch (err) {
        console.error('Get favourites error:', err);
        ctx.status = 500;
        ctx.body = { message: 'Internal server error' };
    }
};

// Add to Favourites
const addFavourite = async (ctx: Context) => {
    try {
        if (!ctx.state.user?.username) {
            ctx.status = 401;
            ctx.body = { message: 'Unauthorized: Not authenticated' };
            return;
        }

        const body = ctx.request.body as any;
        const hotelId = body.hotelId;

        // Find user's ID from users collection
        const [user] = await db.find('users', { username: ctx.state.user.username });
        if (!user) {
            ctx.status = 404;
            ctx.body = { message: 'User not found' };
            return;
        }

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
            userId: user._id,
            hotelId: new mongoose.Types.ObjectId(hotelId)
        });

        if (existingFav.length > 0) {
            ctx.status = 409;
            ctx.body = { message: 'Hotel already in favorites' };
            return;
        }

        // Add to favorites
        const result = await db.add('favourlist', {
            userId: user._id,
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

// Remove a favourite
const removeFavourite = async (ctx: Context) => {
    try {
        if (!ctx.state.user?.username) {
            ctx.status = 401;
            ctx.body = { message: 'Unauthorized: Not authenticated' };
            return;
        }

        const { hotelId } = ctx.request.body as { hotelId: string };

        // Find user's ID from users collection
        const [user] = await db.find('users', { username: ctx.state.user.username });
        if (!user) {
            ctx.status = 404;
            ctx.body = { message: 'User not found' };
            return;
        }

        if (!hotelId) {
            ctx.status = 400;
            ctx.body = { message: 'hotelId is required' };
            return;
        }

        // Verify that the favourite exists for the user
        const favourite = await db.find('favourlist', { 
            userId: user._id,
            hotelId: new mongoose.Types.ObjectId(hotelId)
        });

        if (favourite.length === 0) {
            ctx.status = 404;
            ctx.body = { message: 'Favourite not found' };
            return;
        }

        // Remove the favourite
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

// Protect these routes with Basic Auth
router.get('/', bodyParser(), basicAuth, getFavourites);
router.post('/', bodyParser(), basicAuth, addFavourite);
router.delete('/', bodyParser(), basicAuth, removeFavourite);

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
