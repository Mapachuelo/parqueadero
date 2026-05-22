import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: number; role: string };
    user: {
      sub: number;
      role: string;
      id: number;
      username: string;
    };
  }
}
