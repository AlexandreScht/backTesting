import { type ctx, type LocalsCTX } from './middlewares';

export type Handler<T, K extends keyof T> = T[K];
export namespace Controller {
  export interface ControllerWithParams<T extends string | object> {
    params: T extends 'id' ? { id: number } : T extends string ? { [key in T]: string } : T;
  }

  type cookiesValues<T extends object> = {
    [K in keyof T]: T[K] & { expired?: boolean };
  };

  type MergeCookie<T> = T extends { cookie: infer C extends object } ? Omit<T, 'cookie'> & { cookie: cookiesValues<C> } : T;

  type methodsHandler<T extends LocalsCTX> = ctx<MergeCookie<T>>;
}
