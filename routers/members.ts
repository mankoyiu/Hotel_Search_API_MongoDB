import Router from 'koa-router';
import { Context } from 'koa';
import bodyParser from 'koa-bodyparser';
import { basicAuth } from '../controllers/basicauth';
import * as db from '../helpers/dbhelpers';
import multer from 'koa-multer';
import mongoose from 'mongoose';
import koaBody from 'koa-body';

const router = new Router({ prefix: '/api/v1/member' });

// Multer Configuration
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'), false);
    }
  }
});

// Helper functions
const requireProperty = <T>(data: T | undefined, propertyName: string): T => {
    if (data === undefined) {
        throw new Error(`Missing required property: ${propertyName}`);
    }
    return data;
};

const optionalProperty = <T>(data: T | undefined): T | undefined => {
    return data === undefined ? undefined : data;
};

const verifyAdmin = async (ctx: Context, next: any) => {
    try {
        // 1. Check if user is authenticated (ctx.state.user exists)
        if (!ctx.state.user || !ctx.state.user.username) {
            ctx.status = 401;
            ctx.body = { msg: 'Unauthorized: Please login first' };
            return;
        }

        // 2. Find user in users collection
        const [user] = await db.find('users', { username: ctx.state.user.username });

        // 3. Check if user exists and has admin role (0)
        if (!user || user.role !== 0) {
            ctx.status = 403;
            ctx.body = { msg: 'Forbidden: Admin privileges required' };
            return;
        }

        // 4. If checks pass, proceed to next middleware
        await next();
        
    } catch (err) {
        console.error('Admin verification error:', err);
        ctx.status = 500;
        ctx.body = { msg: 'Internal server error during admin verification' };
    }
};

// Modified authMember to handle all user roles
const authMember = async (ctx: Context, next: any) => {
    try {
        console.log('Auth member handler called');
        if (!ctx.state.user?.username) {
            ctx.status = 401;
            ctx.body = { msg: 'Not authenticated' };
            return;
        }

        console.log('Authenticated user:', ctx.state.user);

        // Find user in users collection without role restriction
        const user = await db.find('users', {
            username: ctx.state.user.username
        });

        console.log('Found user:', user);

        if (user.length === 0) {
            ctx.status = 401;
            ctx.body = { msg: 'User not found' };
            return;
        }

        // Generate token
        const token = Date.now().toString();
        console.log('Generated token:', token);
        
        const { modifiedCount } = await db.update(
            'users',
            { username: ctx.state.user.username },
            { token }
        );

        console.log('Update result:', { modifiedCount });

        if (!modifiedCount) {
            ctx.status = 500;
            ctx.body = { msg: 'Failed to generate token' };
            return;
        }

        ctx.status = 200;
        ctx.body = {
            token,
            username: ctx.state.user.username,
            role: user[0].role
        };
    } catch (err) {
        console.error('Token generation error:', err);
        ctx.status = 500;
        ctx.body = { msg: 'Login failed' };
    }
};

// New Member Registration
const addMember = async (ctx: Context, next: any) => {
    try {
        const body = ctx.request.body as any;
        const member = {
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
            role: 2  // Set role to 2 for members
        };

        // Check if username exists
        const existingUser = await db.find('users', { username: member.username });
        if (existingUser.length > 0) {
            ctx.status = 409;
            ctx.body = { msg: 'Username already exists' };
            return;
        }

        // Add to database
        const result = await db.add('users', member);
        if (result.acknowledged) {
            ctx.status = 201;
            ctx.body = { 
                msg: 'Member registered successfully',
                id: result.insertedId
            };
        } else {
            ctx.status = 500;
            ctx.body = { msg: 'Failed to register member' };
        }
    } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = { msg: 'Server error during registration' };
    }
    await next();
};

// Update Member (Admin or self)
const updateMember = async (ctx: Context) => {
    try {
        const body = ctx.request.body as any;
        const requestingUser = ctx.state.user;
        
        // Check if user is authenticated
        if (!requestingUser?.username) {
            ctx.status = 401;
            ctx.body = { msg: 'Not authenticated' };
            return;
        }

        // Get the requesting user's details to check their role
        const [user] = await db.find('users', { username: requestingUser.username });
        if (!user) {
            ctx.status = 401;
            ctx.body = { msg: 'User not found' };
            return;
        }

        // Get the target member to update
        const [targetMember] = await db.find('users', { 
            username: body.username,
            role: 2  // Ensure target is a member
        });

        if (!targetMember) {
            ctx.status = 404;
            ctx.body = { msg: 'Member not found' };
            return;
        }

        // Check permissions:
        // 1. Admin (role 0) can update any member
        // 2. Member can only update their own account
        if (user.role !== 0 && user.username !== body.username) {
            ctx.status = 403;
            ctx.body = { msg: 'Not authorized to update this account' };
            return;
        }

        const updates = {
            ...(optionalProperty(body.password) && { password: body.password }),
            ...(optionalProperty(body.email) && { email: body.email }),
            ...(optionalProperty(body.phone) && { phone: body.phone }),
            ...(body.name && {
                name: {
                    firstname: optionalProperty(body.name.firstname),
                    lastname: optionalProperty(body.name.lastname),
                    middlename: optionalProperty(body.name.middlename),
                    nickname: optionalProperty(body.name.nickname)
                }
            })
        };

        const result = await db.update('users', { username: body.username }, updates);

        if (result.modifiedCount > 0) {
            ctx.status = 200;
            ctx.body = { msg: 'Member updated successfully' };
        } else {
            ctx.status = 404;
            ctx.body = { msg: 'No changes made or member not found' };
        }
    } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = { msg: 'Server error updating member' };
    }
};

const deleteMember = async (ctx: Context) => {
    try {
        const { username } = ctx.request.body as any;
        const requestingUser = ctx.state.user;
        
        if (!username || typeof username !== 'string') {
            ctx.status = 400;
            ctx.body = { 
                msg: 'Invalid request',
                details: 'Username must be a non-empty string'
            };
            return;
        }

        // Check if user is authenticated
        if (!requestingUser?.username) {
            ctx.status = 401;
            ctx.body = { msg: 'Not authenticated' };
            return;
        }

        // Get the requesting user's details to check their role
        const [user] = await db.find('users', { username: requestingUser.username });
        if (!user) {
            ctx.status = 401;
            ctx.body = { msg: 'User not found' };
            return;
        }

        // Get the target member to delete
        const [targetMember] = await db.find('users', { 
            username: username,
            role: 2  // Ensure target is a member
        });

        if (!targetMember) {
            ctx.status = 404;
            ctx.body = { msg: 'Member not found' };
            return;
        }

        // Check permissions:
        // 1. Admin (role 0) can delete any member
        // 2. Member can only delete their own account
        if (user.role !== 0 && user.username !== username) {
            ctx.status = 403;
            ctx.body = { msg: 'Not authorized to delete this account' };
            return;
        }

        console.log(`Attempting to delete member with username: ${username}`);
        
        const result = await db.remove('users', { username, role: 2 });

        if (!result.acknowledged) {
            console.error('Database operation not acknowledged');
            ctx.status = 500;
            ctx.body = { msg: 'Database operation failed' };
            return;
        }

        if (result.deletedCount === 1) {
            console.log(`Successfully deleted member: ${username}`);
            ctx.status = 200;
            ctx.body = { 
                msg: 'Member deleted successfully',
                username: username
            };
        } else {
            console.log(`No member found with username: ${username}`);
            ctx.status = 404;
            ctx.body = { msg: 'Member not found' };
        }
    } catch (err) {
        console.error('Detailed deletion error:', err);
        ctx.status = 500;
        ctx.body = { 
            msg: 'Failed to delete member'
        };
    }
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
            filename: file.filename,
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
            bucketName: 'memberPhotos'
        });

        const fileId = new mongoose.Types.ObjectId();
        console.log('Creating upload stream with ID:', fileId);

        const uploadStream = bucket.openUploadStreamWithId(
            fileId,
            file.filename,
            {
                contentType: file.mimetype,
                metadata: {
                    uploadedBy: ctx.state.user.username,
                    uploadDate: new Date()
                }
            }
        );

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
            { username: ctx.state.user.username, role: 2 }, 
            { profilePhoto: fileId }
        );

        if (result.modifiedCount > 0) {
            console.log('Member profile updated successfully');
            ctx.status = 200;
            ctx.body = { 
                msg: 'Profile photo uploaded successfully',
                fileId: fileId,
                filename: file.filename,
                size: file.buffer.length
            };
        } else {
            console.log('Failed to update member profile');
            ctx.status = 500;
            ctx.body = { msg: 'Failed to update member profile' };
        }
    } catch (err) {
        console.error('Upload error:', err);
        ctx.status = 500;
        ctx.body = { msg: 'Internal server error' };
    }
};

// Register routes in correct order (specific routes first, then parameterized routes)
router.get('/auth', bodyParser(), basicAuth, authMember);
router.post('/upload-photo', 
    basicAuth, 
    upload.single('profilePhoto'), 
    uploadProfilePhoto
);
router.post('/', bodyParser(), addMember);
router.put('/', bodyParser(), basicAuth, updateMember);
router.delete('/', bodyParser(), basicAuth, deleteMember);

// Parameterized routes should be last
router.get('/:username', async (ctx: Context) => {
    try {
        console.log('Fetching photo for username:', ctx.params.username);
        
        // Find the member in users collection
        const [member] = await db.find('users', { 
            username: ctx.params.username,
            role: 2  // Ensure it's a member
        });
        console.log('Member found:', member ? 'Yes' : 'No');
        
        if (!member || !member.profilePhoto) {
            console.log('No member or profile photo found');
            ctx.status = 404;
            ctx.body = { msg: 'Member or profile photo not found' };
            return;
        }

        console.log('Profile photo ID:', member.profilePhoto);

        // Setup GridFS bucket
        const bucket = new mongoose.mongo.GridFSBucket(db.getDb(), {
            bucketName: 'memberPhotos'
        });

        // Find the file metadata
        const cursor = bucket.find({ _id: new mongoose.Types.ObjectId(member.profilePhoto) });
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
