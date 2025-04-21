require('dotenv').config();
const path = require('path');
const { makeKyselyHook } = require('kanel-kysely');

/** @type {import('kanel').Config} */
module.exports = {
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT),
  },
  preDeleteOutputFolder: true,
  outputPath: path.resolve(__dirname, 'src/types/models'),
  preRenderHooks: [makeKyselyHook()],
  typeFilter: require('kanel-kysely').kyselyTypeFilter,
  getMetadata(details, generateFor, config) {
    const meta = defaultGetMetadata(details, generateFor, config);
    return {
      ...meta,
      dir: config.outputPath,
      filename: `${details.name}.ts`,
    };
  },
};
