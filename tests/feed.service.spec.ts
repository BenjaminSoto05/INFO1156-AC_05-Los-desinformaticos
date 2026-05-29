import { FeedService } from "@/posts/feed.service"
import { FeedRankingService } from "@/posts/feed-ranking.service"

describe("FeedService unit tests", () => {
    let service: FeedService

    beforeEach(() => {
        service = new FeedService(new FeedRankingService())
    })

    it("builds derived metrics for a feed post", () => {
        const result = service.buildFeedPost(
            {
                id: 1,
                title: "A sample title for feed",
                description: "Some description",
                imageUrl: "https://example.com/post.jpg",
                createdAt: new Date("2026-01-01T00:00:00Z"),
                updatedAt: new Date("2026-01-01T00:00:00Z"),
                likes: [{ weight: 1 }, { weight: 2 }],
                comments: [
                    { content: "First comment" },
                    { content: "Second comment" },
                ],
            },
            "latest",
        )

        expect(result.likesCount).toBe(3)
        expect(result.commentsCount).toBe(2)
        expect(typeof result.relevanceScore).toBe("number")
        expect(result.tags).toEqual(["sample", "title"])
        expect(result.metadata).toEqual(
            expect.objectContaining({
                likesWeights: [1, 2],
                commentLengths: [13, 14],
            }),
        )
    })

    it("returns feed rows ordered by mode through FeedRankingService", () => {
        const rows = service.getFeed(
            [
                {
                    id: 1,
                    title: "Old post",
                    description: "Desc",
                    imageUrl: "https://example.com/old.jpg",
                    createdAt: new Date("2026-01-01T00:00:00Z"),
                    updatedAt: new Date("2026-01-01T00:00:00Z"),
                    likes: [{ weight: 1 }],
                    comments: [],
                },
                {
                    id: 2,
                    title: "New post",
                    description: "Desc",
                    imageUrl: "https://example.com/new.jpg",
                    createdAt: new Date("2026-01-02T00:00:00Z"),
                    updatedAt: new Date("2026-01-02T00:00:00Z"),
                    likes: [{ weight: 1 }, { weight: 1 }],
                    comments: [{ content: "Great" }],
                },
            ],
            "mostLiked",
        )

        expect(rows.mode).toBe("mostLiked")
        expect(rows.rows[0].id).toBe(2)
        expect(rows.rows[1].id).toBe(1)
    })
})
