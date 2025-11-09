import { PrismaClient } from '@prisma/client';

/**
 * Parse mentions from text (e.g., "@John Doe" or "@john@example.com")
 * Returns array of user names/emails mentioned
 */
export function parseMentions(text: string): string[] {
  // Match @mentions - supports "@Name" or "@name@email.com" format
  const mentionRegex = /@([^\s@]+(?:\s+[^\s@]+)*)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const mention = match[1].trim();
    if (mention && !mentions.includes(mention)) {
      mentions.push(mention);
    }
  }

  return mentions;
}

/**
 * Find user IDs from mention strings (names or emails)
 */
export async function findUsersFromMentions(
  mentions: string[],
  organizationId: string,
  prisma: PrismaClient
): Promise<string[]> {
  if (mentions.length === 0) return [];

  // Search for users by name or email
  const users = await prisma.user.findMany({
    where: {
      organizationMemberships: {
        some: {
          organizationId,
        },
      },
      OR: [
        {
          name: {
            in: mentions,
            mode: 'insensitive',
          },
        },
        {
          email: {
            in: mentions,
            mode: 'insensitive',
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  return users.map((user) => user.id);
}

