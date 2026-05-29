import { Injectable } from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"
import { PostCreatedEvent } from "@/events/post-created.event"

@Injectable()
export class RecomputationService {
    @OnEvent("post.created")
    handlePostCreatedEvent(event: PostCreatedEvent) {
        console.log(`[recompute] postId=${event.postId}`)
    }
}
