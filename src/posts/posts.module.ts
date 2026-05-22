import { Module } from "@nestjs/common"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { PostsRepository } from "@/posts/posts.repository"
import { ModerationService } from "@/posts/moderation.service"
import { FeedRankingService } from "@/posts/feed-ranking.service"

@Module({
    controllers: [PostsController],
    providers: [
        PostsService,
        PostsRepository,
        ModerationService,
        FeedRankingService,
    ],
})
export class PostsModule {}
