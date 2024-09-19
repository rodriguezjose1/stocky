class Permission {
  allowedFields: any;
}

export class Role {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public permissions: Permission,
  ) {}
}
