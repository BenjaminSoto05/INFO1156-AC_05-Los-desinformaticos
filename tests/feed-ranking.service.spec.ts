import { FeedRankingService, FeedMode } from "@/posts/feed-ranking.service"
import { PostEntity } from "@/posts/entities/post.entity"

describe("FeedRankingService unit tests", () => {
    let service: FeedRankingService

    beforeEach(() => {
        service = new FeedRankingService()
    })

    const baseEntity = (overrides: Partial<PostEntity> = {}) =>
        new PostEntity(
            overrides.id ?? 1,
            overrides.title ?? "Title",
            overrides.description ?? "Description",
            overrides.imageUrl ?? "https://example.com/image.jpg",
            overrides.createdAt ?? new Date("2026-01-01T00:00:00Z"),
            overrides.updatedAt ?? new Date("2026-01-01T00:00:00Z"),
            overrides.likesCount ?? 0,
            overrides.commentsCount ?? 0,
            overrides.relevanceScore ?? 0,
            overrides.isFeatured ?? false,
            overrides.source ?? "test",
            overrides.tags ?? [],
            overrides.metadata ?? {},
            overrides.rankingMode ?? "latest",
        )

    it("sorts by latest when mode is latest", () => {
        const older = baseEntity({ id: 1, createdAt: new Date("2026-01-01T00:00:00Z") })
        const newer = baseEntity({ id: 2, createdAt: new Date("2026-01-02T00:00:00Z") })

        const sorted = service.sort([older, newer], "latest")

        expect(sorted.map((item) => item.id)).toEqual([2, 1])
    })

    it("sorts by likesCount when mode is mostLiked", () => {
        const low = baseEntity({ id: 1, likesCount: 1 })
        const high = baseEntity({ id: 2, likesCount: 5 })

        const sorted = service.sort([low, high], "mostLiked")

        expect(sorted.map((item) => item.id)).toEqual([2, 1])
    })

    it("sorts by commentsCount when mode is mostCommented", () => {
        const low = baseEntity({ id: 1, commentsCount: 1 })
        const high = baseEntity({ id: 2, commentsCount: 4 })

        const sorted = service.sort([low, high], "mostCommented")

        expect(sorted.map((item) => item.id)).toEqual([2, 1])
    })

    it("sorts by relevanceScore when mode is relevance", () => {
        const low = baseEntity({ id: 1, relevanceScore: 10 })
        const high = baseEntity({ id: 2, relevanceScore: 20 })

        const sorted = service.sort([low, high], "relevance")

        expect(sorted.map((item) => item.id)).toEqual([2, 1])
    })
})
