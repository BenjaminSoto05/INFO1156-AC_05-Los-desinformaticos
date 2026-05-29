import { join } from "node:path"
import { AppModule } from "@/app.module"

import { NestFactory } from "@nestjs/core"
import { NestExpressApplication } from "@nestjs/platform-express"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule)

    app.useStaticAssets(join(process.cwd(), "public"))

    const config = new DocumentBuilder()
        .setTitle("FastAPI NestJS")
        .setDescription("API FastAPI template")
        .setVersion("1.0")
        .build()

    const document = SwaggerModule.createDocument(app, config)

    SwaggerModule.setup("docs", app, document)

    await app.listen(3000, "0.0.0.0")

    console.log("Application running on: http://localhost:3000")
    console.log("Documentation at: http://localhost:3000/docs")
}

bootstrap()
