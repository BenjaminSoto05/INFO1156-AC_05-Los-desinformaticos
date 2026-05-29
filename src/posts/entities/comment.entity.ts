interface CommentProps {
    id: number
    postId: number
    content: string
    createdAt: Date
    updatedAt: Date
}

export class CommentEntity {
    public readonly id: number
    public readonly postId: number
    public readonly content: string
    public readonly createdAt: Date
    public readonly updatedAt: Date

    private constructor(props: CommentProps) {
        this.id = props.id
        this.postId = props.postId
        this.content = props.content
        this.createdAt = props.createdAt
        this.updatedAt = props.updatedAt
    }

    static create(props: {
        id: number
        postId: number
        content: string
        createdAt?: Date
        updatedAt?: Date
    }) {
        return new CommentEntity({
            ...props,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        })
    }
}
