import env from '@/config';
import { user_tester } from '@/config/list';
import { InvalidArgumentError, InvalidCredentialsError, InvalidSessionError, NotFoundError, ServerException } from '@/exceptions';
import { type Session } from '@/interfaces/session';
import { type Token } from '@/interfaces/token';
import ApiServiceFile from '@/services/api';
import AuthServiceFile from '@/services/auth';
import MailerServiceFile from '@/services/mailer';
import UserServiceFile from '@/services/users';
import { type authControllerType } from '@/types/controllers/auth';
import createSessionCookie from '@/utils/createCookie';
import { logger } from '@/utils/logger';
import Container from 'typedi';
import { v4 as uuid } from 'uuid';
import ControllerClass from '.';
export default class AuthControllerFile extends ControllerClass {
  private APIService: ApiServiceFile;
  private AuthService: AuthServiceFile;
  private UserService: UserServiceFile;
  private MailerService: MailerServiceFile;

  constructor() {
    super();
    this.APIService = Container.get(ApiServiceFile);
    this.UserService = Container.get(UserServiceFile);
    this.MailerService = Container.get(MailerServiceFile);
    this.AuthService = Container.get(AuthServiceFile);
  }

  protected async register({
    locals: {
      body: { email, password, firstName, lastName, phone },
    },
    res,
    next,
  }: authControllerType.register) {
    try {
      if (new URL(env.ORIGIN).hostname.startsWith('test.') && !user_tester.includes(email)) {
        throw new InvalidCredentialsError('Only developer accounts can have access to this site.');
      }

      const user = await this.UserService.getUser({ email }, ['id', 'accessToken', 'validate']);

      if (user) {
        const { id, accessToken, validate } = user;
        if (validate) {
          await this.MailerService.already_register(email);
          res.status(200).send('Please check your email to activate your account.');
          return;
        }
        await this.MailerService.new_register(email, accessToken);
        createSessionCookie<Token.cookieIdentifier>(res, { id, cookieName: 'new_register' }, '15m');
        res.status(204).send('Please check your email to activate your account.');
        return;
      }

      await this.transactionBuilder(
        trx => this.AuthService.register({ email, password, firstName, lastName, phone }, trx),
        async ({ id, ...returningValues }) => {
          if (!('accessToken' in returningValues) || !id) throw new InvalidArgumentError();
          const { accessToken } = returningValues;
          await this.MailerService.new_register(email, accessToken);
          createSessionCookie<Token.cookieIdentifier>(res, { id, cookieName: 'new_register' }, '15m');
        },
      );
      res.status(204).send('Please check your email to activate your account.');
    } catch (error) {
      if (!(error instanceof ServerException)) {
        logger.error('AuthControllerFile.register => ', error);
      }
      next(error);
    }
  }

  protected async login({
    locals: {
      body: { email, password },
    },
    res,
    next,
  }: authControllerType.login) {
    try {
      if (new URL(env.ORIGIN).hostname.startsWith('test.') && !user_tester.includes(email)) {
        throw new InvalidCredentialsError('Only developer accounts can have access to this site.');
      }

      const user = await this.UserService.getUserModel(email);

      if (!user) {
        throw new InvalidCredentialsError('Email ou mot de passe incorrect !');
      }

      const { id, role, validate, firstName } = await this.AuthService.login(user, password);

      if (!validate) {
        throw new InvalidSessionError('Please verify your email address by clicking the link sent to your email address before logging in.');
      }

      createSessionCookie<Session.userPayload>(res, { refreshToken: uuid(), sessionId: id, sessionRole: role, cookieName: env.COOKIE_NAME }, '31d');

      res.status(200).send({ firstName, role });
    } catch (error) {
      if (!(error instanceof ServerException)) {
        logger.error('AuthControllerFile.register => ', error);
      }
      next(error);
    }
  }

  protected async oAuthConnect({
    locals: {
      query: { email, firstName, lastName },
    },
    res,
    next,
  }: authControllerType.oAuth) {
    try {
      if (new URL(env.ORIGIN).hostname.startsWith('test.') && !user_tester.includes(email)) {
        throw new InvalidCredentialsError('Only developer accounts can have access to this site.');
      }
      const userFounded = await this.UserService.getUser({ email, isoAuth: true }, ['id', 'role']);

      const { role, id } = userFounded
        ? userFounded
        : await this.transactionBuilder(
            trx => this.AuthService.register({ email, firstName, lastName }, trx),
            async ({ id, ...returningValues }) => {
              if (!('role' in returningValues) || !id) throw new InvalidArgumentError();
              const { role } = returningValues;
              return { role, id };
            },
          );

      createSessionCookie<Session.userPayload>(res, { refreshToken: uuid(), sessionId: id, sessionRole: role, cookieName: env.COOKIE_NAME }, '31d');
      res.status(200).send({ firstName, role });
    } catch (error) {
      if (!(error instanceof ServerException)) {
        logger.error('AuthControllerFile.validateAccount => ', error);
      }
      next(error);
    }
  }

  protected async askResetPassword({
    locals: {
      params: { email },
    },
    res,
    next,
  }: authControllerType.askResetPassword) {
    try {
      if (!email) throw new NotFoundError('Please enter your email address to receive the link.');

      const user = await this.UserService.getUser({ email, isoAuth: false }, ['id', 'validate', 'accessToken']);

      if (!user) {
        res.status(204).send("We've sent you an email with instructions to reset your password.");
        return;
      }

      const { validate, id, accessToken } = user;

      if (!validate) {
        await this.MailerService.new_register(email, accessToken);
        createSessionCookie<Token.cookieIdentifier>(res, { id, cookieName: 'new_register' }, '15m');
        res.status(204).send("We've sent you an email with instructions to reset your password.");
        return;
      }

      const { accessToken: newAccessToken } = (await this.UserService.updateUsers({ id, email }, { accessToken: uuid() }, ['accessToken'])) || {};
      await this.MailerService.new_password(email, newAccessToken);
      createSessionCookie<Token.cookieIdentifier>(res, { id, cookieName: 'new_password' }, '15m');

      res.status(204).send("We've sent you an email with instructions to reset your password.");
    } catch (error) {
      if (!(error instanceof ServerException)) {
        logger.error('AuthControllerFile.validateAccount => ', error);
      }
      next(error);
    }
  }

  protected async resetPassword({
    locals: {
      cookie: { new_password },
      body: { password },
      token: accessToken,
    },
    res,
    next,
  }: authControllerType.resetPassword) {
    try {
      if (!new_password || new_password?.expired || !new_password?.id)
        throw new InvalidArgumentError('This link has expired. Please request a new one to continue.');
      if (!password) throw new InvalidArgumentError('A password is required.');
      const { id } = new_password;
      const success = await this.UserService.updateUsers({ id, accessToken, password: { not: null } }, { password });

      if (!success) throw new InvalidArgumentError('Sorry, something went wrong. If the issue persists, please contact support for assistance');
      res.clearCookie('new_password', {
        signed: true,
        httpOnly: true,
        domain: new URL(env.ORIGIN).hostname,
        secure: env.ORIGIN.startsWith('https'),
      });
      res.status(204).send('Your password has been successfully changed.');
    } catch (error) {
      if (!(error instanceof ServerException)) {
        logger.error('AuthControllerFile.validateAccount => ', error);
      }
      next(error);
    }
  }

  protected async validateAccount({
    locals: {
      params: { accessToken },
      cookie: { new_register },
    },
    res,
    next,
  }: authControllerType.validAccount) {
    try {
      if (!new_register || new_register?.expired) throw new InvalidArgumentError('This link has expired. Please request a new one to continue.');
      const { id } = new_register || {};
      if (!id || !accessToken) {
        throw new InvalidArgumentError('Sorry, something went wrong. Please request a new verification link to continue.');
      }

      const user = await this.UserService.updateUsers({ id, accessToken }, { accessToken: null, validate: true });

      if (!user) {
        throw new InvalidArgumentError('Sorry, something went wrong. If the issue persists, please contact support for assistance');
      }

      res.clearCookie('new_register', {
        signed: true,
        httpOnly: true,
        domain: new URL(env.ORIGIN).hostname,
        secure: env.ORIGIN.startsWith('https'),
      });
      res.status(201).send(true);
    } catch (error) {
      if (!(error instanceof ServerException)) {
        logger.error('AuthControllerFile.validateAccount => ', error);
      }
      next(error);
    }
  }
}
