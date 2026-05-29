import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common"
import {
    AddLikeDto,
    CreateCommentDto,
    CreatePostDto,
    FeedQueryDto,
} from "@/posts/posts.dtos"
import { PostsMapper } from "@/posts/posts.mapper"
import { FeedMode } from "@/posts/feed-ranking.service"
import { FeedService } from "@/posts/feed.service"
import { ModerationService } from "@/posts/moderation.service"
import { PostsRepository } from "@/posts/posts.repository"

@Injectable()
export class PostsService {
    constructor(
        private readonly repository: PostsRepository,
        private readonly moderationService: ModerationService,
        private readonly feedService: FeedService,
    ) {}

    async create(data: CreatePostDto) {
        const created = await this.repository.createPost(data)

        this.logDomainEvent("post.created", {
            postId: created.id,
            title: created.title,
        })
        this.fakeSendNotification("post", { postId: created.id })
        this.fakeRecomputeSomething(created.id)

        return created
    }

    findAll() {
        return this.repository.findAll()
    }

    findById(id: number) {
        return this.repository.findById(id)
    }

    async getFeed(query: FeedQueryDto) {
        const mode = (query.mode || "latest") as FeedMode
        const posts = await this.repository.findAllWithRelations()

        return this.feedService.getFeed(posts, mode)
    }

    async getComments(postId: number) {
        const post = await this.findById(postId)
        if (!post) {
            throw new NotFoundException({ ok: false, error: "Post not found" })
        }

        const comments = await this.repository.findCommentsByPostId(postId)

        return {
            total_comments: comments.length,
            comments: comments.map((comment) =>
                PostsMapper.toCommentEntity(comment, {
                    blocked: false,
                    reason: "existing",
                }),
            ),
        }
    }

    async createComment(postId: number, data: CreateCommentDto) {
        const post = await this.findById(postId)
        if (!post) {
            throw new NotFoundException("Post not found")
        }


        const moderation = this.moderationService.review(data.content)

        if (moderation.blocked) {
            throw new BadRequestException({ ok: false, error: "Comment blocked by moderation" })
        }

        const created = await this.repository.createComment(
            postId,
            data,
            "controller",
        )

        this.logDomainEvent("comment.created", {
            postId,
            commentId: created.id,
        })
        this.fakeSendNotification("comment", { postId })
        this.fakeRecomputeSomething(postId)

        return {
            message: "comment_created",
            entity: PostsMapper.toCommentEntity(created, moderation),
        }
    }

    async addLike(postId: number, data: AddLikeDto) {
        const post = await this.findById(postId)
        if (!post) {
            throw new NotFoundException({ ok: false, error: "Post not found" })
        }

        const weight = data.weight || 1

        const like = await this.repository.addLike(postId, data, "controller")

        this.logDomainEvent("like.created", { postId, likeId: like.id })
        this.fakeSendNotification("like", {
            postId,
            reactionType: like.reactionType,
        })
        this.fakeRecomputeSomething(postId)

        return {
            success: true,
            like: PostsMapper.toLikeEntity(like),
        }
    }

    private logDomainEvent(eventName: string, payload: Record<string, unknown>) {
        console.log(`[event:${eventName}]`, payload)
    }

    private fakeSendNotification(type: string, payload: Record<string, unknown>) {
        console.log(`[notify:${type}]`, payload)
    }

    private fakeRecomputeSomething(postId: number) {
        console.log(`[recompute] postId=${postId}`)
    }
}
