import { Controller } from '@nestjs/common';
import { DeltaHistoryService } from './delta-history.service';

@Controller('delta-history')
export class DeltaHistoryController {
  constructor(private readonly deltaHistoryService: DeltaHistoryService) {}
}
