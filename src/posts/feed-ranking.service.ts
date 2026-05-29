import { Injectable } from "@nestjs/common"

export type FeedMode = "latest" | "mostLiked" | "mostCommented" | "relevance"

export interface FeedItem {
    id: number
    title: string
    description: string
    imageUrl: string
    createdAt: Date
    updatedAt: Date
    likesCount: number
    commentsCount: number
    relevanceScore: number
    isTrending: boolean
    origin: string
    tags: string[]
    metadata: Record<string, unknown>
    feedMode: string
}

@Injectable()
export class FeedRankingService {
    sort(posts: FeedItem[], mode: FeedMode): FeedItem[] {
        const strategies: Record<FeedMode, (items: FeedItem[]) => FeedItem[]> =
            {
                latest: this.sortLatest,
                mostLiked: this.sortMostLiked,
                mostCommented: this.sortMostCommented,
                relevance: this.sortByRelevance,
            }

        const sorter = strategies[mode] || this.sortLatest
        return sorter(posts)
    }

    private sortLatest(posts: FeedItem[]) {
        return [...posts].sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
        )
    }

    private sortMostLiked(posts: FeedItem[]) {
        return [...posts].sort((a, b) => b.likesCount - a.likesCount)
    }

    private sortMostCommented(posts: FeedItem[]) {
        return [...posts].sort((a, b) => b.commentsCount - a.commentsCount)
    }

    private sortByRelevance(posts: FeedItem[]) {
        return [...posts].sort((a, b) => b.relevanceScore - a.relevanceScore)
    }
}
