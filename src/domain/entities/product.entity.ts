export class Product {
  constructor(
    public id: string,
    public name: string,
    public code: string,
    public description: string,
    public brand: string,
    public categories: string[],
    public quantity: number,
    public size: string,
    public costPrice: number,
    public publicPrice: number,
    public resellerPrice: number,
    public images: string[],
  ) {}
}
