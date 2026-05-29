interface LikeProps {
    id: number
    postId: number
    createdAt: Date
}

export class LikeEntity {
    public readonly id: number
    public readonly postId: number
    public readonly createdAt: Date

    private constructor(props: LikeProps) {
        this.id = props.id
        this.postId = props.postId
        this.createdAt = props.createdAt
    }

    static create(props: { id: number; postId: number; createdAt?: Date }) {
        return new LikeEntity({
            ...props,
            createdAt: props.createdAt ?? new Date(),
        })
    }
}
