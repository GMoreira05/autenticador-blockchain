import { FastifyPluginAsync } from "fastify";
import { blockchainService } from "../../blockchain/blockchain.service.js";

export const statsRoutes: FastifyPluginAsync = async (server) => {
  server.get("/", async (request, reply) => {
    const [totalDocs, activeDocs, revokedDocs, institutionsCount, recentDocs] = await Promise.all([
      server.prisma.documentRecord.count(),
      server.prisma.documentRecord.count({ where: { status: "ACTIVE" } }),
      server.prisma.documentRecord.count({ where: { status: "REVOKED" } }),
      server.prisma.institution.count(),
      server.prisma.documentRecord.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          documentHash: true,
          studentName: true,
          studentId: true,
          documentType: true,
          status: true,
          createdAt: true,
          blockNumber: true,
          blockchainTxHash: true,
          institution: {
            select: { name: true },
          },
        },
      }),
    ]);

    const network = await blockchainService.getNetworkInfo();

    return reply.send({
      stats: {
        totalDocuments: totalDocs,
        activeDocuments: activeDocs,
        revokedDocuments: revokedDocs,
        institutions: institutionsCount,
      },
      blockchain: network,
      recentDocuments: recentDocs,
    });
  });
};
