import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gestão Pro API',
      version: '1.0.0',
      description: 'API REST completa para gestão de pequenos negócios',
      contact: {
        name: 'Suporte',
        email: 'suporte@gestaopro.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Servidor de desenvolvimento',
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
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './middleware/*.js'],
};

const specs = swaggerJsdoc(options);

export default specs;
