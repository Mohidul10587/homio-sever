import { IsString, IsOptional, IsInt, IsDateString, Min } from 'class-validator';

export class CreateFollowUpDto {
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  currentSymptoms?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  improvementPercent?: number;

  @IsOptional()
  @IsString()
  newSymptoms?: string;

  @IsOptional()
  @IsString()
  worseSymptoms?: string;

  @IsOptional()
  @IsString()
  betterSymptoms?: string;

  @IsOptional()
  @IsString()
  sleepChange?: string;

  @IsOptional()
  @IsString()
  appetiteChange?: string;

  @IsOptional()
  @IsString()
  energyChange?: string;

  @IsOptional()
  @IsString()
  newModalities?: string;

  @IsOptional()
  @IsString()
  medicineResponse?: string;

  @IsOptional()
  @IsString()
  doctorNotes?: string;
}
