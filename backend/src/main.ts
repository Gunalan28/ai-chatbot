import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enable CORS for Frontend
  await app.listen(process.env.PORT ?? 4000); // Default NestJS port 3000 might conflict if NextJS uses it? Default is 3000 actually. Let's force 4000.
}
bootstrap();
