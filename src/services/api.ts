import env from '@/config';
import { ServicesError } from '@/exceptions';
import { logger } from '@/utils/logger';
import axios from 'axios';
import { Service } from 'typedi';

@Service()
export default class ApiServiceFile {
  public async FetchRecaptchaIdentity(response: string) {
    try {
      const { data } = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
        params: {
          secret: env.CAPTCHA_SECRET_KEY,
          response,
        },
      });
      return data.success && new URL(env.ORIGIN).hostname === data.hostname;
    } catch (error) {
      logger.error('ApiService.FetchRecaptchaIdentity => ', error);
      throw new ServicesError();
    }
  }
}
