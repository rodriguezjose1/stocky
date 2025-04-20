import { NestFactory } from '@nestjs/core';
import { UpdateSalesVariantDataScript } from './update-sales-variant-data';
import { MigrationModule } from './migration.module';
import { ConfigService } from '@nestjs/config';

const AVAILABLE_MIGRATIONS = {
  'update-sales-variant-data': UpdateSalesVariantDataScript,
  // Aquí puedes agregar más migraciones según sea necesario
};

async function migrate() {
  const scriptName = process.argv[2];

  if (!scriptName) {
    console.error('Error: Debes especificar el nombre del script de migración');
    console.log('\nMigraciones disponibles:');
    Object.keys(AVAILABLE_MIGRATIONS).forEach(name => {
      console.log(`  - ${name}`);
    });
    process.exit(1);
  }

  const MigrationScript = AVAILABLE_MIGRATIONS[scriptName];
  
  if (!MigrationScript) {
    console.error(`Error: La migración "${scriptName}" no existe`);
    console.log('\nMigraciones disponibles:');
    Object.keys(AVAILABLE_MIGRATIONS).forEach(name => {
      console.log(`  - ${name}`);
    });
    process.exit(1);
  }

  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  
  try {
    const app = await NestFactory.createApplicationContext(MigrationModule);
    const configService = app.get(ConfigService);
    
    console.log(`DATABASE_URI: ${configService.get<string>('DATABASE_URI')}`);
    
    const migrationScript = app.get(MigrationScript);

    try {
      console.log(`Iniciando migración: ${scriptName}...`);
      await migrationScript.execute();
      console.log('Migración completada exitosamente');
    } catch (error) {
      console.error('Error durante la migración:', error);
      process.exit(1);
    } finally {
      await app.close();
    }
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
    process.exit(1);
  }
}

migrate(); 