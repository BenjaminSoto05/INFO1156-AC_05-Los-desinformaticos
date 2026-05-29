import { Injectable } from "@nestjs/common"
import { CommentEntity } from "@/posts/entities/comment.entity"
import { LikeEntity } from "@/posts/entities/like.entity"
import { PostEntity } from "@/posts/entities/post.entity"
import { CreatePostDto } from "@/posts/posts.dtos"
import { PrismaService } from "@/prisma/prisma.service"

@Injectable()
export class PostsService {
    constructor(private readonly prisma: PrismaService) {}

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
