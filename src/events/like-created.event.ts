export class LikeCreatedEvent {
    constructor(
        public readonly postId: number,
        public readonly likeId: number,
    ) {}
}
