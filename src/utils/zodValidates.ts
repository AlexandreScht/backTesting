import parsePhoneNumber from 'libphonenumber-js';
import { z } from 'zod';

export const phoneValidator = z.string().transform((value, ctx) => {
  try {
    const phone = parsePhoneNumber(value, { defaultCountry: 'FR' });
    if (!phone.isValid()) throw new Error();
    return phone.number;
  } catch {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid phone number' });
    return z.NEVER;
  }
});

//? int
export const numberValidator = z.number().int({ message: 'Invalid type. A ≪ number ≫ type is required.' });

//? string
export const stringValidator = z.string({ message: 'Invalid type. A ≪ string ≫ type is required.' });
export const roleValidator = z.enum(['admin', 'business', 'pro', 'free'], { message: 'Invalid choice. The value must be one of the valid options.' });
export const emailValidator = stringValidator.email({ message: 'Invalid email address' });
export const passwordValidator = z.string().superRefine((value, ctx) => {
  const errors = [];

  if (!/[A-Z]/.test(value)) {
    errors.push('an uppercase letter');
  }
  if (!/[a-z]/.test(value)) {
    errors.push('a lowercase letter');
  }
  if (!/[0-9]/.test(value)) {
    errors.push('a digit');
  }
  if (!/[^0-9A-Za-z]/.test(value)) {
    errors.push('a special character');
  }
  if (value.length < 8) {
    errors.push('at least 8 characters');
  }

  if (errors.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `The password must include: ${errors.join(', ')}`,
    });
  }
});
