import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common"
import { AddLikeDto, CreateCommentDto, CreatePostDto } from "@/posts/posts.dtos"
import { CommentEntity } from "@/posts/entities/comment.entity"
import { LikeEntity } from "@/posts/entities/like.entity"
import { PostEntity } from "@/posts/entities/post.entity"
import { legacyModerationApi } from "@/posts/legacy-moderation.client"
import { PrismaService } from "@/prisma/prisma.service"

type FeedMode = "latest" | "mostLiked" | "mostCommented" | "relevance"

@Injectable()
export class PostsService {
    constructor(private readonly prisma: PrismaService) {}

    async createPost(data: CreatePostDto) {
        this.validatePostPayload(data)

        const created = await this.prisma.post.create({ data })
        this.publishDomainEvent("post.created", {
            postId: created.id,
            title: created.title,
        })
        this.dispatchNotification("post", { postId: created.id })
        this.recomputeDerivedState(created.id)

        return created
    }

    async findAll() {
        return this.prisma.post.findMany({
            orderBy: { createdAt: "desc" },
        })
    }

    async findById(id: number) {
        return this.prisma.post.findUnique({ where: { id } })
    }

    async getFeed(mode: string = "latest") {
        const posts = await this.prisma.post.findMany({
            include: {
                comments: true,
                likes: true,
            },
        })

        const normalizedMode = this.normalizeFeedMode(mode)
        const entities = posts.map((post) => this.mapToPostEntity(post, normalizedMode))
        const comparator = this.getFeedComparator(normalizedMode)

        return entities.sort(comparator)
    }

    async getComments(postId: number) {
        const post = await this.findById(postId)
        if (!post) {
            throw new NotFoundException("Post not found")
        }

        const comments = await this.prisma.comment.findMany({
            where: { postId },
            orderBy: { createdAt: "desc" },
        })

        return comments.map((comment) =>
            this.mapToCommentEntity(comment, legacyModerationApi.review(comment.content)),
        )
    }

    async createComment(postId: number, data: CreateCommentDto) {
        const post = await this.findById(postId)
        if (!post) {
            throw new NotFoundException("Post not found")
        }

        if (data.content.length < 2) {
            throw new BadRequestException("Comment too short")
        }

        const moderation = legacyModerationApi.review(data.content)
        if (this.isBlockedByModeration(moderation)) {
            throw new BadRequestException("Comment blocked by moderation")
        }

        const created = await this.prisma.comment.create({
            data: {
                postId,
                content: data.content,
                source: "service",
            },
        })

        this.publishDomainEvent("comment.created", {
            postId,
            commentId: created.id,
        })
        this.dispatchNotification("comment", { postId })
        this.recomputeDerivedState(postId)

        return this.mapToCommentEntity(created, moderation)
    }

    async addLike(postId: number, data: AddLikeDto) {
        const post = await this.findById(postId)
        if (!post) {
            throw new NotFoundException("Post not found")
        }

        const reactionType = data.reactionType || "like"
        const weight = data.weight || 1

        if (weight < 1) {
            throw new BadRequestException("Weight must be at least 1")
        }

        const created = await this.prisma.like.create({
            data: {
                postId,
                reactionType,
                weight,
                source: "service",
            },
        })

        this.publishDomainEvent("like.created", {
            postId,
            likeId: created.id,
        })
        this.dispatchNotification("like", {
            postId,
            reactionType,
        })
        this.recomputeDerivedState(postId)

        return this.mapToLikeEntity(created)
    }

    private validatePostPayload(data: CreatePostDto) {
        if (data.title.length < 3 || data.title.length > 120) {
            throw new BadRequestException("Title length must be between 3 and 120")
        }

        if (!data.imageUrl.startsWith("http")) {
            throw new BadRequestException("Image URL must start with http")
        }
    }

    private normalizeFeedMode(mode: string): FeedMode {
        const candidate = mode as FeedMode
        if (["latest", "mostLiked", "mostCommented", "relevance"].includes(candidate)) {
            return candidate
        }

        return "latest"
    }

    private getFeedComparator(mode: FeedMode) {
        switch (mode) {
            case "mostLiked":
                return (a: PostEntity, b: PostEntity) => b.likesCount - a.likesCount
            case "mostCommented":
                return (a: PostEntity, b: PostEntity) => b.commentsCount - a.commentsCount
            case "relevance":
                return (a: PostEntity, b: PostEntity) => b.relevanceScore - a.relevanceScore
            case "latest":
            default:
                return (a: PostEntity, b: PostEntity) => b.createdAt.getTime() - a.createdAt.getTime()
        }
    }

    private mapToPostEntity(post: any, mode: FeedMode) {
        const likesCount = post.likes.reduce((sum: number, like: any) => sum + like.weight, 0)
        const commentsCount = post.comments.length
        const hoursSinceCreated =
            (Date.now() - new Date(post.createdAt).getTime()) / 36_000_00
        const relevanceScore = likesCount * 2 + commentsCount * 3 - Math.floor(hoursSinceCreated)
        const tags = post.title.split(" ").filter((word: string) => word.length > 4)
        const metadata = {
            likesWeights: post.likes.map((like: any) => like.weight),
            commentLengths: post.comments.map((comment: any) => comment.content.length),
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
            "service",
            tags,
            metadata,
            mode,
        )
    }

    private mapToCommentEntity(comment: any, moderation: unknown) {
        return new CommentEntity(
            comment.id,
            comment.postId,
            comment.content,
            comment.createdAt,
            comment.updatedAt,
            comment.source,
            "approved",
            comment.content.length > 60 ? 80 : 40,
            false,
            "es",
            { moderation, source: "legacy" },
        )
    }

    private mapToLikeEntity(like: any) {
        return new LikeEntity(
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
    }

    private isBlockedByModeration(result: unknown) {
        if (result === "BLOCK") {
            return true
        }
        if (typeof result === "number") {
            return result < 1
        }
        if (typeof result === "object" && result !== null) {
            return !("pass" in result && (result as any).pass)
        }
        return false
    }

    private publishDomainEvent(eventName: string, payload: Record<string, unknown>) {
        console.log(`[event:${eventName}]`, payload)
    }

    private dispatchNotification(type: string, payload: Record<string, unknown>) {
        console.log(`[notify:${type}]`, payload)
    }

    private recomputeDerivedState(postId: number) {
        console.log(`[recompute] postId=${postId}`)
    }
}
