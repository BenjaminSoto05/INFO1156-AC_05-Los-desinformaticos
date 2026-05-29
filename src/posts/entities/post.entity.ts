import { CommentEntity } from "./comment.entity"
import { LikeEntity } from "./like.entity"

interface PostProps {
    id: number
    title: string
    description: string
    imageUrl: string
    createdAt: Date
    updatedAt: Date
    comments: CommentEntity[]
    likes: LikeEntity[]
}

export class PostEntity {
    public readonly id: number
    public readonly title: string
    public readonly description: string
    public readonly imageUrl: string
    public readonly createdAt: Date
    public readonly updatedAt: Date

    private _comments: CommentEntity[]
    private _likes: LikeEntity[]

    private constructor(props: PostProps) {
        this.id = props.id
        this.title = props.title
        this.description = props.description
        this.imageUrl = props.imageUrl
        this.createdAt = props.createdAt
        this.updatedAt = props.updatedAt
        this._comments = props.comments
        this._likes = props.likes
    }

    static create(props: {
        id: number
        title: string
        description: string
        imageUrl: string
        createdAt?: Date
        updatedAt?: Date
        comments?: CommentEntity[]
        likes?: LikeEntity[]
    }) {
        if (props.title.length < 3 || props.title.length > 120) {
            throw new Error("Title length must be between 3 and 120")
        }

        if (!props.imageUrl.startsWith("http")) {
            throw new Error("Image URL must start with http")
        }

        return new PostEntity({
            id: props.id,
            title: props.title,
            description: props.description,
            imageUrl: props.imageUrl,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
            comments: props.comments ?? [],
            likes: props.likes ?? [],
        })
    }

    get comments(): readonly CommentEntity[] {
        return this._comments
    }

    get likes(): readonly LikeEntity[] {
        return this._likes
    }

    addComment(comment: CommentEntity) {
        this._comments.push(comment)
    }

    addLike(like: LikeEntity) {
        this._likes.push(like)
    }
}
