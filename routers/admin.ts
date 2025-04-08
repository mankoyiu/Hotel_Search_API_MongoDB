import Router from 'koa-router';
import { Context } from 'koa';
import bodyParser from 'koa-bodyparser';
import * as db from '../helpers/dbhelpers';
import { basicAuth } from '../controllers/basicauth';
import { User } from '../models/user';

const router = new Router();

// Apply basicAuth middleware for all routes
router.use(basicAuth);

// Middleware to verify admin role
const verifyAdmin = async (ctx: Context, next: any) => {
  try {
    if (!ctx.state.user?.username) {
      ctx.status = 401;
      ctx.body = { message: 'Unauthorized: Not authenticated' };
      return;
    }

    // Find user in database
    const [user] = await db.find('users', { username: ctx.state.user.username });
    console.log('Verifying admin access for user:', user);
    
    if (!user || user.role !== 0) {
      ctx.status = 403;
      ctx.body = { message: 'Forbidden: Admin access required' };
      return;
    }

    await next();
  } catch (err) {
    console.error('Admin verification error:', err);
    ctx.status = 500;
    ctx.body = { message: 'Internal server error during admin verification' };
  }
};

// Middleware to verify admin or self access
const verifyAdminOrSelf = async (ctx: Context, next: any) => {
  try {
    if (!ctx.state.user?.username) {
      ctx.status = 401;
      ctx.body = { message: 'Unauthorized: Not authenticated' };
      return;
    }

    // Find user in database
    const [user] = await db.find('users', { username: ctx.state.user.username });
    
    if (!user) {
      ctx.status = 404;
      ctx.body = { message: 'User not found' };
      return;
    }

    // Allow access if user is admin (role 0) or accessing their own data
    const targetUsername = ctx.params.username;
    if (user.role !== 0 && user.username !== targetUsername) {
      ctx.status = 403;
      ctx.body = { message: 'Forbidden: Can only modify your own account unless admin' };
      return;
    }

    await next();
  } catch (err) {
    console.error('Admin/self verification error:', err);
    ctx.status = 500;
    ctx.body = { message: 'Internal server error during verification' };
  }
};

// Get all users (admin only)
const getUsers = async (ctx: Context) => {
  try {
    console.log('GET /users - Fetching all users...');
    const users = await db.find('users', {});
    console.log('Found users:', users);
    ctx.body = users;
  } catch (err) {
    console.error('Get users error:', err);
    ctx.status = 500;
    ctx.body = { message: 'Failed to fetch users' };
  }
};

// Create new user (admin only)
const createUser = async (ctx: Context) => {
  try {
    const userData = ctx.request.body as User;
    console.log('Creating new user:', userData);

    // Validate required fields
    if (!userData.username || !userData.password || !userData.email || !userData.role) {
      ctx.status = 400;
      ctx.body = { message: 'Missing required fields' };
      return;
    }

    // Check if username exists
    const existingUser = await db.find('users', { username: userData.username });
    if (existingUser.length > 0) {
      ctx.status = 409;
      ctx.body = { message: 'Username already exists' };
      return;
    }

    // Add user to database
    const result = await db.add('users', {
      ...userData,
      status: true
    });

    console.log('User creation result:', result);

    if (result.acknowledged) {
      ctx.status = 201;
      ctx.body = { message: 'User created successfully', id: result.insertedId };
    } else {
      ctx.status = 500;
      ctx.body = { message: 'Failed to create user' };
    }
  } catch (err) {
    console.error('Create user error:', err);
    ctx.status = 500;
    ctx.body = { message: 'Internal server error' };
  }
};

// Update user (admin or self for agencies)
const updateUser = async (ctx: Context) => {
  try {
    const { username } = ctx.params;
    const updates = ctx.request.body as Partial<User>;
    console.log('Updating user:', username, 'with data:', updates);

    // Don't allow updating username
    delete updates.username;

    // Get the target user
    const [targetUser] = await db.find('users', { username });
    if (!targetUser) {
      ctx.status = 404;
      ctx.body = { message: 'User not found' };
      return;
    }

    // Get the requesting user
    const [requestingUser] = await db.find('users', { username: ctx.state.user.username });

    // If not admin, only allow updating non-critical fields
    if (requestingUser.role !== 0) {
      const filteredUpdates: Partial<User> = {};
      
      // Only copy allowed fields
      if (updates.email) filteredUpdates.email = updates.email;
      if (updates.phone) filteredUpdates.phone = updates.phone;
      if (updates.name) filteredUpdates.name = updates.name;
      if (updates.password) filteredUpdates.password = updates.password;
      
      // Replace updates with filtered version
      Object.keys(updates).forEach(key => delete updates[key as keyof User]);
      Object.assign(updates, filteredUpdates);
    }

    // Update user in database
    const result = await db.update('users', { username }, updates);
    console.log('Update result:', result);

    if (result.modifiedCount > 0) {
      ctx.status = 200;
      ctx.body = { message: 'User updated successfully' };
    } else {
      ctx.status = 404;
      ctx.body = { message: 'User not found or no changes made' };
    }
  } catch (err) {
    console.error('Update user error:', err);
    ctx.status = 500;
    ctx.body = { message: 'Internal server error' };
  }
};

// Delete user (admin or self for agencies)
const deleteUser = async (ctx: Context) => {
  try {
    const { username } = ctx.params;
    console.log('Attempting to delete user:', username);

    // Get the target user
    const [targetUser] = await db.find('users', { username });
    if (!targetUser) {
      ctx.status = 404;
      ctx.body = { message: 'User not found' };
      return;
    }

    // Don't allow deleting admin users
    if (targetUser.role === 0) {
      ctx.status = 403;
      ctx.body = { message: 'Cannot delete admin users' };
      return;
    }

    const result = await db.remove('users', { username });
    console.log('Delete result:', result);

    if (result.deletedCount > 0) {
      ctx.status = 200;
      ctx.body = { message: 'User deleted successfully' };
    } else {
      ctx.status = 404;
      ctx.body = { message: 'User not found' };
    }
  } catch (err) {
    console.error('Delete user error:', err);
    ctx.status = 500;
    ctx.body = { message: 'Internal server error' };
  }
};

// Register routes with logging
router.get('/admin/users', verifyAdmin, getUsers);
router.post('/admin/users', verifyAdmin, createUser);
router.put('/admin/users/:username', verifyAdminOrSelf, updateUser);
router.delete('/admin/users/:username', verifyAdminOrSelf, deleteUser);

export { router }; 