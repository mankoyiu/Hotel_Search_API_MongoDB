import Router from 'koa-router';
import { Context, Request } from 'koa';
import bodyParser from 'koa-bodyparser';
import * as db from '../helpers/dbhelpers';
import { ObjectId } from 'mongodb';

type RouterContext = Context & {
    request: Request & { body?: any };
};

const router = new Router({ prefix: '/api/v1/hotel' });

// Add a new hotel
const addHotel = async (ctx: RouterContext) => {
    try {
        const body = ctx.request.body;
        console.log('Request body:', body); // Debug log
        
        // 1. Verify the token exists in the users collection
        const users = await db.find('users', { token: body.token });
        console.log('Found users:', users); // Debug log
        if (users.length === 0) {
            ctx.status = 401;
            ctx.body = { msg: 'Invalid token: Unauthorized' };
            return;
        }

        // 2. Extract hotel data (handle both direct and nested formats)
        let hotelData = body.hotel || body;
        console.log('Extracted hotel data:', hotelData); // Debug log
        
        // 3. Validate hotel data
        if (!hotelData || typeof hotelData !== 'object' || Object.keys(hotelData).length === 0) {
            ctx.status = 400;
            ctx.body = { msg: 'Hotel data is required' };
            return;
        }

        // 4. Remove token from hotel data if it exists
        const { token, ...cleanHotelData } = hotelData;

        // 5. Add timestamps and agencyId
        const finalHotelData = {
            ...cleanHotelData,
            createdAt: new Date(),
            updatedAt: new Date(),
            agencyId: users[0].username  // Add agencyId from the authenticated user
        };
        console.log('Final hotel data:', finalHotelData); // Debug log

        // 6. Insert the hotel data
        const result = await db.add('hotels', finalHotelData);
        console.log('Insert result:', result); // Debug log
        
        if (result?.acknowledged) {
            const insertedHotel = await db.findById('hotels', result.insertedId.toString());
            ctx.status = 201;
            ctx.body = { 
                msg: 'Hotel added successfully',
                hotel: insertedHotel
            };
        } else {
            ctx.status = 500;
            ctx.body = { msg: 'Failed to insert hotel' };
        }
    } catch (err) {
        console.error('Add Hotel Error:', err);
        ctx.status = 500;
        ctx.body = { msg: 'Internal Server Error' };
    }
};

// Get ALL Hotels
const getAllHotels = async (ctx: RouterContext) => {
    try {
        const hotels = await db.find('hotels', {});
        console.log('Found hotels:', hotels); // Debug log
        ctx.body = hotels;
    } catch (err) {
        console.error('Get All Hotels Error:', err);
        ctx.status = 500;
        ctx.body = { 
            msg: 'Internal Server Error'
        };
    }
};

// Get ONE Hotel - Fixed version
const getHotel = async (ctx: RouterContext) => {
    try {
        const { id } = ctx.params;
        console.log('Hotel ID:', id); // Debug log
        
        // Convert string ID to MongoDB ObjectId
        const hotel = await db.findById('hotels', id);
        console.log('Found hotel:', hotel); // Debug log
        
        if (hotel) {
            ctx.body = hotel;
        } else {
            ctx.status = 404;
            ctx.body = { msg: 'Hotel not found' };
        }
    } catch (err) {
        console.error('Get Hotel Error:', err);
        ctx.status = 400;
        ctx.body = { 
            msg: 'Invalid hotel ID format'
        };
    }
};

// Register routes with bodyParser middleware
router.get('/', getAllHotels);
router.get('/:id', getHotel); // Route for getting a specific hotel by ID
router.post('/', bodyParser({
    enableTypes: ['json'],
    strict: true,
    onerror: function (err, ctx) {
        console.error('Body parser error:', err);
        ctx.throw(422, 'Body parse error: Expected JSON');
    }
}), addHotel);

const updateHotel = async (ctx: RouterContext) => {
    try {
        const { id } = ctx.params;
        const body = ctx.request.body;
        
        // 1. Verify the token exists in the users collection
        const users = await db.find('users', { token: body.token });
        if (users.length === 0) {
            ctx.status = 401;
            ctx.body = { msg: 'Invalid token: Unauthorized' };
            return;
        }

        // 2. Extract hotel data (handle both direct and nested formats)
        let hotelData = body.hotel || body;
        
        // 3. Validate update data
        if (!hotelData || typeof hotelData !== 'object' || Object.keys(hotelData).length === 0) {
            ctx.status = 400;
            ctx.body = { msg: 'Hotel update data is required' };
            return;
        }

        // 4. Remove token from hotel data if it exists
        const { token, ...cleanHotelData } = hotelData;

        // 5. Add updatedAt timestamp
        const finalHotelData = {
            ...cleanHotelData,
            updatedAt: new Date()
        };

        // 6. Perform the update with proper data structure
        const updateResult = await db.update('hotels', id, finalHotelData);
        
        if (updateResult?.matchedCount === 0) {
            ctx.status = 404;
            ctx.body = { msg: 'Hotel not found' };
        } else if (updateResult?.modifiedCount > 0) {
            const updatedHotel = await db.findById('hotels', id);
            ctx.body = { 
                msg: 'Hotel updated successfully',
                hotel: updatedHotel
            };
        } else {
            ctx.body = { 
                msg: 'No changes made to hotel',
                hotel: await db.findById('hotels', id)
            };
        }
    } catch (err) {
        console.error('Update Hotel Error:', err);
        ctx.status = 500;
        ctx.body = { msg: 'Internal Server Error' };
    }
};

const delHotel = async (ctx: RouterContext) => {
    try {
        const { id } = ctx.params;
        const body = ctx.request.body;
        console.log('Delete request body:', body); // Debug log

        // 1. Extract token (handle both direct and nested formats)
        const token = body.token || body;
        console.log('Extracted token:', token); // Debug log

        // 2. Verify the token exists in the users collection
        const users = await db.find('users', { token });
        console.log('Found users:', users); // Debug log
        if (users.length === 0) {
            ctx.status = 401;
            ctx.body = { msg: 'Invalid token: Unauthorized' };
            return;
        }

        // 3. Verify the hotel exists first
        const existingHotel = await db.findById('hotels', id);
        console.log('Existing hotel:', existingHotel); // Debug log
        if (!existingHotel) {
            ctx.status = 404;
            ctx.body = { msg: 'Hotel not found' };
            return;
        }

        // 4. Perform the deletion with proper query format
        const deleteResult = await db.remove('hotels', { _id: new ObjectId(id) });
        console.log('Delete result:', deleteResult); // Debug log
        
        if (deleteResult?.acknowledged) {
            ctx.status = 200;
            ctx.body = { 
                msg: 'Hotel deleted successfully',
                deletedHotel: existingHotel
            };
        } else {
            ctx.status = 500;
            ctx.body = { msg: 'Failed to delete hotel' };
        }
    } catch (err: any) {
        console.error('Delete Hotel Error:', err);
        console.error('Error stack:', err.stack); // Debug log
        ctx.status = 500;
        ctx.body = { 
            msg: 'Internal Server Error',
            error: err.message
        };
    }
};

router.put('/:id', bodyParser(), updateHotel); // Route for updating a specific hotel by ID
router.delete('/:id', bodyParser(), delHotel); // Route for deleting a specific hotel by ID

export { router };