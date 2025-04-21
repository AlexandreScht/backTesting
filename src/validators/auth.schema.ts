import { emailValidator, numberValidator, passwordValidator, phoneValidator, stringValidator } from '@/utils/zodValidates';
import { z } from 'zod';

export const loginSchema = z.object({
  email: emailValidator,
  password: stringValidator,
});
export const resetPasswordSchema = z
  .object({
    password: passwordValidator,
    confirmPassword: stringValidator,
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Password must be the same',
    path: ['confirmPassword'],
  });

export const registerSchema = z.intersection(
  z.object({ email: emailValidator, firstName: stringValidator, lastName: stringValidator, phone: phoneValidator.optional() }),
  resetPasswordSchema,
);

export const askCodeSchema = z.object({
  code: numberValidator.min(1000).max(9999),
});

export const verify2FASchema = z.object({
  otp: numberValidator.min(100000).max(999999),
});

export const activate2FASchema = z
  .object({
    twoFactorType: z.enum(['email', 'authenticator']),
  })
  .merge(verify2FASchema);
