import swaggerJSDoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0', // Specify the version of OpenAPI/Swagger you want to use
    info: {
      title: 'Sports API',
      version: '1.0.0',
      description: 'Sports API Documentation',
    },
  },
  // Specify the paths to your API routes
  apis: ['routes/users.js','routes/transection.js'], // Replace 'app.js' with your actual file(s) containing route definitions
};

export const swaggerSpec = swaggerJSDoc(options);

