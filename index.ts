import koa from 'koa';
import logger from 'koa-logger';
import json from 'koa-json';
import { router as hotels } from './routers/hotels';
import { router as agency } from './routers/agency';
import { router as favList } from './routers/favourlist';
import { router as msg } from './routers/message';
import { router as members } from './routers/members';

const app = new koa();

app.use(json());
app.use(logger());
app.use(hotels.routes());
app.use(agency.routes());
app.use(favList.routes())
app.use(msg.routes());
app.use(members.routes());

app.listen(10888, ()=> {
    console.log('Wanderlust Travel API started');
});