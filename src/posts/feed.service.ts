import { Injectable } from "@nestjs/common"
import { FeedMode, FeedRankingService } from "@/posts/feed-ranking.service"
import { PostEntity } from "@/posts/entities/post.entity"

@Injectable()
export class FeedService {
    constructor(private readonly rankingService: FeedRankingService) {}

    buildFeedPost(post: any, mode: FeedMode) {
        const likesCount = post.likes.reduce(
            (sum: number, like: any) => sum + like.weight,
            0,
        )
        const commentsCount = post.comments.length
        const hoursSinceCreated =
            (Date.now() - new Date(post.createdAt).getTime()) / 36_000_00
        const relevanceScore =
            likesCount * 2 + commentsCount * 3 - Math.floor(hoursSinceCreated)
        const tags = post.title
            .split(" ")
            .filter((word: string) => word.length > 4)

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

    buildFeedPosts(posts: any[], mode: FeedMode) {
        return posts.map((post) => this.buildFeedPost(post, mode))
    }

    getFeed(posts: any[], mode: FeedMode) {
        const rows = this.buildFeedPosts(posts, mode)

        return {
            mode,
            count: rows.length,
            rows: this.rankingService.sort(rows, mode),
        }
    }
}
