export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  /** Session ID — embedded in every access token; validated on each request. */
  sid: string;
  iat?: number;
  exp?: number;
}
