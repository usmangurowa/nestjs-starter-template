import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class KycDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  bvn: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  NINNumber?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  NINImage?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  lastName?: string;
}
