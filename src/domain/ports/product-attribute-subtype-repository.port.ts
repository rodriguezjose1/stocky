export interface ProductAttributeSubtypeRepositoryPort {
  getByType(type: string, subtype?: string): Promise<any[]>;
}
