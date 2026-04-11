import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome in REST API for a Knowledge Hub platform using the Nest.js framework. The Knowledge Hub allows users to create, edit, and organize articles by categories and tags.';
  }
}
