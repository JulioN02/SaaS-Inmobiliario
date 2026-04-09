import dotenv from 'dotenv';

dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'PORT',
  'PLATFORM_TENANT_ID'
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ [FATAL] Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

export const env = {
  port: parseInt(process.env.PORT as string, 10),
  databaseUrl: process.env.DATABASE_URL as string,
  jwtSecret: process.env.JWT_SECRET as string,
  nodeEnv: process.env.NODE_ENV || 'development',
  platformTenantId: process.env.PLATFORM_TENANT_ID as string
} as const;