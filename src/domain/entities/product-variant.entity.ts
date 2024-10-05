export class ProductVariant {
  constructor(
    public id: string,
    public variant_id: string,
    public attribute_type: string,
    public attribute_value: string,
  ) {}
}
