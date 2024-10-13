import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadImageUseCase } from '../../application/use-cases/upload-image.use-cases';

@Controller('images')
export class UploadImageController {
  constructor(private readonly uploadImageUseCase: UploadImageUseCase) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const fileUrl = await this.uploadImageUseCase.execute(file);
    return { message: 'Image uploaded successfully', url: fileUrl };
  }
}
