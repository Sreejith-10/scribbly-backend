import { Controller } from '@nestjs/common';
import { CollaboratorService } from './collaborator.service';

@Controller('collaborators')
export class CollaboratorController {
  constructor(private readonly collaboratorService: CollaboratorService) {}
}
