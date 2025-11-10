import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Monday Clone API',
      version: '1.0.0',
      description: 'Full-featured Monday.com clone API with real-time collaboration',
      contact: {
        name: 'API Support',
        email: 'support@mondayclone.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.mondayclone.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clx1234567890',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              example: 'john@example.com',
            },
            avatar: {
              type: 'string',
              nullable: true,
              example: 'https://example.com/avatar.jpg',
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
              example: 'ACTIVE',
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'USER', 'VIEWER'],
              example: 'USER',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Board: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clx1234567890',
            },
            name: {
              type: 'string',
              example: 'Project Management',
            },
            description: {
              type: 'string',
              nullable: true,
              example: 'Main project board',
            },
            organizationId: {
              type: 'string',
              example: 'clx1234567890',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Item: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clx1234567890',
            },
            name: {
              type: 'string',
              example: 'Task 1',
            },
            boardId: {
              type: 'string',
              example: 'clx1234567890',
            },
            groupId: {
              type: 'string',
              example: 'clx1234567890',
            },
            position: {
              type: 'number',
              example: 0,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Monday Clone API Documentation',
  }));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

