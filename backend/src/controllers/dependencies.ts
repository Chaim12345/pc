import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const dependenciesController = {
  // Create dependency
  async create(req: AuthRequest, res: Response) {
    try {
      const { itemId, dependsOnId, type } = req.body;

      // Check for circular dependencies
      const hasCircular = await checkCircularDependency(itemId, dependsOnId);
      if (hasCircular) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot create dependency: would create a circular dependency' 
        });
      }

      const dependency = await prisma.itemDependency.create({
        data: {
          itemId,
          dependsOnId,
          type: type || 'blocked_by'
        },
        include: {
          item: true,
          dependsOn: true
        }
      });

      res.status(201).json({ success: true, data: dependency });
    } catch (error: any) {
      console.error('Create dependency error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get dependencies for an item
  async getByItem(req: AuthRequest, res: Response) {
    try {
      const { itemId } = req.params;

      const [dependencies, dependedOnBy] = await Promise.all([
        prisma.itemDependency.findMany({
          where: { itemId },
          include: {
            dependsOn: {
              include: {
                columnValues: {
                  include: {
                    column: true
                  }
                }
              }
            }
          }
        }),
        prisma.itemDependency.findMany({
          where: { dependsOnId: itemId },
          include: {
            item: {
              include: {
                columnValues: {
                  include: {
                    column: true
                  }
                }
              }
            }
          }
        })
      ]);

      res.json({ 
        success: true, 
        data: {
          dependencies,
          dependedOnBy
        }
      });
    } catch (error: any) {
      console.error('Get dependencies error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get all dependencies for a board
  async getByBoard(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;

      const dependencies = await prisma.itemDependency.findMany({
        where: {
          item: {
            boardId
          }
        },
        include: {
          item: true,
          dependsOn: true
        }
      });

      res.json({ success: true, data: dependencies });
    } catch (error: any) {
      console.error('Get board dependencies error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Delete dependency
  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.itemDependency.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Dependency deleted' });
    } catch (error: any) {
      console.error('Delete dependency error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get critical path
  async getCriticalPath(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;

      // Get all items with their dependencies
      const items = await prisma.item.findMany({
        where: { boardId },
        include: {
          dependencies: {
            include: {
              dependsOn: true
            }
          },
          columnValues: {
            include: {
              column: true
            }
          }
        }
      });

      // Calculate critical path (simplified version)
      const criticalPath = calculateCriticalPath(items);

      res.json({ success: true, data: criticalPath });
    } catch (error: any) {
      console.error('Get critical path error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Check for blocked items
  async getBlockedItems(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;

      const blockedItems = await prisma.item.findMany({
        where: {
          boardId,
          dependencies: {
            some: {
              type: 'blocked_by',
              dependsOn: {
                columnValues: {
                  some: {
                    column: {
                      title: 'Status'
                    },
                    value: {
                      not: 'Done'
                    }
                  }
                }
              }
            }
          }
        },
        include: {
          dependencies: {
            where: { type: 'blocked_by' },
            include: {
              dependsOn: {
                include: {
                  columnValues: {
                    include: {
                      column: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      res.json({ success: true, data: blockedItems });
    } catch (error: any) {
      console.error('Get blocked items error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

// Helper function to check for circular dependencies
async function checkCircularDependency(itemId: string, dependsOnId: string): Promise<boolean> {
  if (itemId === dependsOnId) {
    return true;
  }

  const visited = new Set<string>();
  const queue: string[] = [dependsOnId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (current === itemId) {
      return true;
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    const dependencies = await prisma.itemDependency.findMany({
      where: { itemId: current },
      select: { dependsOnId: true }
    });

    for (const dep of dependencies) {
      queue.push(dep.dependsOnId);
    }
  }

  return false;
}

// Helper function to calculate critical path
function calculateCriticalPath(items: any[]): any {
  // Simplified critical path calculation
  // In a real implementation, this would use proper CPM algorithm
  
  const itemMap = new Map(items.map(item => [item.id, item]));
  const paths: any[] = [];

  // Find items with no dependencies (start points)
  const startItems = items.filter(item => item.dependencies.length === 0);

  for (const startItem of startItems) {
    const path = traversePath(startItem, itemMap, []);
    paths.push(path);
  }

  // Return the longest path
  const criticalPath = paths.reduce((longest, current) => 
    current.duration > longest.duration ? current : longest
  , { items: [], duration: 0 });

  return criticalPath;
}

function traversePath(item: any, itemMap: Map<string, any>, visited: string[]): any {
  if (visited.includes(item.id)) {
    return { items: [], duration: 0 };
  }

  visited.push(item.id);

  // Get duration from item (assuming there's a duration column)
  const durationValue = item.columnValues.find((cv: any) => 
    cv.column.title === 'Duration' || cv.column.type === 'NUMBER'
  );
  const duration = durationValue ? Number(durationValue.value) || 0 : 0;

  // Find items that depend on this one
  const dependents = Array.from(itemMap.values()).filter((i: any) =>
    i.dependencies.some((d: any) => d.dependsOnId === item.id)
  );

  if (dependents.length === 0) {
    return { items: [item], duration };
  }

  const longestPath = dependents.map(dep => 
    traversePath(dep, itemMap, [...visited])
  ).reduce((longest, current) => 
    current.duration > longest.duration ? current : longest
  , { items: [], duration: 0 });

  return {
    items: [item, ...longestPath.items],
    duration: duration + longestPath.duration
  };
}



