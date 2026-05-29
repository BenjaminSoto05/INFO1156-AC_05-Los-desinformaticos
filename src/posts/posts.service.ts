import { Injectable } from "@nestjs/common"
import { CommentEntity } from "@/posts/entities/comment.entity"
import { LikeEntity } from "@/posts/entities/like.entity"
import { PostEntity } from "@/posts/entities/post.entity"
import { CreatePostDto } from "@/posts/posts.dtos"
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

    async create(data: CreatePostDto) {
        const post = await this.prisma.post.create({ data })
        return PostEntity.create(post)
    }

    async findAll() {
        const posts = await this.prisma.post.findMany({
            orderBy: { createdAt: "desc" },
            include: { comments: true, likes: true },
        })

        return posts.map((p) =>
            PostEntity.create({
                ...p,
                comments: p.comments.map((c) => CommentEntity.create(c)),
                likes: p.likes.map((l) => LikeEntity.create(l)),
            }),
        )
    }

    async findById(id: number) {
        const post = await this.prisma.post.findUnique({
            where: { id },
            include: { comments: true, likes: true },
        })

        if (!post) {
            return null
        }

        return PostEntity.create({
            ...post,
            comments: post.comments.map((c) => CommentEntity.create(c)),
            likes: post.likes.map((l) => LikeEntity.create(l)),
        })
    }

    async createComment(post: PostEntity, content: string) {
        const comment = await this.prisma.comment.create({
            data: {
                postId: post.id,
                content: content,
            },
        })

        return CommentEntity.create(comment)
    }

    async addLike(post: PostEntity) {
        const like = await this.prisma.like.create({
            data: {
                postId: post.id,
            },
        })

        return LikeEntity.create(like)
    }
}
