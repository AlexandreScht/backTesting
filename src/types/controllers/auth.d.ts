import { type Controller } from '@/interfaces/controllers';
import { type Token } from '@/interfaces/token';

export interface authControllerType {
  register(
    ctx: Controller.methodsHandler<{
      body: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
      };
    }>,
  ): Promise<void>;
  login(
    ctx: Controller.methodsHandler<{
      body: {
        email: string;
        password: string;
      };
    }>,
  ): Promise<void>;
  resetPassword(
    ctx: Controller.methodsHandler<{
      cookie: { reset_access: Token.cookieIdentifier };
      body: {
        password: string;
      };
      token: string;
    }>,
  ): Promise<void>;
  askResetPassword(
    ctx: Controller.methodsHandler<{
      params: { email: string };
    }>,
  ): Promise<void>;
  validAccount(
    ctx: Controller.methodsHandler<{
      cookie: { access_cookie: Token.cookieIdentifier };
      params: { code: number };
    }>,
  ): Promise<void>;
  oAuth(
    ctx: Controller.methodsHandler<{
      query: {
        email: string;
        firstName: string;
        lastName: string;
      };
    }>,
  ): Promise<void>;
}
