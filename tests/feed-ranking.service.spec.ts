import { FeedRankingService, FeedItem } from "@/posts/feed-ranking.service"

describe("FeedRankingService unit tests", () => {
    let service: FeedRankingService

    beforeEach(() => {
        service = new FeedRankingService()
    })

    const baseItem = (overrides: Partial<FeedItem> = {}): FeedItem => ({
        id: overrides.id ?? 1,
        title: overrides.title ?? "Title",
        description: overrides.description ?? "Description",
        imageUrl: overrides.imageUrl ?? "https://example.com/image.jpg",
        createdAt: overrides.createdAt ?? new Date("2026-01-01T00:00:00Z"),
        updatedAt: overrides.updatedAt ?? new Date("2026-01-01T00:00:00Z"),
        likesCount: overrides.likesCount ?? 0,
        commentsCount: overrides.commentsCount ?? 0,
        relevanceScore: overrides.relevanceScore ?? 0,
        isTrending: overrides.isTrending ?? false,
        origin: overrides.origin ?? "test",
        tags: overrides.tags ?? [],
        metadata: overrides.metadata ?? {},
        feedMode: overrides.feedMode ?? "latest",
    })

    it("sorts by latest when mode is latest", () => {
        const older = baseItem({
            id: 1,
            createdAt: new Date("2026-01-01T00:00:00Z"),
        })
        const newer = baseItem({
            id: 2,
            createdAt: new Date("2026-01-02T00:00:00Z"),
        })

        const sorted = service.sort([older, newer], "latest")

        expect(sorted.map((item) => item.id)).toEqual([2, 1])
    })

    it("sorts by likesCount when mode is mostLiked", () => {
        const low = baseItem({ id: 1, likesCount: 1 })
        const high = baseItem({ id: 2, likesCount: 5 })

        const sorted = service.sort([low, high], "mostLiked")

        expect(sorted.map((item) => item.id)).toEqual([2, 1])
    })

    it("sorts by commentsCount when mode is mostCommented", () => {
        const low = baseItem({ id: 1, commentsCount: 1 })
        const high = baseItem({ id: 2, commentsCount: 4 })

        const sorted = service.sort([low, high], "mostCommented")

        expect(sorted.map((item) => item.id)).toEqual([2, 1])
    })

    it("sorts by relevanceScore when mode is relevance", () => {
        const low = baseItem({ id: 1, relevanceScore: 10 })
        const high = baseItem({ id: 2, relevanceScore: 20 })

        const sorted = service.sort([low, high], "relevance")

        expect(sorted.map((item) => item.id)).toEqual([2, 1])
    })
})
