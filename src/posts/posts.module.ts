import { Module } from "@nestjs/common"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { PrismaModule } from "@/prisma/prisma.module"
import { PostsRepository } from "@/posts/posts.repository"
import { ModerationService } from "@/posts/moderation.service"
import { FeedRankingService } from "@/posts/feed-ranking.service"

@Module({
    imports: [PrismaModule],
    controllers: [PostsController],
    providers: [
        PostsService,
        PostsRepository,
        ModerationService,
        FeedRankingService,
    ],
})
export class PostsModule {}
