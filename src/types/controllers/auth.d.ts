import { type Controller } from '@/interfaces/controllers';
import { type Token } from '@/interfaces/token';

declare namespace authControllerType {
  type register = Controller.methodsHandler<{
    body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    };
  }>;

  type login = Controller.methodsHandler<{
    body: {
      email: string;
      password: string;
    };
  }>;

  type resetPassword = Controller.methodsHandler<{
    cookie: { reset_access: Token.cookieIdentifier };
    body: {
      password: string;
    };
    token: string;
  }>;

  type askResetPassword = Controller.methodsHandler<{
    params: { email: string };
  }>;

  type validAccount = Controller.methodsHandler<{
    params: { accessToken: string };
    cookie: { new_register: Token.cookieIdentifier };
  }>;

  type oAuth = Controller.methodsHandler<{
    query: {
      email: string;
      firstName: string;
      lastName: string;
    };
  }>;
}
