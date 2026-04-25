import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../common/enums';

export class UpdatePasswordDto {
  @ApiPropertyOptional({ example: 'oldSecret123' })
  @IsOptional()
  @IsString()
  oldPassword?: string;

  @ApiPropertyOptional({ example: 'newSecret456' })
  @IsOptional()
  @IsString()
  newPassword?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
