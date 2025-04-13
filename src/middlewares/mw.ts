import env from '@/config';
import { ExpiredSessionError, InvalidArgumentError } from '@/exceptions';
import { type Session } from '@/interfaces/session';
import { decryptSessionApiKey } from '@/utils/token';
import type { ctx } from '@interfaces/middlewares';
import { createHmac } from 'crypto';
import deepmerge from 'deepmerge';
import type { NextFunction, Request, Response } from 'express';
import { stringify } from 'uuid';

const { COOKIE_NAME } = env;
const getAuthorization = (req: Request) => {
  const coockie = req.signedCookies[COOKIE_NAME];

  if (coockie) return coockie;

  return null;
};

const computedSignature = (req: Request) => {
  const signature = req.header('Signature');
  if (!signature) throw new InvalidArgumentError('Signature value is required');
  const buffedSign = new Uint8Array(Buffer.from(signature, 'base64'));
  const sign = stringify(buffedSign);
  return [createHmac('sha256', env.SIGNATURE).update(sign).digest('hex'), signature];
};

const mw =
  (middlewaresHandler: any[]) =>
  async (req: Request, res: Response, nextExpress: NextFunction): Promise<void> => {
    if (!middlewaresHandler || middlewaresHandler.length === 0) {
      return nextExpress();
    }

    const locals = {};
    const onErrors = [];
    const session: Partial<Session.TokenUser> = {};
    let handlerIndex = 0;
    const ctx: ctx = {
      req,
      res,
      get locals() {
        return locals;
      },
      set locals(newLocals) {
        Object.assign(locals, deepmerge(locals, newLocals));
      },
      get onError() {
        return onErrors;
      },
      set onError(newAction) {
        Object.assign(onErrors, deepmerge(onErrors, newAction));
      },
      get session() {
        return session;
      },
      set session(newSession) {
        Object.assign(session, deepmerge(session, newSession));
      },
      next: async err => {
        try {
          if (err && err instanceof Error) {
            if (ctx.onError.length) {
              await Promise.all(ctx.onError.map(fn => fn()));
            }
            return nextExpress(err);
          }

          const handler = middlewaresHandler[handlerIndex];
          handlerIndex += 1;

          if (typeof handler === 'function') {
            await handler(ctx);
          } else {
            return nextExpress(new Error('Handler is not a function'));
          }
        } catch (error) {
          if (ctx.onError.length) {
            await Promise.all(ctx.onError.map(fn => fn()));
          }
          return nextExpress(error);
        }
      },
    };
    try {
      const Authorization = getAuthorization(req);

      if (Authorization) {
        const [err, user] = decryptSessionApiKey<Session.TokenUser>(Authorization);

        if (err || !user) {
          throw new ExpiredSessionError();
        }

        ctx.session = user;
      }
      const [xSignature, signature] = computedSignature(req);
      ctx.res.setHeader('X-Signature', xSignature);
      ctx.res.setHeader('Signature', signature);
      const xTag = req.header('x-Tag');
      if (xTag) ctx.res.setHeader('x-Tag', xTag);
      await ctx.next();
    } catch (err) {
      console.log(err);

      return nextExpress(err);
    }
  };

export default mw;
