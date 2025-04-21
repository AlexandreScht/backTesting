export namespace Session {
  export type JWT<T> = string & { __jwtPayloadBrand?: T };

  export type role = 'normal' | 'premium' | 'admin';

  export interface userPayload {
    sessionId: number;
    sessionRole: role;
    refreshToken: string;
  }
}
