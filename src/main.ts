import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configSwagger = new DocumentBuilder()
    .setTitle("LinkedIn Clone API")
    .setDescription("The LinkedIn Clone API description")
    .setVersion("1.0")
    .addTag("LinkedIn Clone")
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup("api", app, documentFactory, {
    swaggerOptions: {
      withCredentials: true,
      persistAuthorization: true,
    },
  });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
