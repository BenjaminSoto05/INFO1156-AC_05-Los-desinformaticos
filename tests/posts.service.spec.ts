import { PostsService } from "@/posts/posts.service"

describe("PostsService unit tests", () => {
    const repositoryMock = {
        findAllWithRelations: jest.fn(),
    }
    const feedServiceMock = {
        getFeed: jest.fn(),
    }

    let service: PostsService

    beforeEach(() => {
        jest.clearAllMocks()
        service = new PostsService(
            repositoryMock as any,
            feedServiceMock as any,
        )
    })

    it("delegates feed creation and ordering to FeedService", async () => {
        const posts = [
            {
                id: 1,
                title: "Post 1",
                description: "desc",
                imageUrl: "https://example.com/1",
                createdAt: new Date(),
                updatedAt: new Date(),
                likes: [],
                comments: [],
            },
        ]
        repositoryMock.findAllWithRelations.mockResolvedValue(posts)
        feedServiceMock.getFeed.mockReturnValue({
            mode: "latest",
            count: 1,
            rows: [],
        })

        const result = await service.getFeed("latest")

        expect(repositoryMock.findAllWithRelations).toHaveBeenCalled()
        expect(feedServiceMock.getFeed).toHaveBeenCalledWith(posts, "latest")
        expect(result).toEqual({ mode: "latest", count: 1, rows: [] })
    })

    it("uses the mode string directly for feed", async () => {
        const posts = [
            {
                id: 2,
                title: "Post 2",
                description: "desc",
                imageUrl: "https://example.com/2",
                createdAt: new Date(),
                updatedAt: new Date(),
                likes: [],
                comments: [],
            },
        ]
        repositoryMock.findAllWithRelations.mockResolvedValue(posts)
        feedServiceMock.getFeed.mockReturnValue({
            mode: "latest",
            count: 1,
            rows: [],
        })

        const result = await service.getFeed("latest")

        expect(feedServiceMock.getFeed).toHaveBeenCalledWith(posts, "latest")
        expect(result.mode).toBe("latest")
    })
})
