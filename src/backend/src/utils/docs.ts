import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "VP Planillas API",
      version: "1.0.0",
      description: "API documentation for VP Planillas system.",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}`,
        description: "Development server",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
});
