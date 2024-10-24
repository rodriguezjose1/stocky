export interface ProductAttributeRepositoryPort {
  getByType(type: string, subtype?: string): Promise<any[]>;
}
