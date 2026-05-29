import { Injectable } from "@nestjs/common"
import { AddLikeDto, CreateCommentDto, CreatePostDto } from "@/posts/posts.dtos"
import { PrismaService } from "@/prisma/prisma.service"

@Injectable()
export class PostsService {
    constructor(private readonly prisma: PrismaService) {}

    create(data: CreatePostDto) {
        return this.prisma.post.create({ data })
    }

    findAll() {
        return this.prisma.post.findMany({
            orderBy: { createdAt: "desc" },
        })
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
        return this.prisma.post.findUnique({ where: { id } })
    }

    findCommentsByPostId(postId: number) {
        return this.prisma.comment.findMany({
            where: { postId },
            orderBy: { createdAt: "desc" },
        })
    }

    createComment(postId: number, data: CreateCommentDto) {
        return this.prisma.comment.create({
            data: {
                postId,
                content: data.content,
                source: "service",
            },
        })
    }

    addLike(postId: number, data: AddLikeDto) {
        return this.prisma.like.create({
            data: {
                postId,
                reactionType: data.reactionType || "like",
                weight: data.weight || 1,
                source: "service",
            },
        })
    }
}
