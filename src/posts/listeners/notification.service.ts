import { Injectable } from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"
import { PostCreatedEvent } from "@/events/post-created.event"

@Injectable()
export class NotificationService {
    @OnEvent("post.created")
    handlePostCreatedEvent(event: PostCreatedEvent) {
        console.log(`[notify:post]`, { postId: event.postId })
    }
}
