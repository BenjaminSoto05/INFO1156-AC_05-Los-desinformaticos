export class CommentCreatedEvent {
    constructor(
        public readonly postId: number,
        public readonly commentId: number,
    ) {}
}
