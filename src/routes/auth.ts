import AuthControllerFile from '@/controllers/auth';
import captchaMiddleWare from '@/middlewares/captcha';
import googleOAuthToken from '@/middlewares/checkOAuth';
import cookies from '@/middlewares/cookies';
import mw from '@/middlewares/mw';
import slowDown from '@/middlewares/slowDown';
import Validator from '@/middlewares/validator';
import { stringValidator } from '@/utils/zodValidates';
import { askCodeSchema, loginSchema, registerSchema, resetPasswordSchema } from '@/validators/auth.schema';
import { Router } from 'express';
import { z } from 'zod';

export class AuthRouter extends AuthControllerFile {
  public router = Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post('/register', mw([Validator({ body: registerSchema }), captchaMiddleWare(), this.register]));
    this.router.get('/askCode', mw([cookies({ names: 'access_cookie', acceptError: true }), this.askCode]));
    this.router.patch(
      '/reset-password',
      mw([cookies({ names: 'reset_access' }), Validator({ body: resetPasswordSchema, token: stringValidator }), this.resetPassword]),
    );
    this.router.patch('/reset-password/:email', mw([Validator({ params: z.object({ email: stringValidator }) }), this.askResetPassword]));
    this.router.patch(
      '/validate-account/:code',
      mw([Validator({ params: askCodeSchema }), cookies({ names: 'access_cookie', acceptError: true }), this.validateAccount]),
    );
    this.router.post('/login', mw([Validator({ body: loginSchema }), captchaMiddleWare(), slowDown({ onError: 750 }), this.login]));
    this.router.get('/oAuth', mw([Validator({ token: stringValidator }), googleOAuthToken(), this.oAuthConnect]));
    // this.router.patch('/active2FA', mw([auth(), Validator({ body: activate2FASchema, token: stringValidator.optional() }), this.activate2FA]));
    // this.router.get('/verify2FA/:otp', mw([Validator({ params: verify2FASchema }), cookies({ names: 'TwoFA_cookie' }), this.verify2FA]));
  }

  getRouter() {
    return this.router;
  }
}
