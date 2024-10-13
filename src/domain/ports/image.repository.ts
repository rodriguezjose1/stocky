export interface ImageRepository {
  save(file: Express.Multer.File): Promise<string>;
}
