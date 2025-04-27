import type UserRole from '@/types/models/public/UserRole';

export namespace Session {
  export type JWT<T> = string & { __jwtPayloadBrand?: T };
  export interface userPayload {
    sessionId: number;
    sessionRole: UserRole;
    refreshToken: string;
  }
}
