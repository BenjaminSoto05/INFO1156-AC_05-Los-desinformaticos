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

@Module({
    imports: [PrismaModule],
    controllers: [PostsController],
    providers: [
        PostsService,
        PostEventsListener,
        NotificationService,
        RecomputationService,
    ],
})
export class PostsModule {}
