import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
// import { PartialType } from '@nestjs/swagger';

export class LoginDto {
  // @IsEmail()
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
