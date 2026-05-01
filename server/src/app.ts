import express, { Application } from 'express';
import expressLoader from './loaders/express';
import routesLoader from './loaders/routes';
import { globalErrorHandler } from './shared/middlewares/error.middleware';

const app: Application = express();

expressLoader(app);
routesLoader(app);

app.use(globalErrorHandler);

export default app;
