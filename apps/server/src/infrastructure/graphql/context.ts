import { prisma } from '@torin/database';
import type { FastifyReply, FastifyRequest } from 'fastify';

export interface Context {
  prisma: typeof prisma;
  request: FastifyRequest;
  reply: FastifyReply;
}

export function createContext(
  request: FastifyRequest,
  reply: FastifyReply
): Context {
  return {
    prisma,
    request,
    reply,
  };
}
