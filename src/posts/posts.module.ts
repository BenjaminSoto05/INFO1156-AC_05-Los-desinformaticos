import { Module } from "@nestjs/common"
import { NotificationService } from "@/posts/listeners/notification.service"
import { PostEventsListener } from "@/posts/listeners/post-events.listener"
import { RecomputationService } from "@/posts/listeners/recomputation.service"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { PrismaModule } from "@/prisma/prisma.module"
import { PostsRepository } from "@/posts/posts.repository"
import { ModerationService } from "@/posts/moderation.service"
import { FeedRankingService } from "@/posts/feed-ranking.service"
import { FeedService } from "@/posts/feed.service"

@Module({
    imports: [PrismaModule],
    controllers: [PostsController],
    providers: [
        PostsService,
        PostsRepository,
        ModerationService,
        FeedRankingService,
        FeedService,
    ],
})
export class PostsModule {}
