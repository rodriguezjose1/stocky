// infrastructure/image-cloudinary.repository.ts
import { ImageRepository } from 'src/domain/ports/image.repository';
import { Injectable } from '@nestjs/common';
import { CloudinaryConfigService } from './cloudinary.config';

@Injectable()
export class ImageCloudinaryRepository implements ImageRepository {
  constructor(private readonly cloudinary: CloudinaryConfigService) {}

  async save(file: Express.Multer.File): Promise<string> {
    const uploadResult = await this.cloudinary.uploadImage(file);
    return uploadResult.secure_url; // Retorna la URL segura de la imagen
  }
}
