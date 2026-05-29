import { PostsController } from "@/posts/posts.controller"

describe("PostsController unit tests", () => {
    const postsServiceMock = {
        create: jest.fn(),
        findAll: jest.fn(),
        getFeed: jest.fn(),
        getComments: jest.fn(),
        createComment: jest.fn(),
        addLike: jest.fn(),
    }

    let controller: PostsController

    beforeEach(() => {
        jest.clearAllMocks()
        controller = new PostsController(postsServiceMock as any)
    })

    it("delegates feed requests to PostsService", async () => {
        const expected = { mode: "latest", count: 0, rows: [] }
        postsServiceMock.getFeed.mockResolvedValue(expected)

        const result = await controller.getFeed({ mode: "latest" })

        expect(postsServiceMock.getFeed).toHaveBeenCalledWith({ mode: "latest" })
        expect(result).toBe(expected)
    })

    it("delegates comment creation to PostsService", async () => {
        const expected = { message: "comment_created" }
        postsServiceMock.createComment.mockResolvedValue(expected)

        const result = await controller.createComment(1, { content: "Hola" })

        expect(postsServiceMock.createComment).toHaveBeenCalledWith(1, { content: "Hola" })
        expect(result).toBe(expected)
    })

    it("delegates like creation to PostsService", async () => {
        const expected = { success: true }
        postsServiceMock.addLike.mockResolvedValue(expected)

        const result = await controller.addLike(1, { reactionType: "like", weight: 1 })

        expect(postsServiceMock.addLike).toHaveBeenCalledWith(1, {
            reactionType: "like",
            weight: 1,
        })
        expect(result).toBe(expected)
    })
})
