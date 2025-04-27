import env from '@/config';
import cookie from 'cookie';
import signCookie from 'cookie-signature';
import type { Response } from 'express';
import ms from 'ms';
import { createSessionToken } from './token';
const { ORIGIN, COOKIE_NAME } = env;

export default function createSessionCookie<T extends object>(
  res: Response,
  values: T & { cookieName: string },
  timer: ms.StringValue = '15m',
): void {
  const { cookieName, ...other } = values;
  const sessionToken = createSessionToken<T>(other as T, timer);
  res.cookie(cookieName, sessionToken, {
    signed: true,
    httpOnly: true,
    sameSite: 'strict',
    maxAge: ms(timer),
    domain: new URL(ORIGIN).hostname,
    secure: ORIGIN.startsWith('https'),
  });
}

export function refreshSessionCookie<T extends object>(values: T & { cookieName: string }, timer: ms.StringValue = '15m'): string {
  const { cookieName, ...other } = values;

  const sessionToken = createSessionToken<T>(other as T, timer);
  const signedCookieValue = signCookie.sign(sessionToken, COOKIE_NAME);
  return cookie.serialize(cookieName, `s:${signedCookieValue}`, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: ms(timer),
    domain: new URL(ORIGIN).hostname,
    secure: ORIGIN.startsWith('https'),
  });
}
