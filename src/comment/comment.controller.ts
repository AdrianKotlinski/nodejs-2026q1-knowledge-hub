import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { sortItems, paginate } from '../common/list.helpers';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('Comments')
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @ApiOperation({ summary: 'Get all comments for an article' })
  @ApiQuery({ name: 'articleId', required: true, description: 'Article UUID' })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by',
  })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '1-based page number',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'List of comments' })
  @Get()
  async findByArticle(
    @Query('articleId') articleId: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const items = await this.commentService.findByArticle(articleId);
    const sorted = sortItems(items, sortBy, order);
    return paginate(
      sorted,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @ApiOperation({ summary: 'Get comment by ID' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiResponse({ status: 200, description: 'Comment found' })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({ status: 201, description: 'Comment created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 422, description: 'Article not found' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCommentDto) {
    return this.commentService.create(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiResponse({ status: 204, description: 'Comment deleted' })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentService.remove(id);
  }
}
