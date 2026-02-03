import { Controller, Get, Post, Body, Param, Query, BadRequestException, Delete } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('api') // Prefix all with /api
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('history')
    async getHistory(@Query('userId') userId: string) {
        if (!userId) throw new BadRequestException("User ID required");
        return this.chatService.getHistory(userId);
    }

    @Get('chats/:chatId')
    async getChat(@Param('chatId') chatId: string, @Query('userId') userId: string) {
        if (!userId) throw new BadRequestException("User ID required");
        return this.chatService.getChat(chatId, userId);
    }

    @Delete('chats/:chatId')
    async deleteChat(@Param('chatId') chatId: string, @Query('userId') userId: string) {
        if (!userId) throw new BadRequestException("User ID required");
        return this.chatService.deleteChat(chatId, userId);
    }

    @Post('chat')
    async createMessage(@Body() body: { userId: string; chatId: string | null; prompt: string }) {
        if (!body.userId) throw new BadRequestException("User ID required");
        return this.chatService.createMessage(body.userId, body.chatId, body.prompt);
    }
}
