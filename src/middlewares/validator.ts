import { InvalidArgumentError, ServerException } from '@/exceptions';
import { type ctx, type validators } from '@interfaces/middlewares';
import type { Request } from 'express';
import { z, ZodError, ZodObject } from 'zod';

const Validator = ({ body, params: iniParams, query: iniQuery, token: tokenShame }: validators) => {
  const validator = z.object({
    ...(body ? { body: body } : {}),
    ...(iniQuery ? { query: iniQuery } : {}),
    ...(iniParams ? { params: iniParams } : {}),
  });

  const tokenValidate = (req: Request) => {
    const tokenValue = req.header('Authorization')?.split('Bearer ')[1];
    const tokenValidator = z.object({
      token: tokenShame,
    });
    const { token } = tokenValidator.parse({ token: tokenValue });
    return token;
  };

  return async (ctx: ctx) => {
    const { req, next } = ctx;
    try {
      const convertedParams: Record<string, any> = { ...req.params };
      if (iniParams && iniParams instanceof ZodObject) {
        for (const paramKey in req.params) {
          let paramDef = iniParams.shape[paramKey]?._def;
          if (paramDef) {
            let round = 0;
            while ((paramDef?.typeName === 'ZodDefault' || paramDef?.typeName === 'ZodOptional') && round < 10) {
              paramDef = paramDef.innerType._def;
              round++;
            }
            if (paramDef.typeName === 'ZodNumber') {
              convertedParams[paramKey] = Number(req.params[paramKey]);
            } else if (paramDef.typeName === 'ZodArray' && typeof req.params[paramKey] === 'string') {
              try {
                const arr = JSON.parse(req.params[paramKey]);
                convertedParams[paramKey] = arr;
              } catch (error) {
                convertedParams[paramKey] = req.params[paramKey]?.split(',');
              }
            } else if (paramDef.typeName === 'ZodBoolean' && typeof req.params[paramKey] === 'string') {
              const currentVal = req.params[paramKey];
              convertedParams[paramKey] = currentVal === 'true' ? true : currentVal === 'false' ? false : currentVal;
            }
          }
        }
      }

      const convertedQueries: Record<string, any> = { ...req.query };
      if (iniQuery && iniQuery instanceof ZodObject) {
        for (const queryKey in req.query) {
          let queryDef = iniQuery.shape[queryKey]?._def;
          if (queryDef) {
            let round = 0;
            while ((queryDef?.typeName === 'ZodDefault' || queryDef?.typeName === 'ZodOptional') && round < 10) {
              queryDef = queryDef.innerType._def;
              round++;
            }
            if (queryDef.typeName === 'ZodNumber') {
              convertedQueries[queryKey] = Number(req.query[queryKey]);
            } else if (queryDef.typeName === 'ZodArray' && typeof req.query[queryKey] === 'string') {
              try {
                const arr = JSON.parse(req.query[queryKey]);
                convertedQueries[queryKey] = arr;
              } catch (error) {
                convertedQueries[queryKey] = req.query[queryKey]?.split(',') || req.query[queryKey];
              }
            } else if (queryDef.typeName === 'ZodBoolean' && typeof req.query[queryKey] === 'string') {
              const currentVal = req.query[queryKey];
              convertedQueries[queryKey] = currentVal === 'true' ? true : currentVal === 'false' ? false : currentVal;
            }
          }
        }
      }

      const { body, params, query } = validator.parse({
        body: req.body,
        params: convertedParams,
        query: convertedQueries,
      });
      const token = tokenShame ? tokenValidate(req) : undefined;
      ctx.locals = {
        body,
        params,
        query,
        ...(token ? { token } : {}),
      };
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        if (error.errors.some(err => err.path.join('.') === 'token')) {
          throw new InvalidArgumentError('Votre token est invalide');
        }
        const combinedErrorMessage = error.errors
          .map(err => {
            const path = err.path.join('.');
            if (err.message === 'Required') {
              return `${path}: Required ${(err as any).expected}`;
            }
            return `${path}: ${err.message}`;
          })
          .join(' - ');
        throw new InvalidArgumentError(`Invalid type for keys: ${combinedErrorMessage}`);
      }
      throw new ServerException(error.message);
    }
  };
};

export default Validator;
