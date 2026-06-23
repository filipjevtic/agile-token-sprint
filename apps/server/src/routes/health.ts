import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function registerHealthRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/", async () => {
    return { status: "ok" };
  });
}
