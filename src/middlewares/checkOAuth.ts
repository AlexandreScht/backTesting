import env from '@/config';
import { type ctx } from '@/interfaces/middlewares';
import { logger } from '@/utils/logger';
import { ServerException } from '@exceptions';
import { OAuth2Client } from 'google-auth-library';

export default function googleOAuthToken() {
  return async (ctx: ctx) => {
    const { next, locals } = ctx;
    try {
      const CLIENT_ID = env.GOOGLE_CLIENT_ID;

      const client = new OAuth2Client(CLIENT_ID);
      const { token } = locals;

      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,
      });

      const { given_name: firstName, family_name: lastName, email } = ticket.getPayload();

      locals.query = { firstName, lastName, email };

      next();
    } catch (error) {
      logger.error(error);
      throw new ServerException(401, "La connexion OAuth n'a pas été validée par Google");
    }
  };
}
