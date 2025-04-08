import Router from 'koa-router';
import { Context } from 'koa';
import multer from 'koa-multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { User } from '../models/user';
import { basicAuth } from '../controllers/basicauth';
import * as db from '../helpers/dbhelpers';
import koaBody from 'koa-body';
import { GridFSBucket } from 'mongodb';

const API_URL = 'http://localhost:10888/api/v1/agency';
const router = new Router({ prefix: '/api/v1/agency' });

// Use basicAuth middleware for all routes
router.use(basicAuth);

// Multer Configuration
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    console.log('Multer file filter:', file);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'), false);
    }
  }
});

// Verify Admin Middleware
const verifyAdmin = async (ctx: Context, next: () => Promise<void>) => {
  if (!ctx.state.user || !ctx.state.user.username) {
    ctx.status = 401;
    ctx.body = { msg: 'Unauthorized: Please login first' };
    return;
  }

  const user = await db.find('users', { username: ctx.state.user.username });
  if (user.length === 0 || user[0].role !== 0) {
    ctx.status = 403;
    ctx.body = { msg: 'Forbidden: Admin privileges required' };
    return;
  }

  await next();
};

// Upload Profile Photo
const uploadProfilePhoto = async (ctx: Context) => {
    try {
        console.log('Upload request received');
        console.log('Request file:', (ctx.req as any).file);
        
        if (!(ctx.req as any).file) {
            console.log('No file in request');
            ctx.status = 400;
            ctx.body = { msg: 'No file uploaded' };
            return;
        }

        if (!ctx.state.user?.username) {
            console.log('No authenticated user');
            ctx.status = 401;
            ctx.body = { msg: 'Not authenticated' };
            return;
        }

        const file = (ctx.req as any).file;
        console.log('File details:', {
            originalname: file.originalname,
            filename: file.originalname, // Use original filename
            mimetype: file.mimetype,
            size: file.size,
            bufferLength: file.buffer ? file.buffer.length : 0
        });

        if (!file.buffer || file.buffer.length === 0) {
            console.log('Invalid file buffer');
            ctx.status = 400;
            ctx.body = { msg: 'Invalid file data' };
            return;
        }

        const bucket = new mongoose.mongo.GridFSBucket(db.getDb(), {
            bucketName: 'agencyPhotos'
        });

        const fileId = new mongoose.Types.ObjectId();
        console.log('Creating upload stream with ID:', fileId);

        const uploadStream = bucket.openUploadStreamWithId(
            fileId,
            file.originalname,
            {
                contentType: file.mimetype,
                metadata: {
                    uploadedBy: ctx.state.user.username,
                    uploadDate: new Date()
                }
            }
        );

        // Write the buffer to the upload stream
        uploadStream.write(file.buffer);
        uploadStream.end();

        await new Promise((resolve, reject) => {
            uploadStream.on('finish', () => {
                console.log('Upload finished successfully');
                resolve(null);
            });
            uploadStream.on('error', (err) => {
                console.error('Upload error:', err);
                reject(err);
            });
        });

        // Verify the file was uploaded correctly
        const files = await bucket.find({ _id: fileId }).toArray();
        console.log('Verification - Files found:', files.length);
        if (files.length === 0 || files[0].length === 0) {
            console.log('File verification failed');
            ctx.status = 500;
            ctx.body = { msg: 'File upload verification failed' };
            return;
        }

        const result = await db.update(
            'users', 
            { username: ctx.state.user.username }, 
            { profilePhoto: fileId }
        );

        if (result.modifiedCount > 0) {
            console.log('User profile updated successfully');
            ctx.status = 200;
            ctx.body = { 
                msg: 'Profile photo uploaded successfully',
                fileId: fileId,
                filename: file.originalname,
                size: file.buffer.length
            };
        } else {
            console.log('Failed to update user profile');
            ctx.status = 500;
            ctx.body = { msg: 'Failed to update user profile' };
        }
    } catch (err) {
        console.error('Upload error:', err);
        ctx.status = 500;
        ctx.body = { msg: 'Internal server error' };
    }
};

// Helper function to ensure a property exists
const requireProperty = <T>(data: T | undefined, propertyName: string): T => {
    if (data === undefined) {
        throw new Error(`Missing required property: ${propertyName}`);
    }
    return data;
};

const optionalProperty = <T>(data: T | undefined): T | undefined => {
    return data === undefined ? undefined : data;
};

// Agency Login
const authAgency = async (ctx: Context) => {
    try {
        if (!ctx.state.user?.username) {
            ctx.status = 401;
            ctx.body = { msg: 'Not authenticated' };
            return;
        }

        // Check if the user is an agency
        const [user] = await db.find('users', { username: ctx.state.user.username });
        if (!user || user.role !== 1) {
            ctx.status = 403;
            ctx.body = { msg: 'Forbidden: Agency access only' };
            return;
        }

        ctx.status = 200;
        ctx.body = {
            username: ctx.state.user.username,
            role: ctx.state.user.role
        };
    } catch (err) {
        console.error('Agency auth error:', err);
        ctx.status = 500;
        ctx.body = { msg: 'Authentication failed' };
    }
};

// New Agency (Admin only)
const newAgency = async (ctx: Context) => {
    try {
        const body = ctx.request.body as Partial<User>;
        
        const agency: User = {
            username: requireProperty(body.username, 'username'),
            password: requireProperty(body.password, 'password'),
            email: requireProperty(body.email, 'email'),
            phone: requireProperty(body.phone, 'phone'),
            name: {
                firstname: requireProperty(body.name?.firstname, 'name.firstname'),
                lastname: requireProperty(body.name?.lastname, 'name.lastname'),
                middlename: optionalProperty(body.name?.middlename),
                nickname: requireProperty(body.name?.nickname, 'name.nickname')
            },
            status: true,
            role: 1 // Agency role
        };

        const existingUser = await db.find('users', { username: agency.username });
        if (existingUser.length > 0) {
            ctx.status = 409;
            ctx.body = { msg: 'Username already exists' };
            return;
        }

        const result = await db.add('users', agency);
        if (result.acknowledged) {
            ctx.status = 201;
            ctx.body = { msg: 'New agency added', id: result.insertedId };
        } else {
            ctx.status = 500;
            ctx.body = { msg: 'Failed to create agency' };
        }
    } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = { msg: 'Server error creating agency' };
    }
};

// Update Agency (Admin or self)
const updateAgency = async (ctx: Context) => {
    try {
        const body = ctx.request.body as Partial<User> & { username: string };
        const requestingUser = ctx.state.user;
        
        const user = await db.find('users', { username: requestingUser.username });
        if (user.length === 0 || (user[0].role !== 0 && user[0].username !== body.username)) {
            ctx.status = 403;
            ctx.body = { msg: 'Not authorized to update this account' };
            return;
        }

        const updates = {
            ...(optionalProperty(body.password) && { password: body.password }),
            ...(optionalProperty(body.email) && { email: body.email }),
            ...(optionalProperty(body.phone) && { phone: body.phone }),
            name: {
                firstname: optionalProperty(body.name?.firstname) || user[0].name.firstname,
                lastname: optionalProperty(body.name?.lastname) || user[0].name.lastname,
                nickname: optionalProperty(body.name?.nickname) || user[0].name.nickname
            }
        };

        const result = await db.update('users', { username: body.username }, updates);
        if (result.modifiedCount > 0) {
            ctx.status = 200;
            ctx.body = { msg: 'Agency updated successfully' };
        } else {
            ctx.status = 404;
            ctx.body = { msg: 'No changes made or agency not found' };
        }
    } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = { msg: 'Server error updating agency' };
    }
};

function bodyParser() {
    return koaBody({
        multipart: true,
        urlencoded: true,
        json: true
    });
}

// Routes
router.post('/', bodyParser(), verifyAdmin, newAgency);
router.put('/', bodyParser(), verifyAdmin, updateAgency);
router.post('/upload-photo', upload.single('file'), uploadProfilePhoto);

router.get('/auth', authAgency);

// Get all photos for the authenticated agency - this must come before /:username
router.get('/photos', async (ctx: Context) => {
    try {
        if (!ctx.state.user?.username) {
            ctx.status = 401;
            ctx.body = { msg: 'Not authenticated' };
            return;
        }

        const bucket = new mongoose.mongo.GridFSBucket(db.getDb(), {
            bucketName: 'profilePhotos'
        });

        const files = await bucket.find({ 'metadata.uploadedBy': ctx.state.user.username }).toArray();
        
        const photos = files.map(file => ({
            _id: file._id.toString(),
            filename: file.filename,
            uploadDate: file.uploadDate,
            url: `${API_URL}/photos/${file._id}`
        }));

        ctx.body = photos;
    } catch (err) {
        console.error('Error fetching photos:', err);
        ctx.status = 500;
        ctx.body = { msg: 'Failed to fetch photos' };
    }
});

// Get a specific photo by ID
router.get('/photos/:id', async (ctx: Context) => {
    try {
        const photoId = ctx.params.id;
        const bucket = new mongoose.mongo.GridFSBucket(db.getDb(), {
            bucketName: 'agencyPhotos'
        });

        const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(photoId));
        
        // Set appropriate headers
        ctx.set('Content-Type', 'image/jpeg');
        ctx.set('Cache-Control', 'public, max-age=31536000');
        
        // Stream the file
        ctx.body = downloadStream;
    } catch (err) {
        console.error('Error serving photo:', err);
        ctx.status = 404;
        ctx.body = { msg: 'Photo not found' };
    }
});

// Get user's profile photo by username (this should be last as it's a catch-all route)
router.get('/:username', async (ctx: Context) => {
    try {
        console.log('Fetching photo for username:', ctx.params.username);
        
        // Find the user
        const [user] = await db.find('users', { username: ctx.params.username });
        console.log('User found:', user ? 'Yes' : 'No');
        
        if (!user || !user.profilePhoto) {
            console.log('No user or profile photo found');
            ctx.status = 404;
            ctx.body = { msg: 'User or profile photo not found' };
            return;
        }

        console.log('Profile photo ID:', user.profilePhoto);

        // Setup GridFS bucket
        const bucket = new mongoose.mongo.GridFSBucket(db.getDb(), {
            bucketName: 'profilePhotos'
        });

        // Find the file metadata
        const cursor = bucket.find({ _id: new mongoose.Types.ObjectId(user.profilePhoto) });
        const files = await cursor.toArray();
        console.log('Files found:', files.length);
        
        if (files.length === 0) {
            console.log('No files found in GridFS');
            ctx.status = 404;
            ctx.body = { msg: 'Photo file not found in storage' };
            return;
        }

        const file = files[0];
        console.log('File metadata:', {
            filename: file.filename,
            contentType: file.contentType,
            length: file.length
        });

        if (file.length === 0) {
            console.log('File has zero length');
            ctx.status = 500;
            ctx.body = { msg: 'Invalid file data' };
            return;
        }

        // Set proper headers
        ctx.type = file.contentType || 'image/jpeg';
        ctx.set('Content-Length', file.length.toString());
        ctx.set('Cache-Control', 'public, max-age=31536000');

        // Create a promise to handle the stream
        await new Promise((resolve, reject) => {
            const downloadStream = bucket.openDownloadStream(file._id);
            let chunks: Buffer[] = [];
            
            // Collect chunks to verify data
            downloadStream.on('data', (chunk) => {
                chunks.push(chunk);
            });

            // Handle stream errors
            downloadStream.on('error', (err) => {
                console.error('Stream error:', err);
                reject(err);
            });

            // Handle response errors
            ctx.res.on('error', (err) => {
                console.error('Response error:', err);
                reject(err);
            });

            // Pipe the stream to the response
            downloadStream.pipe(ctx.res);

            // Handle stream completion
            downloadStream.on('end', () => {
                const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
                console.log('File streamed successfully, total length:', totalLength);
                resolve(null);
            });
        });

    } catch (err) {
        console.error('Photo endpoint error:', err);
        ctx.status = 500;
        ctx.body = { msg: 'Internal server error' };
    }
});

export { router };
