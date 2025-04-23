import env from '@/config';
import { mailerConfig } from '@/config/mailer';
import { ServicesError } from '@/exceptions';
import { logger } from '@/utils/logger';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { join } from 'path';
import { Service } from 'typedi';
import util from 'util';

@Service()
export default class MailerServiceFile {
  private transporter: nodemailer.Transporter;
  private template_dir: string = join(__dirname, '../templates');
  private support_mail: string = env.MAILER_SUPPORT;

  constructor() {
    this.transporter = nodemailer.createTransport(mailerConfig);
  }

  private async sendMailAsync(mailOptions: nodemailer.SendMailOptions) {
    try {
      const sendMail = util.promisify(this.transporter.sendMail).bind(this.transporter);

      await sendMail(mailOptions);
    } catch (error) {
      logger.error('MailerService.sendMailAsync => ', error);
      throw new ServicesError();
    }
  }

  async already_register(email: string) {
    try {
      const confirmationEmail = fs.readFileSync(join(this.template_dir, 'already_register.html'), { encoding: 'utf-8' });
      const htmlMailer = confirmationEmail.replace('{{support_MAIL}}', this.support_mail).replace('{{email}}', email);

      const mailOptions = {
        to: email,
        subject: 'Votre compte est déja disponible',
        html: htmlMailer,
      };

      await this.sendMailAsync(mailOptions);
    } catch (error) {
      logger.error('MailerService.Registration => ', error);
      throw new ServicesError();
    }
  }

  async new_register(email: string, token: string) {
    try {
      const confirmationEmail = fs.readFileSync(join(this.template_dir, 'new_register.html'), { encoding: 'utf-8' });
      const htmlMailer = confirmationEmail
        .replace('{{support_MAIL}}', this.support_mail)
        .replace('{{link}}', `${env.ORIGIN}/confirm-account/${encodeURI(token)}`);

      const mailOptions = {
        to: email,
        subject: 'Veuillez valider votre compte',
        html: htmlMailer,
      };

      await this.sendMailAsync(mailOptions);
    } catch (error) {
      logger.error('MailerService.Registration => ', error);
      throw new ServicesError();
    }
  }
}
