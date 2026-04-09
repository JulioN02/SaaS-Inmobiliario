import swaggerUI from 'swagger-ui-express';
import SwaggerParser from '@apidevtools/swagger-parser';
import path from 'path';
import { Express } from 'express';

export async function setupSwagger(app: Express) {
  try {
    const openapiPath = path.join(__dirname, '../../dist/openapi.yaml');
    const swaggerDocument = await SwaggerParser.bundle(openapiPath);

    app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
  } catch (err) {
    console.error('Could not setup Swagger UI:', err);
  }
}