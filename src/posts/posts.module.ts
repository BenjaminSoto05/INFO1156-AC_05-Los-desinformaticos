import { Module } from "@nestjs/common"
import { NotificationService } from "@/posts/listeners/notification.service"
import { PostEventsListener } from "@/posts/listeners/post-events.listener"
import { RecomputationService } from "@/posts/listeners/recomputation.service"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"

@Module({
    controllers: [PostsController],
    providers: [
        PostsService,
        PostEventsListener,
        NotificationService,
        RecomputationService,
    ],
})
export class PostsModule {}
