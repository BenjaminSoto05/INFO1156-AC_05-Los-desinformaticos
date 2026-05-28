import { Injectable } from "@nestjs/common"
import { PostEntity } from "@/posts/entities/post.entity"

export type FeedMode = "latest" | "mostLiked" | "mostCommented" | "relevance"

@Injectable()
export class FeedRankingService {
    sort(posts: PostEntity[], mode: FeedMode) {
        const strategies: Record<FeedMode, (items: PostEntity[]) => PostEntity[]> = {
            latest: this.sortLatest,
            mostLiked: this.sortMostLiked,
            mostCommented: this.sortMostCommented,
            relevance: this.sortByRelevance,
        }

        const sorter = strategies[mode] || this.sortLatest
        return sorter(posts)
    }

    private sortLatest(posts: PostEntity[]) {
        return [...posts].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )
    }

    private sortMostLiked(posts: PostEntity[]) {
        return [...posts].sort((a, b) => b.likesCount - a.likesCount)
    }

    private sortMostCommented(posts: PostEntity[]) {
        return [...posts].sort((a, b) => b.commentsCount - a.commentsCount)
    }

    private sortByRelevance(posts: PostEntity[]) {
        return [...posts].sort((a, b) => b.relevanceScore - a.relevanceScore)
    }
}
