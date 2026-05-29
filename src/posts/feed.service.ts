import { Injectable } from "@nestjs/common"
import {
    FeedItem,
    FeedMode,
    FeedRankingService,
} from "@/posts/feed-ranking.service"

@Injectable()
export class FeedService {
    constructor(private readonly rankingService: FeedRankingService) {}

    buildFeedPost(post: any, mode: FeedMode): FeedItem {
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

        return {
            id: post.id,
            title: post.title,
            description: post.description,
            imageUrl: post.imageUrl,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            likesCount,
            commentsCount,
            relevanceScore,
            isTrending: relevanceScore > 20,
            origin: "feed-service",
            tags,
            metadata: {
                likesWeights: post.likes.map((like: any) => like.weight),
                commentLengths: post.comments.map(
                    (comment: any) => comment.content.length,
                ),
                hourOfCreate: new Date(post.createdAt).getHours(),
            },
            feedMode: mode,
        }
    }

    buildFeedPosts(posts: any[], mode: FeedMode): FeedItem[] {
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
