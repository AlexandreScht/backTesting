import { type ctx } from '@/interfaces/middlewares';
import { type Session } from '@/interfaces/session';
import { ExpiredSessionError, InvalidAccessError, InvalidRoleAccessError } from '@exceptions';

const auth = (role?: Session.role | Session.role[]) => {
  return async (ctx: ctx) => {
    const { next, session } = ctx;

    const { sessionId, refreshToken, sessionRole } = session || {};

    if (!sessionId || !refreshToken || !sessionRole) {
      throw new ExpiredSessionError();
    }

    if (role && sessionRole !== role && !role.includes(sessionRole)) {
      if (role === 'admin') {
        throw new InvalidAccessError('Requires administrator account privileges');
      }
      throw new InvalidRoleAccessError();
    }

    next();
  };
};

export default auth;
