export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public lastname: string,
    public password: string,
    public email: string,
    public roles: any[],
  ) {}
}
