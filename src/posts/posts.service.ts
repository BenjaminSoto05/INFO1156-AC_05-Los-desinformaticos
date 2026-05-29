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
