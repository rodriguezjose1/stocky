import { Inject } from '@nestjs/common';
import { ImageRepository } from 'src/domain/ports/image.repository';

export class UploadImageUseCase {
  constructor(
    @Inject('ImageRepository')
    private readonly imageRepository: ImageRepository,
  ) {}

  async execute(file: Express.Multer.File): Promise<string> {
    return this.imageRepository.save(file);
  }
}
