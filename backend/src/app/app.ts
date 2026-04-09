import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import * as OpenApiValidator from 'express-openapi-validator';
import { errorHandler } from '../middlewares/error.middleware';
import { v1Routes } from '../routes/v1.routes';
import path from 'path';
import express from 'express';
import fs from 'fs';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const openapiPath = path.join(__dirname, '../../dist/openapi.yaml');

app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok' });
});

// Install OpenAPI validator only if spec exists to avoid test/startup failures
if (fs.existsSync(openapiPath)) {
  app.use(
    OpenApiValidator.middleware({
      apiSpec: openapiPath,
      validateRequests: true,
      validateResponses: false,
    })
  );
} else {
  console.warn(`OpenAPI spec not found at ${openapiPath} — skipping request validation middleware.`);
}

app.use('/api/v1', v1Routes);
app.use(errorHandler);