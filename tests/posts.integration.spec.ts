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
})
