import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RagService } from './rag.service';

@ApiTags('RAG')
@Controller('ai')
export class RagController {
  constructor(private readonly ragService: RagService) {}
}
