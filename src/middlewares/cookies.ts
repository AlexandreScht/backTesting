import { decryptSessionApiKey } from '@/utils/token';
import { InvalidArgumentError, NotFoundError, ServerException } from '@exceptions';
import { type ctx } from '@interfaces/middlewares';
import { TokenExpiredError } from 'jsonwebtoken';

const cookies = ({ names, onlySigned = true, acceptError = false }: { names: string | string[]; onlySigned?: boolean; acceptError?: boolean }) => {
  return async (ctx: ctx) => {
    const {
      next,
      locals,
      req: { signedCookies, cookies },
    } = ctx;
    try {
      if (!names || !names.length) throw new ServerException(500, 'cookie name(s) is required');
      const cookieNames = Array.isArray(names) ? names : [names];

      const cookiesToCheck = onlySigned ? signedCookies : { ...signedCookies, ...cookies };

      const foundedCookies = cookieNames.reduce<Record<string, unknown>>((acc, name) => {
        if (name in cookiesToCheck) {
          try {
            const value = cookiesToCheck[name];
            const [err, cookieValues] = decryptSessionApiKey<object | undefined>(value, acceptError);
            if (err instanceof TokenExpiredError) {
              if (acceptError && cookieValues) {
                return { ...acc, [name]: { ...cookieValues, expired: true } };
              }
              throw new InvalidArgumentError('Accès expiré.');
            }

            if (err instanceof Error) {
              throw err;
            }
            if (err || !cookieValues) throw new Error();
            return { ...acc, [name]: cookieValues };
          } catch (error) {
            if (error instanceof Error) throw error;
            throw new Error();
          }
        }
        return acc;
      }, undefined);

      if (!foundedCookies) {
        if (!acceptError) throw new NotFoundError("Votre code d'accès est introuvable. Veuillez refaire votre demande.");
        ctx.locals = { ...locals, cookie: {} };
      } else {
        ctx.locals = { ...locals, cookie: foundedCookies };
      }

      await next();
    } catch (error) {
      if (error instanceof InvalidArgumentError) {
        throw new InvalidArgumentError(error.message);
      }
      if (error instanceof NotFoundError) {
        throw new NotFoundError(error.message);
      }
      if (error instanceof ServerException) {
        throw new ServerException(error.status, error.message);
      }
      throw new ServerException(401);
    }
  };
};

export default cookies;
