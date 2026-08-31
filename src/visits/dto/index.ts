import { IsOptional, IsString } from 'class-validator';

export class CreateVisitDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
