import { Injectable } from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"
import { CommentCreatedEvent } from "@/events/comment-created.event"
import { LikeCreatedEvent } from "@/events/like-created.event"
import { PostCreatedEvent } from "@/events/post-created.event"

@Injectable()
export class PostEventsListener {
    @OnEvent("post.created")
    handlePostCreatedEvent(event: PostCreatedEvent) {
        console.log("[event:post.created]", event)
    }

    @OnEvent("comment.created")
    handleCommentCreatedEvent(event: CommentCreatedEvent) {
        console.log("[event:comment.created]", event)
    }

    @OnEvent("like.created")
    handleLikeCreatedEvent(event: LikeCreatedEvent) {
        console.log("[event:like.created]", event)
    }
}
