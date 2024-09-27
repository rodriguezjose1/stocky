import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module'; // Asegúrate de que la ruta sea correcta
import { ProductSeeder } from './product.seeder';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const productSeeder = appContext.get(ProductSeeder);

  try {
    await productSeeder.createMultipleProducts();
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error while creating products:', error);
  } finally {
    await appContext.close();
  }
}

bootstrap();
