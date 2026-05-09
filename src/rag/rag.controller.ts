import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RagService } from './rag.service';
import { IndexRagDto } from './dto/index-rag.dto';

@ApiTags('RAG')
@Controller('ai')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('rag/index')
  @HttpCode(HttpStatus.OK)
  index(@Body() dto: IndexRagDto) {
    return this.ragService.index(dto);
  }

  @Delete('rag/index/articles/:articleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteArticleFromIndex(
    @Param('articleId', ParseUUIDPipe) articleId: string,
  ) {
    return this.ragService.deleteArticleFromIndex(articleId);
  }
}
