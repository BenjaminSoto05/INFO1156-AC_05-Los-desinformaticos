import { Injectable } from "@nestjs/common"
import { AddLikeDto, CreateCommentDto, CreatePostDto } from "@/posts/posts.dtos"
import { PostsRepository } from "@/posts/posts.repository"
import { FeedService } from "@/posts/feed.service"
import { FeedMode } from "@/posts/feed-ranking.service"
import { PostEntity } from "@/posts/entities/post.entity"
import { CommentEntity } from "@/posts/entities/comment.entity"
import { LikeEntity } from "@/posts/entities/like.entity"

@Injectable()
export class PostsService {
    constructor(
        private readonly repository: PostsRepository,
        private readonly feedService: FeedService,
    ) {}

    async create(data: CreatePostDto) {
        const post = await this.repository.createPost(data)
        return PostEntity.create(post)
    }

    async findAll() {
        const posts = await this.repository.findAll()
        return posts.map((post) => PostEntity.create(post))
    }

    async findById(id: number) {
        const post = await this.repository.findByIdWithRelations(id)
        if (!post) return null

        return PostEntity.create({
            ...post,
            comments: post.comments.map((c) => CommentEntity.create(c)),
            likes: post.likes.map((l) => LikeEntity.create(l)),
        })
    }

    async createComment(post: PostEntity, content: string) {
        const created = await this.repository.createComment(post.id, {
            content,
        } as CreateCommentDto)
        return CommentEntity.create(created)
    }

    async addLike(post: PostEntity, data?: AddLikeDto) {
        const created = await this.repository.addLike(
            post.id,
            data ?? ({} as AddLikeDto),
        )
        return LikeEntity.create(created)
    }

    async getFeed(mode: string) {
        const posts = await this.repository.findAllWithRelations()
        return this.feedService.getFeed(posts, mode as FeedMode)
    }
}
