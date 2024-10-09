export class Ancestor {
  constructor(
    public id: string,
    public name: string,
    public slug: string,
  ) {}
}

export class Category {
  constructor(
    public id: string,
    public name: string,
    public slug: string,
    public parent: string,
    public ancestors: Ancestor[],
    public children: any[],
  ) {}
}
