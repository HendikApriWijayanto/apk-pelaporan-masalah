import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: Request) {
  if (req.method === "GET") {
    const data = await prisma.pengaduan.findMany({
      orderBy: { createdAt: "desc" },
    });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ message: "Method not allowed" }),
    { status: 405 }
  );
}
