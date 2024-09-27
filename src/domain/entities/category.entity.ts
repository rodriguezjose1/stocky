export class Category {
  constructor(
    public id: string,
    public code: string,
    public name: string,
    public root: string,
    public parent: number,
    public path: string,
  ) {}
}
