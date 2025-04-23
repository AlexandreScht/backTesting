import env from './index';

export const mailerConfig = {
  host: env.MAILER_HOST,
  port: env.MAILER_PORT,
  // requireTLS: true,
  auth: {
    user: env.MAILER_USER,
    pass: env.MAILER_PASSWORD,
  },
  from: env.MAILER_FROM,
};
