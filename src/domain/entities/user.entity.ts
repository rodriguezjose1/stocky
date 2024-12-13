import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public lastname: string,
    public password: string,
    public email: string,
    public roles: any[],
    public phone: string,
    public birthdate: Date,
    public address: string,
    public active: boolean,
    public lastConnection: Date,
    public dni: string,
  ) {}
}

export class GetResellersFilterDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1; // Página de semanas

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20; // Límite de semanas a devolver
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(4)
  newPassword: string;
}
