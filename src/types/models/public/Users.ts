import type { default as UserRole } from './UserRole';
/** Identifier type for public.users */
export type UsersId = number;
/** Represents the table public.users */
export default interface UsersTable {
  id: UsersId;
  email: string;
  password: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone: string | null;
  validate: boolean;
  accessToken: string | null;
  stripeCustomerId: string | null;
  isSubscribed: boolean;
  updated_at: Date;
  created_at: Date;
}
