import dotenv from 'dotenv';
import { cleanEnv, port, str, url } from 'envalid';
dotenv.config();

const env = cleanEnv(process.env, {
  //* Default config
  NODE_ENV: str({
    choices: ['development', 'production', 'jest'],
    default: 'development',
  }),
  ORIGIN: url({ default: 'http://localhost:3000' }),
  PORT: port({ default: 3005 }),
  //* TOKEN
  SIGNATURE: str(),
  SESSION_SECRET: str(),
  //* COOKIE
  COOKIE_SECRET: str(),
  COOKIE_NAME: str({ default: 'template_starter' }),
  //* REDIS
  REDIS_PASSWORD: str({ default: '' }),
  REDIS_HOST: str({ default: '127.0.0.1' }),
  REDIS_PORT: port({ default: 6379 }),
  //* GOOGLE
  CAPTCHA_SECRET_KEY: str(),
  GOOGLE_CLIENT_ID: str(),
  //* DATABASE
  DB_USER: str(),
  DB_PASSWORD: str(),
  DB_HOST: str({ default: 'localhost' }),
  DB_PORT: port({ default: 5432 }),
  DB_DATABASE: str(),
});

export default env;
