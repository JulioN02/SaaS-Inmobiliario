export interface JwtPayload {
  sub: string;
  client_id: string;
  role: string;
  plan: string;
  permissions: Array<{ resource: string; action: string }>;
}
