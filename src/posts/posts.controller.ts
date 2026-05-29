import {
    BadRequestException,
    Body,
    Controller,
    Get,
    NotFoundException,
    Param,
    ParseIntPipe,
    Post,
} from "@nestjs/common"
import { PostEntity } from "@/posts/entities/post.entity"
import { legacyModerationAdapter } from "@/posts/legacy-moderation.adapter"
import { PostsService } from "@/posts/posts.service"
import { CreateCommentDto, CreatePostDto } from "@/posts/posts.dtos"

@Controller("api/posts")
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    @Post()
    async create(@Body() body: CreatePostDto) {
        try {
            const created = await this.postsService.create(body)
            return { ok: true, payload: created }
        } catch (e) {
            throw new BadRequestException(e.message)
        }
    }

    @Get()
    async findAll() {
        const posts = await this.postsService.findAll()
        return {
            total: posts.length,
            items: posts,
        }
    }

    @Get(":id")
    async findById(@Param("id", ParseIntPipe) id: number) {
        const post = await this.postsService.findById(id)
        if (!post) {
            throw new NotFoundException("Post not found")
        }
        return post
    }

    @Get(":id/comments")
    async getComments(@Param("id", ParseIntPipe) id: number) {
        const post = await this.postsService.findById(id)
        if (!post) {
            throw new NotFoundException("Post not found")
        }
        return post.comments
    }

    @Post(":id/comments")
    async createComment(
        @Param("id", ParseIntPipe) id: number,
        @Body() body: CreateCommentDto,
    ) {
        const post = await this.postsService.findById(id)
        if (!post) {
            throw new NotFoundException("Post not found")
        }

        const moderation = legacyModerationAdapter.review(body.content)
        if (moderation.status === "BLOCK") {
            throw new BadRequestException(
                moderation.reason ?? "Comment blocked by moderation",
            )
        }

        const comment = await this.postsService.createComment(
            post,
            body.content,
        )
        post.addComment(comment)

        return {
            message: "comment_created",
            entity: comment,
        }
    }

    @Post(":id/likes")
    async addLike(@Param("id", ParseIntPipe) id: number) {
        const post = await this.postsService.findById(id)
        if (!post) {
            throw new NotFoundException("Post not found")
        }

        const like = await this.postsService.addLike(post)
        post.addLike(like)

        return {
            success: true,
            like: like,
        }
    }
}
