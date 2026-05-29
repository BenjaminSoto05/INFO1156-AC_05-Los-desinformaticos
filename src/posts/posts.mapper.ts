import { CommentEntity } from "@/posts/entities/comment.entity"
import { LikeEntity } from "@/posts/entities/like.entity"

export class PostsMapper {
    static toCommentEntity(comment: any) {
        return CommentEntity.create({
            id: comment.id,
            postId: comment.postId,
            content: comment.content,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
        })
    }

    static toLikeEntity(like: any) {
        return LikeEntity.create({
            id: like.id,
            postId: like.postId,
            createdAt: like.createdAt,
        })
    }
}
