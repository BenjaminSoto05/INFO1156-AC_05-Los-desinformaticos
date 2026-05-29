import { CommentEntity } from "@/posts/entities/comment.entity"
import { LikeEntity } from "@/posts/entities/like.entity"

export class PostsMapper {
    static toCommentEntity(
        comment: any,
        moderation: { blocked: boolean; reason: string },
    ) {
        return new CommentEntity(
            comment.id,
            comment.postId,
            comment.content,
            comment.createdAt,
            comment.updatedAt,
            comment.source,
            moderation.blocked ? "blocked" : "approved",
            comment.content.length > 60 ? 80 : 40,
            false,
            "es",
            { moderation, source: "legacy" },
        )
    }

    static toLikeEntity(like: any) {
        return new LikeEntity(
            like.id,
            like.postId,
            like.reactionType,
            like.weight,
            like.source,
            like.createdAt,
            like.weight > 2 ? "strong" : "normal",
            true,
            { from: "manual", r: like.reactionType },
        )
    }
}
