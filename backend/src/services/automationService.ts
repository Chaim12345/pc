import { PrismaClient } from '@prisma/client';
import { AutomationTriggerType, AutomationActionType } from '@monday-clone/shared';

const prisma = new PrismaClient();

export async function executeAutomations(
  boardId: string,
  triggerType: AutomationTriggerType,
  context: {
    itemId?: string;
    columnId?: string;
    oldValue?: any;
    newValue?: any;
  }
) {
  try {
    // Get all enabled automations for this board
    const automations = await prisma.automation.findMany({
      where: {
        boardId,
        enabled: true
      }
    });

    for (const automation of automations) {
      const trigger = automation.trigger as any;
      
      // Check if trigger matches
      if (trigger.type !== triggerType) {
        continue;
      }

      // Check additional conditions
      if (trigger.conditions) {
        if (trigger.conditions.columnId && trigger.conditions.columnId !== context.columnId) {
          continue;
        }
      }

      // Execute actions
      const actions = automation.actions as any[];
      for (const action of actions) {
        await executeAction(action, context, boardId);
      }
    }
  } catch (error) {
    console.error('Error executing automations:', error);
  }
}

async function executeAction(
  action: { type: AutomationActionType; parameters?: any },
  context: any,
  boardId: string
) {
  try {
    switch (action.type) {
      case AutomationActionType.UPDATE_COLUMN_VALUE:
        if (action.parameters?.columnId && context.itemId && action.parameters?.value !== undefined) {
          await prisma.columnValue.upsert({
            where: {
              itemId_columnId: {
                itemId: context.itemId,
                columnId: action.parameters.columnId
              }
            },
            update: {
              value: action.parameters.value
            },
            create: {
              itemId: context.itemId,
              columnId: action.parameters.columnId,
              value: action.parameters.value
            }
          });
        }
        break;

      case AutomationActionType.CREATE_ITEM:
        if (action.parameters?.groupId && action.parameters?.name) {
          const board = await prisma.board.findUnique({
            where: { id: boardId },
            include: { groups: true }
          });

          const targetGroup = board?.groups.find(g => g.id === action.parameters.groupId);
          if (targetGroup) {
            const maxPosition = await prisma.item.findFirst({
              where: { groupId: targetGroup.id },
              orderBy: { position: 'desc' }
            });

            await prisma.item.create({
              data: {
                boardId,
                groupId: targetGroup.id,
                name: action.parameters.name,
                position: maxPosition ? maxPosition.position + 1 : 0
              }
            });
          }
        }
        break;

      case AutomationActionType.MOVE_TO_GROUP:
        if (context.itemId && action.parameters?.groupId) {
          const maxPosition = await prisma.item.findFirst({
            where: { groupId: action.parameters.groupId },
            orderBy: { position: 'desc' }
          });

          await prisma.item.update({
            where: { id: context.itemId },
            data: {
              groupId: action.parameters.groupId,
              position: maxPosition ? maxPosition.position + 1 : 0
            }
          });
        }
        break;

      case AutomationActionType.CHANGE_STATUS:
        if (context.itemId && action.parameters?.statusColumnId && action.parameters?.statusValue) {
          await prisma.columnValue.upsert({
            where: {
              itemId_columnId: {
                itemId: context.itemId,
                columnId: action.parameters.statusColumnId
              }
            },
            update: {
              value: action.parameters.statusValue
            },
            create: {
              itemId: context.itemId,
              columnId: action.parameters.statusColumnId,
              value: action.parameters.statusValue
            }
          });
        }
        break;

      case AutomationActionType.SEND_NOTIFICATION:
        // Create notification for board members
        if (action.parameters?.message && context.itemId) {
          const board = await prisma.board.findUnique({
            where: { id: boardId },
            include: {
              organization: {
                include: {
                  members: true
                }
              }
            }
          });

          if (board?.organization.members) {
            const notifications = board.organization.members.map(member => ({
              userId: member.userId,
              type: 'automation',
              title: 'Automation Notification',
              message: action.parameters.message,
              metadata: {
                itemId: context.itemId,
                boardId
              }
            }));

            await prisma.notification.createMany({
              data: notifications
            });
          }
        }
        break;
    }
  } catch (error) {
    console.error('Error executing action:', error);
  }
}

