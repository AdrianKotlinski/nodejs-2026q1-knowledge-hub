import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiProperty({ example: 'TypeScript' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Articles about TypeScript' })
  @IsString()
  @IsNotEmpty()
  description: string;
}
