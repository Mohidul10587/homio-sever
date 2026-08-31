import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject } from 'class-validator';

export class CreateCaseDto {
  @IsString()
  @IsNotEmpty()
  mainDisease!: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  onset?: string;

  @IsArray()
  @IsString({ each: true })
  aggravation: string[] = [];

  @IsArray()
  @IsString({ each: true })
  amelioration: string[] = [];

  @IsArray()
  @IsString({ each: true })
  mentalState: string[] = [];

  @IsOptional()
  @IsString()
  thermalState?: string;

  @IsArray()
  @IsString({ each: true })
  thirst: string[] = [];

  @IsArray()
  @IsString({ each: true })
  foodPreference: string[] = [];

  @IsArray()
  @IsString({ each: true })
  sleep: string[] = [];

  @IsOptional()
  @IsString()
  additionalSymptoms?: string;

  @IsOptional()
  @IsObject()
  rawFormData?: Record<string, any>;
}
