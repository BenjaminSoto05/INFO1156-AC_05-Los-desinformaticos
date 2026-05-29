import { INestApplication } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { AppModule } from "@/app.module"
import { PrismaService } from "@/prisma/prisma.service"
import request from "supertest"

describe("Posts integration", () => {
    let app: INestApplication
    let prisma: PrismaService

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()

        app = moduleFixture.createNestApplication()
        await app.init()

        prisma = app.get(PrismaService)
    })

    beforeEach(async () => {
        await prisma.like.deleteMany({})
        await prisma.comment.deleteMany({})
        await prisma.post.deleteMany({})
    })

    afterAll(async () => {
        await app.close()
    })

    it("creates and lists posts", async () => {
        const createResponse = await request(app.getHttpServer())
            .post("/api/posts")
            .send({
                title: "Primer post de prueba",
                description: "Descripcion larga para validar flujo completo.",
                imageUrl: "https://example.com/post-1.jpg",
            })
            .expect(201)

        expect(createResponse.body.ok).toBe(true)
        expect(createResponse.body.payload).toEqual(
            expect.objectContaining({
                id: expect.any(Number),
                title: "Primer post de prueba",
            }),
        )

        const listResponse = await request(app.getHttpServer())
            .get("/api/posts")
            .expect(200)

        expect(listResponse.body.total).toBe(1)
        expect(listResponse.body.items).toHaveLength(1)
    })

    it("blocks moderated comments and accepts valid comments", async () => {
        const createResponse = await request(app.getHttpServer())
            .post("/api/posts")
            .send({
                title: "Post para comentarios",
                description: "Descripcion de prueba para comentarios.",
                imageUrl: "https://example.com/post-2.jpg",
            })
            .expect(201)

        const postId = createResponse.body.payload.id

        await request(app.getHttpServer())
            .post(`/api/posts/${postId}/comments`)
            .send({ content: "esto parece spam" })
            .expect(400)

        await request(app.getHttpServer())
            .post(`/api/posts/${postId}/comments`)
            .send({ content: "Comentario normal y valido" })
            .expect(201)

        const commentsResponse = await request(app.getHttpServer())
            .get(`/api/posts/${postId}/comments`)
            .expect(200)

        expect(commentsResponse.body).toHaveLength(1)
        expect(commentsResponse.body[0].content).toBe(
            "Comentario normal y valido",
        )
    })

    it("rejects invalid request bodies via DTO validation", async () => {
        const createResponse = await request(app.getHttpServer())
            .post("/api/posts")
            .send({
                title: "Post de validacion",
                description: "Validacion de cuerpo basada en DTO.",
                imageUrl: "https://example.com/post-validate.jpg",
            })
            .expect(201)

        const postId = createResponse.body.payload.id

        const shortComment = await request(app.getHttpServer())
            .post(`/api/posts/${postId}/comments`)
            .send({ content: "a" })
            .expect(400)

        expect(shortComment.body.ok).toBe(false)
        expect(shortComment.body.error).toBe("Validation failed")
        expect(shortComment.body.details).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ property: "content" }),
            ]),
        )

        const invalidLike = await request(app.getHttpServer())
            .post(`/api/posts/${postId}/likes`)
            .send({ reactionType: "like", weight: 0 })
            .expect(400)

        expect(invalidLike.body.ok).toBe(false)
        expect(invalidLike.body.error).toBe("Validation failed")
        expect(invalidLike.body.details).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ property: "weight" }),
            ]),
        )
    })

    it("orders feed by mostLiked", async () => {
        const firstPost = await request(app.getHttpServer())
            .post("/api/posts")
            .send({
                title: "Post con likes",
                description: "Este post tendra mas likes que el otro.",
                imageUrl: "https://example.com/post-like-a.jpg",
            })
            .expect(201)

        const secondPost = await request(app.getHttpServer())
            .post("/api/posts")
            .send({
                title: "Post con pocos likes",
                description: "Este post tendra menos likes.",
                imageUrl: "https://example.com/post-like-b.jpg",
            })
            .expect(201)

        const firstId = firstPost.body.payload.id
        const secondId = secondPost.body.payload.id

        await request(app.getHttpServer())
            .post(`/api/posts/${firstId}/likes`)
            .send({ reactionType: "like", weight: 2 })
            .expect(201)

        await request(app.getHttpServer())
            .post(`/api/posts/${firstId}/likes`)
            .send({ reactionType: "clap", weight: 1 })
            .expect(201)

        await request(app.getHttpServer())
            .post(`/api/posts/${secondId}/likes`)
            .send({ reactionType: "like", weight: 1 })
            .expect(201)

        const feedResponse = await request(app.getHttpServer())
            .get("/api/posts/feed?mode=mostLiked")
            .expect(200)

        expect(feedResponse.body.mode).toBe("mostLiked")
        expect(feedResponse.body.rows[0].id).toBe(firstId)
        expect(feedResponse.body.rows[0].likesCount).toBe(3)
        expect(feedResponse.body.rows[1].id).toBe(secondId)
    })

    it("returns relevance mode with derived fields", async () => {
        const createResponse = await request(app.getHttpServer())
            .post("/api/posts")
            .send({
                title: "Post relevancia",
                description: "Texto suficiente para validar modo relevance.",
                imageUrl: "https://example.com/post-relevance.jpg",
            })
            .expect(201)

        const postId = createResponse.body.payload.id

        await request(app.getHttpServer())
            .post(`/api/posts/${postId}/likes`)
            .send({ reactionType: "fire", weight: 2 })
            .expect(201)

        const feedResponse = await request(app.getHttpServer())
            .get("/api/posts/feed?mode=relevance")
            .expect(200)

        expect(feedResponse.body.mode).toBe("relevance")
        expect(feedResponse.body.rows[0]).toEqual(
            expect.objectContaining({
                id: postId,
                likesCount: expect.any(Number),
                commentsCount: expect.any(Number),
                relevanceScore: expect.any(Number),
            }),
        )
    })
})
