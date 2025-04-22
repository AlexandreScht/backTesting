import logsConfig from '@/config/logs';
import dbInstance from '@/database/pg';
import { type WebSocket } from '@/interfaces/websocket';
// import socket from '@/libs/socket';
import env from '@config';
import { ErrorMiddleware } from '@middlewares/error';
import ApiRouter from '@routes/index';
import { logger, stream } from '@utils/logger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import http from 'http';
import morgan from 'morgan';
import 'reflect-metadata';
import { Server } from 'socket.io';
const { COOKIE_SECRET, ORIGIN, NODE_ENV, PORT } = env;

const { format } = logsConfig;

export default class App extends ApiRouter {
  public app: express.Application;
  public env: string;
  public port: string | number;
  private server: http.Server;
  private io: WebSocket.wslServer;

  constructor() {
    super();
    this.app = express();
    this.env = NODE_ENV || 'development';
    this.port = PORT || 3005;
    this.server = http.createServer(this.app);
    this.io = new Server(this.server);
  }

  public async initialize() {
    await this.connectToDatabase();
    this.initializeStoredLibs();
    this.initializeMiddlewares();
    this.initializeAppRoutes();
    this.initializeErrorHandling();
    this.defaultError();
  }

  public listen() {
    this.server.listen(this.port, () => {
      logger.info(`======= Version: ${this.env} =======
          🚀 server listening port: ${this.port} 🚀`);
    });
    return this.server;
  }

  private async connectToDatabase() {
    await dbInstance.dbConnection();
  }

  private initializeMiddlewares() {
    this.app.use(morgan(format, { stream }));

    this.app.use(
      cors({
        origin: ORIGIN,
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: 'Content-Type,Authorization,Signature,x-Tag',
      }),
    );
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.initializeBodyContent();
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser(COOKIE_SECRET));
    this.app.options(
      '*',
      cors({
        origin: ORIGIN,
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: 'Content-Type,Authorization,Signature,x-Tag',
      }),
    );
  }

  private initializeBodyContent() {
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.url === '/api/stripe_webhook') {
        express.raw({ type: 'application/json' })(req, res, next);
      } else {
        express.json()(req, res, next);
      }
    });
  }

  private initializeStoredLibs() {
    // MemoryServerCache;
    // socket.getInstance(this.io);
  }

  private initializeAppRoutes() {
    super.initializeRoutes();
    this.app.use('/api', this.router);
  }

  private initializeErrorHandling() {
    this.app.use(ErrorMiddleware);
  }

  private defaultError() {
    this.app.use((req: Request, res: Response) => {
      res
        .status(404)
        .setHeader('Content-Type', 'application/json; charset=utf-8')
        .send({ error: `Cannot find or << ${req.method} >> is incorrect method at ${req.url}` });
    });
  }
}
