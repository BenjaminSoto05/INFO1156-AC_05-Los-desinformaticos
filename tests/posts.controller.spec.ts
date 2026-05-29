import { PostsController } from "@/posts/posts.controller"

describe("PostsController unit tests", () => {
    const postsServiceMock = {
        create: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        getFeed: jest.fn(),
        createComment: jest.fn(),
        addLike: jest.fn(),
    }

    const eventEmitterMock = {
        emit: jest.fn(),
    }

    let controller: PostsController

    beforeEach(() => {
        jest.clearAllMocks()
        controller = new PostsController(
            postsServiceMock as any,
            eventEmitterMock as any,
        )
    })

    it("delegates feed requests to PostsService", async () => {
        const expected = { mode: "latest", count: 0, rows: [] }
        postsServiceMock.getFeed.mockResolvedValue(expected)

        const result = await controller.getFeed({ mode: "latest" })

        expect(postsServiceMock.getFeed).toHaveBeenCalledWith("latest")
        expect(result).toBe(expected)
    })

    it("delegates findAll to PostsService", async () => {
        const posts = [{ id: 1 }]
        postsServiceMock.findAll.mockResolvedValue(posts)

        const result = await controller.findAll()

        expect(postsServiceMock.findAll).toHaveBeenCalled()
        expect(result).toEqual({ total: 1, items: posts })
    })
})
