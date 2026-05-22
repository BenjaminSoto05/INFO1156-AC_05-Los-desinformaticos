import { CommentEntity } from "@/posts/entities/comment.entity"
import { LikeEntity } from "@/posts/entities/like.entity"
import { PostEntity } from "@/posts/entities/post.entity"
import { FeedMode } from "@/posts/feed-ranking.service"

export class PostsMapper {
    static toFeedPostEntity(post: any, mode: FeedMode) {
        const likesCount = post.likes.reduce(
            (sum: number, like: any) => sum + like.weight,
            0,
        )
        const commentsCount = post.comments.length
        const hoursSinceCreated =
            (Date.now() - new Date(post.createdAt).getTime()) / 36_000_00
        const relevanceScore =
            likesCount * 2 + commentsCount * 3 - Math.floor(hoursSinceCreated)
        const tags = post.title.split(" ").filter((word: string) => word.length > 4)

        return new PostEntity(
            post.id,
            post.title,
            post.description,
            post.imageUrl,
            post.createdAt,
            post.updatedAt,
            likesCount,
            commentsCount,
            relevanceScore,
            relevanceScore > 20,
            "feed-service",
            tags,
            {
                likesWeights: post.likes.map((like: any) => like.weight),
                commentLengths: post.comments.map(
                    (comment: any) => comment.content.length,
                ),
                hourOfCreate: new Date(post.createdAt).getHours(),
            },
            mode,
        )
    }

    static toCommentEntity(comment: any, moderation: { blocked: boolean; reason: string }) {
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
