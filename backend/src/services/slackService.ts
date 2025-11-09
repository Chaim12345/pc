import axios from 'axios';

export class SlackService {
  /**
   * Send a notification to a Slack webhook
   */
  static async sendNotification(webhookUrl: string, message: string): Promise<void> {
    if (!webhookUrl) {
      throw new Error('Slack webhook URL not provided');
    }

    try {
      await axios.post(webhookUrl, {
        text: message,
        username: 'Monday Clone Bot',
        icon_emoji: ':rocket:'
      });
    } catch (error: any) {
      console.error('Slack notification error:', error.response?.data || error.message);
      throw new Error('Failed to send Slack notification');
    }
  }

  /**
   * Send a rich formatted notification
   */
  static async sendRichNotification(
    webhookUrl: string,
    payload: {
      title: string;
      message: string;
      color?: string;
      fields?: Array<{ title: string; value: string; short?: boolean }>;
      link?: string;
    }
  ): Promise<void> {
    if (!webhookUrl) {
      throw new Error('Slack webhook URL not provided');
    }

    try {
      await axios.post(webhookUrl, {
        username: 'Monday Clone Bot',
        icon_emoji: ':rocket:',
        attachments: [
          {
            color: payload.color || '#0073ea',
            title: payload.title,
            text: payload.message,
            fields: payload.fields || [],
            ...(payload.link && {
              title_link: payload.link,
              footer: 'Monday Clone',
              footer_icon: 'https://www.monday.com/favicon.ico',
              ts: Math.floor(Date.now() / 1000)
            })
          }
        ]
      });
    } catch (error: any) {
      console.error('Slack rich notification error:', error.response?.data || error.message);
      throw new Error('Failed to send Slack notification');
    }
  }

  /**
   * Notify about item creation
   */
  static async notifyItemCreated(webhookUrl: string, data: {
    boardName: string;
    groupName: string;
    itemName: string;
    creatorName: string;
    boardUrl: string;
  }): Promise<void> {
    await this.sendRichNotification(webhookUrl, {
      title: `New Item Created: ${data.itemName}`,
      message: `*${data.creatorName}* created a new item in *${data.boardName}*`,
      color: '#00c875',
      fields: [
        { title: 'Board', value: data.boardName, short: true },
        { title: 'Group', value: data.groupName, short: true }
      ],
      link: data.boardUrl
    });
  }

  /**
   * Notify about item status change
   */
  static async notifyStatusChanged(webhookUrl: string, data: {
    itemName: string;
    oldStatus: string;
    newStatus: string;
    boardName: string;
    updaterName: string;
    boardUrl: string;
  }): Promise<void> {
    await this.sendRichNotification(webhookUrl, {
      title: `Status Changed: ${data.itemName}`,
      message: `*${data.updaterName}* changed status from *${data.oldStatus}* to *${data.newStatus}*`,
      color: '#fdab3d',
      fields: [
        { title: 'Board', value: data.boardName, short: true },
        { title: 'Item', value: data.itemName, short: true }
      ],
      link: data.boardUrl
    });
  }

  /**
   * Notify about comment added
   */
  static async notifyCommentAdded(webhookUrl: string, data: {
    itemName: string;
    comment: string;
    commenterName: string;
    boardName: string;
    boardUrl: string;
  }): Promise<void> {
    await this.sendRichNotification(webhookUrl, {
      title: `New Comment on: ${data.itemName}`,
      message: `*${data.commenterName}*: ${data.comment.substring(0, 200)}${data.comment.length > 200 ? '...' : ''}`,
      color: '#579bfc',
      fields: [
        { title: 'Board', value: data.boardName, short: true },
        { title: 'Item', value: data.itemName, short: true }
      ],
      link: data.boardUrl
    });
  }
}






