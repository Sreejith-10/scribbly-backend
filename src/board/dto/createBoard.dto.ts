import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBoardDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  description: string;

  @IsIn(['private', 'request_access', 'public'], {
    message: 'accessMode must be one of: private, request_access, or public',
  })
  accessMode: 'private' | 'request_access' | 'public';
}
