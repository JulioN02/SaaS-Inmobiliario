import { app } from './app';
import { setupSwagger } from './swagger.setup';

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  if (process.env.NODE_ENV !== 'test') {
    await setupSwagger(app);
    console.log('✅ Swagger UI listo en /docs');
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Server URL http://localhost:${PORT}`);
  });
}

bootstrap();