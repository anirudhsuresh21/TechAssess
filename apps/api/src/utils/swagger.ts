export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'TechAssess API',
    version: '1.0.0',
    description: 'REST API for TechAssess — Online Assessment Platform for Tech Club Recruitment',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 root',
    },
  ],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Authenticate administrator',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful with JWT token' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/assessments': {
      get: { summary: 'List all assessments' },
      post: { summary: 'Create new assessment' },
    },
    '/questions': {
      get: { summary: 'Search and filter question bank' },
      post: { summary: 'Create new question' },
    },
    '/candidate/validate-access-code': {
      post: { summary: 'Verify exam code and return public examination details' },
    },
    '/candidate/register': {
      post: { summary: 'Register candidate details for examination' },
    },
    '/attempts/start': {
      post: { summary: 'Start examination session with server-side timer' },
    },
    '/attempts/{id}/answers/{questionId}': {
      put: { summary: 'Autosave candidate answer' },
    },
    '/attempts/{id}/submit': {
      post: { summary: 'Submit attempt and trigger server-side evaluation' },
    },
  },
};
