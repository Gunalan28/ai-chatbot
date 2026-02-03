import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import Groq from 'groq-sdk';

@Injectable()
export class ChatService {
    private groq: Groq;

    constructor(private prisma: PrismaService) {
        this.groq = new Groq({
            apiKey: process.env.GROQ_API_KEY || ''
        });
    }

    async getHistory(userId: string) {
        return this.prisma.chat.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
            take: 50,
        });
    }

    async getChat(chatId: string, userId: string) {
        return this.prisma.chat.findUnique({
            where: { id: chatId, userId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
    }

    async createMessage(userId: string, chatId: string | null, prompt: string) {
        if (!prompt) throw new Error('Prompt is required');

        let activeChatId = chatId;

        // Create new chat if not exists
        if (!activeChatId) {
            const chat = await this.prisma.chat.create({
                data: {
                    userId,
                    title: prompt.substring(0, 50) + '...',
                },
            });
            activeChatId = chat.id;
        } else {
            // Verify ownership
            const chat = await this.prisma.chat.findUnique({ where: { id: activeChatId, userId } });
            if (!chat) throw new Error('Chat not found or unauthorized');
        }

        // Save user message
        await this.prisma.message.create({
            data: {
                chatId: activeChatId,
                role: 'user',
                content: prompt,
            },
        });

        // Get context
        const previousMessages = await this.prisma.message.findMany({
            where: { chatId: activeChatId },
            orderBy: { createdAt: 'asc' },
            take: 10,
        });

        // Format history for Groq (OpenAI compatible)
        const messages: any[] = previousMessages.map((msg: any) => ({
            role: msg.role === 'model' ? 'assistant' : msg.role,
            content: msg.content
        }));

        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: 'system', content: 'You are a helpful AI assistant.' },
                    ...messages
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 1024,
            });

            const text = completion.choices[0]?.message?.content || "";

            await this.prisma.message.create({
                data: {
                    chatId: activeChatId,
                    role: 'model',
                    content: text,
                },
            });

            return { response: text, chatId: activeChatId };
        } catch (error: any) {
            console.error("Groq Error:", error);
            if (error?.status === 429) {
                throw new HttpException('Too Many Requests: Groq API Limit Exceeded. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
            }
            throw new HttpException('Failed to generate response from AI', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteChat(chatId: string, userId: string) {
        // Verify ownership
        const chat = await this.prisma.chat.findUnique({ where: { id: chatId, userId } });
        if (!chat) throw new Error('Chat not found or unauthorized');

        // Delete related messages first
        await this.prisma.message.deleteMany({ where: { chatId } });

        return this.prisma.chat.delete({
            where: { id: chatId },
        });
    }
}
