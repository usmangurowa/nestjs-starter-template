import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class EmploymentInfoDto {
  @IsNotEmpty()
  @IsString()
  occupation: 'student' | 'employed' | 'self-employed' | 'unemployed';

  @IsOptional()
  @IsString()
  sector:
    | 'agriculture'
    | 'manufacturing'
    | 'services'
    | 'construction'
    | 'education'
    | 'health'
    | 'finance'
    | 'trade'
    | 'transport'
    | 'mining'
    | 'real estate'
    | 'information'
    | 'communication'
    | 'other';

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  startDate: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsNotEmpty()
  @IsString()
  role: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsString()
  @IsOptional()
  monthlyIncome: number;

  @IsString()
  @IsOptional()
  salaryDate: string;
}
