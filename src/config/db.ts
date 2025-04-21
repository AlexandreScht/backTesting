// dbConfig.js

import env from '.';

const dbConfig = {
  host: env.DB_HOST,
  database: env.DB_DATABASE,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  port: Number(env.DB_PORT),
};

export default dbConfig;
