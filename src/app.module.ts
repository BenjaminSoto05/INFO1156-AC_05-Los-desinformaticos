import { Module } from "@nestjs/common"
import { EventEmitterModule } from "@nestjs/event-emitter"
import { PostsModule } from "@/posts/posts.module"
import { PrismaModule } from "@/prisma/prisma.module"

@Module({
    imports: [
        PrismaModule,
        PostsModule,
        EventEmitterModule.forRoot({
            wildcard: true,
            delimiter: ".",
        }),
    ],
})
export class AppModule {}
