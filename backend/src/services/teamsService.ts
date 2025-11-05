import axios from 'axios';

export class TeamsService {
  static async sendNotification(webhookUrl: string, message: string): Promise<void> {
    try {
      const payload = {
        "@type": "MessageCard",
        "@context": "https://schema.org/extensions",
        "summary": "Monday Clone Notification",
        "themeColor": "0078D4",
        "title": "Monday Clone",
        "text": message
      };

      await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Failed to send Teams notification:', error);
      throw new Error('Failed to send Teams notification');
    }
  }

  static async notifyItemCreated(webhookUrl: string, data: any): Promise<void> {
    const message = `🆕 **New Item Created**\n\n**Item:** ${data.itemName}\n**Board:** ${data.boardName}\n**Created by:** ${data.userName}`;
    
    const payload = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      "summary": "New Item Created",
      "themeColor": "00C875",
      "title": "🆕 New Item Created",
      "sections": [{
        "activityTitle": data.itemName,
        "activitySubtitle": `on ${data.boardName}`,
        "activityImage": data.userAvatar || undefined,
        "facts": [
          {
            "name": "Created by:",
            "value": data.userName
          },
          {
            "name": "Board:",
            "value": data.boardName
          }
        ]
      }],
      "potentialAction": data.itemUrl ? [{
        "@type": "OpenUri",
        "name": "View Item",
        "targets": [{
          "os": "default",
          "uri": data.itemUrl
        }]
      }] : undefined
    };

    await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  static async notifyStatusChanged(webhookUrl: string, data: any): Promise<void> {
    const payload = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      "summary": "Status Changed",
      "themeColor": "FDAB3D",
      "title": "🔄 Status Changed",
      "sections": [{
        "activityTitle": data.itemName,
        "activitySubtitle": `Status: ${data.oldStatus} → ${data.newStatus}`,
        "facts": [
          {
            "name": "Item:",
            "value": data.itemName
          },
          {
            "name": "Old Status:",
            "value": data.oldStatus
          },
          {
            "name": "New Status:",
            "value": data.newStatus
          },
          {
            "name": "Changed by:",
            "value": data.userName
          }
        ]
      }],
      "potentialAction": data.itemUrl ? [{
        "@type": "OpenUri",
        "name": "View Item",
        "targets": [{
          "os": "default",
          "uri": data.itemUrl
        }]
      }] : undefined
    };

    await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  static async notifyCommentAdded(webhookUrl: string, data: any): Promise<void> {
    const payload = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      "summary": "New Comment",
      "themeColor": "0073EA",
      "title": "💬 New Comment",
      "sections": [{
        "activityTitle": data.itemName,
        "activitySubtitle": `Comment by ${data.userName}`,
        "activityImage": data.userAvatar || undefined,
        "text": data.comment,
        "facts": [
          {
            "name": "Item:",
            "value": data.itemName
          },
          {
            "name": "Board:",
            "value": data.boardName
          }
        ]
      }],
      "potentialAction": data.itemUrl ? [{
        "@type": "OpenUri",
        "name": "View Comment",
        "targets": [{
          "os": "default",
          "uri": data.itemUrl
        }]
      }] : undefined
    };

    await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

