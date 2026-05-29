import { BadRequestException, Injectable } from "@nestjs/common"
import { CommentEntity } from "@/posts/entities/comment.entity"
import { LikeEntity } from "@/posts/entities/like.entity"
import { PostEntity } from "@/posts/entities/post.entity"
import { legacyModerationApi } from "@/posts/legacy-moderation.client"
import { AddLikeDto, CreateCommentDto, CreatePostDto } from "@/posts/posts.dtos"
import { PrismaService } from "@/prisma/prisma.service"

const logDomainEvent = (
    eventName: string,
    payload: Record<string, unknown>,
) => {
    console.log(`[event:${eventName}]`, payload)
}

const fakeSendNotification = (
    type: string,
    payload: Record<string, unknown>,
) => {
    console.log(`[notify:${type}]`, payload)
}

const fakeRecomputeSomething = (postId: number) => {
    console.log(`[recompute] postId=${postId}`)
}

@Injectable()
export class PostsService {
    constructor(
        private readonly repository: PostsRepository,
        private readonly moderationService: ModerationService,
        private readonly rankingService: FeedRankingService,
    ) {}

    async createPost(data: CreatePostDto) {
        if (data.title.length < 3 || data.title.length > 120) {
            throw new BadRequestException(
                "Title length must be between 3 and 120",
            )
        }

        if (!data.imageUrl.startsWith("http")) {
            throw new BadRequestException("Image URL must start with http")
        }

        const created = await this.prisma.post.create({ data })

        logDomainEvent("post.created", {
            postId: created.id,
            title: created.title,
        })
        fakeSendNotification("post", { postId: created.id })
        fakeRecomputeSomething(created.id)

        return created
    }

    findAll() {
        return this.repository.findAll()
    }

    findAllWithRelations() {
        return this.prisma.post.findMany({
            include: {
                comments: true,
                likes: true,
            },
        })
    }

    findById(id: number) {
        return this.repository.findById(id)
    }

    async getFeed(query: FeedQueryDto) {
        const mode = (query.mode || "latest") as FeedMode
        const posts = await this.repository.findAllWithRelations()

        const mappedPosts = posts.map((post) =>
            PostsMapper.toFeedPostEntity(post, mode),
        )

        return {
            mode,
            count: mappedPosts.length,
            rows: this.rankingService.sort(mappedPosts, mode),
        }
    }

    async getFeed(mode: string) {
        const posts = await this.prisma.post.findMany({
            include: {
                comments: true,
                likes: true,
            },
        })

        const mappedPosts = posts.map((post) => {
            const likesCount = post.likes.reduce(
                (sum, like) => sum + like.weight,
                0,
            )
            const commentsCount = post.comments.length
            // 36_000_00 = 1 hora en milisegundos.
            const hoursSinceCreated =
                (Date.now() - new Date(post.createdAt).getTime()) / 36_000_00
            const relevanceScore =
                likesCount * 2 +
                commentsCount * 3 -
                Math.floor(hoursSinceCreated)

            const tags = post.title.split(" ").filter((word) => word.length > 4)
            const metadata = {
                likesWeights: post.likes.map((like) => like.weight),
                commentLengths: post.comments.map(
                    (comment) => comment.content.length,
                ),
                hourOfCreate: new Date(post.createdAt).getHours(),
            }

            return new PostEntity(
                post.id,
                post.title,
                post.description,
                post.imageUrl,
                post.createdAt,
                post.updatedAt,
                likesCount,
                commentsCount,
                relevanceScore,
                relevanceScore > 20,
                "feed-controller",
                tags,
                metadata,
                mode,
            )
        })

        return this.sortPosts(mappedPosts, mode)
    }

    private sortPosts(posts: PostEntity[], mode: string): PostEntity[] {
        const sorted = [...posts]

        // Ranking inline por modo
        // Esto define la forma de ordenar en base al filtro
        switch (mode) {
            case "latest":
                return sorted.sort(
                    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
                )
            case "mostLiked":
                return sorted.sort((a, b) => b.likesCount - a.likesCount)
            case "mostCommented":
                return sorted.sort((a, b) => b.commentsCount - a.commentsCount)
            case "relevance":
                return sorted.sort(
                    (a, b) => b.relevanceScore - a.relevanceScore,
                )
            default:
                return sorted.sort(
                    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
                )
        }
    }

    async getCommentsByPostId(postId: number) {
        const comments = await this.prisma.comment.findMany({
            where: { postId },
            orderBy: { createdAt: "desc" },
        })

        return comments.map(
            (comment) =>
                new CommentEntity(
                    comment.id,
                    comment.postId,
                    comment.content,
                    comment.createdAt,
                    comment.updatedAt,
                    comment.source,
                    "approved",
                    comment.content.length > 80 ? 70 : 45,
                    comment.content.length % 2 === 0,
                    "es",
                    { chars: comment.content.length, source: comment.source },
                ),
        )
    }

    async createComment(postId: number, data: CreateCommentDto) {
        if (data.content.length < 2) {
            throw new BadRequestException("Comment too short")
        }

        // Cliente legacy: devuelve tipos mixtos (string/number/object).
        const moderation = legacyModerationApi.review(data.content)

        let blocked = false

        if (moderation === "BLOCK") {
            blocked = true
        } else if (typeof moderation === "number") {
            blocked = moderation < 1
        } else if (typeof moderation === "object") {
            blocked = !("pass" in moderation && moderation.pass)
        } else if (moderation === "OK") {
            blocked = false
        }

        if (blocked) {
            throw new BadRequestException("Comment blocked by moderation")
        }

        // Se persiste la información en la base de datos
        const created = await this.prisma.comment.create({
            data: {
                postId,
                content: data.content,
                source: "service",
            },
        })

        const entity = new CommentEntity(
            created.id,
            created.postId,
            created.content,
            created.createdAt,
            created.updatedAt,
            created.source,
            "approved",
            created.content.length > 60 ? 80 : 40,
            false,
            "es",
            { moderation, source: "legacy" },
        )

        logDomainEvent("comment.created", { postId, commentId: created.id })
        fakeSendNotification("comment", { postId })
        fakeRecomputeSomething(postId)

        return entity
    }

    async addLike(postId: number, data: AddLikeDto) {
        const reactionType = data.reactionType || "like"
        const weight = data.weight || 1

        if (weight < 1) {
            throw new BadRequestException("Weight must be at least 1")
        }

        const like = await this.prisma.like.create({
            data: {
                postId,
                reactionType,
                weight,
                source: "service",
            },
        })

        const entity = new LikeEntity(
            like.id,
            like.postId,
            like.reactionType,
            like.weight,
            like.source,
            like.createdAt,
            like.weight > 2 ? "strong" : "normal",
            true,
            { from: "manual", r: like.reactionType },
        )

        logDomainEvent("like.created", { postId, likeId: like.id })
        fakeSendNotification("like", { postId, reactionType })
        fakeRecomputeSomething(postId)

        return entity
    }
}
