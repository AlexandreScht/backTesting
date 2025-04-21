// dbConfig.js

import env from '.';

const dbConfig = {
  host: env.DB_HOST,
  database: env.DB_DATABASE,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  port: Number(env.DB_PORT),
};

// U = postgres
// P = SinchouEDeaira8!
// H = localhost
// P = 5432
// D = trading

// Dbeaver

export default dbConfig;
