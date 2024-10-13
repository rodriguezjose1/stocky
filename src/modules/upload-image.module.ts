// image.module.ts
import { Module } from '@nestjs/common';
import { UploadImageController } from '../interfaces/http/upload-image.controller';
import { UploadImageUseCase } from '../application/use-cases/upload-image.use-cases';
import { ImageCloudinaryRepository } from '../infrastructure/adapters/image-storage/cloudinary/cloudinary.repository';
import { CloudinaryConfigService } from '../infrastructure/adapters/image-storage/cloudinary/cloudinary.config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [UploadImageController],
  providers: [UploadImageUseCase, CloudinaryConfigService, { provide: 'ImageRepository', useClass: ImageCloudinaryRepository }],
})
export class UploadImageModule {}
