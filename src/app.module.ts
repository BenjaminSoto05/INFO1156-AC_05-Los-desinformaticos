import { BadRequestException, Module, ValidationPipe } from "@nestjs/common"
import { APP_PIPE } from "@nestjs/core"
import { EventEmitterModule } from "@nestjs/event-emitter"
import { PostsModule } from "@/posts/posts.module"
import { PrismaModule } from "@/prisma/prisma.module"

@Module({
    imports: [EventEmitterModule.forRoot(), PrismaModule, PostsModule],
    providers: [
        {
            provide: APP_PIPE,
            useValue: new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
                exceptionFactory: (errors) => {
                    const details = errors.map((e) => ({
                        property: e.property,
                        constraints: e.constraints,
                    }))

                    return new BadRequestException({
                        ok: false,
                        error: "Validation failed",
                        details,
                    })
                },
            }),
        },
    ],
})
export class AppModule {}
