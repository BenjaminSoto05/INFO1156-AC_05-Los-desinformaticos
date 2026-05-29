import { Injectable } from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import { AddLikeDto, CreateCommentDto, CreatePostDto } from "@/posts/posts.dtos"

@Injectable()
export class PostsRepository {
    constructor(private readonly prisma: PrismaService) {}

    createPost(data: CreatePostDto) {
        return this.prisma.post.create({ data })
    }

    findAll() {
        return this.prisma.post.findMany({
            orderBy: { createdAt: "desc" },
        })
    }

    findById(id: number) {
        return this.prisma.post.findUnique({ where: { id } })
    }

    findByIdWithRelations(id: number) {
        return this.prisma.post.findUnique({
            where: { id },
            include: {
                comments: true,
                likes: true,
            },
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

    findCommentsByPostId(postId: number) {
        return this.prisma.comment.findMany({
            where: { postId },
            orderBy: { createdAt: "desc" },
        })
    }

    createComment(postId: number, data: CreateCommentDto, source = "service") {
        return this.prisma.comment.create({
            data: {
                postId,
                content: data.content,
                source,
            },
        })
    }

    addLike(postId: number, data: AddLikeDto, source = "service") {
        return this.prisma.like.create({
            data: {
                postId,
                reactionType: data.reactionType || "like",
                weight: data.weight || 1,
                source,
            },
        })
    }
}
