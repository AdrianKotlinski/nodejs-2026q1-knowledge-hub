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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RagService } from './rag.service';
import { IndexRagDto } from './dto/index-rag.dto';
import { SearchRagDto } from './dto/search-rag.dto';
import { ChatRagDto } from './dto/chat-rag.dto';

@ApiTags('RAG')
@ApiBearerAuth()
@Controller('ai')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('rag/index')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Index Knowledge Hub articles into vector storage' })
  @ApiBody({ type: IndexRagDto })
  @ApiResponse({ status: 200, description: 'Articles indexed successfully' })
  @ApiResponse({
    status: 503,
    description: 'Vector DB or embedding service unavailable',
  })
  index(@Body() dto: IndexRagDto) {
    return this.ragService.index(dto);
  }

  @Post('rag/search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Semantic search in Knowledge Hub articles' })
  @ApiBody({ type: SearchRagDto })
  @ApiResponse({
    status: 200,
    description: 'Ranked chunks with article attribution',
  })
  @ApiResponse({ status: 400, description: 'Missing or invalid query' })
  @ApiResponse({
    status: 503,
    description: 'Vector DB or embedding service unavailable',
  })
  search(@Body() dto: SearchRagDto) {
    return this.ragService.search(dto);
  }

  @Post('rag/chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat with Knowledge Hub using RAG' })
  @ApiBody({ type: ChatRagDto })
  @ApiResponse({
    status: 200,
    description: 'Answer with sources and conversation ID',
  })
  @ApiResponse({ status: 400, description: 'Missing or invalid question' })
  @ApiResponse({
    status: 503,
    description: 'Vector DB or Gemini service unavailable',
  })
  chat(@Body() dto: ChatRagDto) {
    return this.ragService.chat(dto);
  }

  @Delete('rag/index/articles/:articleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove article vectors from the index' })
  @ApiResponse({ status: 204, description: 'Article vectors removed' })
  @ApiResponse({
    status: 404,
    description: 'No index entries found for this article',
  })
  @ApiResponse({ status: 503, description: 'Vector DB unavailable' })
  deleteArticleFromIndex(@Param('articleId', ParseUUIDPipe) articleId: string) {
    return this.ragService.deleteArticleFromIndex(articleId);
  }
}
