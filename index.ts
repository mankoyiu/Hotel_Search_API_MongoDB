import Koa from 'koa';
import Router from 'koa-router';
import cors from '@koa/cors';
import serve from 'koa-static';
import mount from 'koa-mount';
import bodyParser from 'koa-bodyparser';
import { router as hotelRouter } from './routers/hotels';
import { router as memberRouter } from './routers/members';
import { router as agencyRouter } from './routers/agency';
import { router as messageRouter } from './routers/message';
import { router as favourlistRouter } from './routers/favourlist';
import { router as adminRouter } from './routers/admin';
import { router as userRouter } from './routers/users';

const app = new Koa();

// Add logging middleware
app.use(async (ctx, next) => {
  console.log(`${ctx.method} ${ctx.url}`);
  try {
    await next();
    console.log(`Response status: ${ctx.status}`);
  } catch (err) {
    console.error('Request error:', err);
    throw err;
  }
});

// Enable CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Add global body parser
app.use(bodyParser());

// Serve static files
app.use(mount('/uploads', serve('./uploads')));

// Register all routes directly with the app
app.use(hotelRouter.routes());
app.use(memberRouter.routes());
app.use(agencyRouter.routes());
app.use(messageRouter.routes());
app.use(favourlistRouter.routes());
app.use(adminRouter.routes());
app.use(userRouter.routes());

app.listen(10888, () => {
    console.log('Server running on port 10888');
});