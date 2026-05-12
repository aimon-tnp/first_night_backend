const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'First Night Backend API',
      version: '1.0.0',
      description: 'API documentation for First Night Backend - Event booking platform',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server',
      },
      {
        url: process.env.API_URL || 'https://first-night-backend.onrender.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme',
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
            message: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        Profile: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Profile ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Profile creation timestamp',
            },
            name: {
              type: 'string',
              description: 'Full name',
            },
            nickname: {
              type: 'string',
              description: 'Nickname',
            },
            gender: {
              type: 'string',
              enum: ['male', 'female'],
              description: 'Gender',
            },
            birthday: {
              type: 'string',
              format: 'date',
              description: 'Date of birth',
            },
            telephone: {
              type: 'string',
              description: 'Phone number',
            },
            instagram: {
              type: 'string',
              description: 'Instagram handle (optional)',
            },
            university: {
              type: 'string',
              description: 'University name',
            },
            faculty: {
              type: 'string',
              description: 'Faculty/Major',
            },
            uniYear: {
              type: 'integer',
              description: 'Year of study',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address',
            },
            emergencyName: {
              type: 'string',
              description: 'Emergency contact name (optional)',
            },
            emergencyRelationship: {
              type: 'string',
              description: 'Emergency contact relationship (optional)',
            },
            emergencyTelephone: {
              type: 'string',
              description: 'Emergency contact phone (optional)',
            },
            allergies: {
              type: 'string',
              description: 'Allergy information (optional)',
            },
            medications: {
              type: 'string',
              description: 'Current medications (optional)',
            },
            username: {
              type: 'string',
              description: 'Unique username',
            },
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN'],
              description: 'User role',
            },
            avatarUrl: {
              type: 'string',
              format: 'uri',
              description: 'Avatar image URL (optional)',
            },
            isMatched: {
              type: 'boolean',
              description: 'Whether user has been matched',
            },
          },
        },
        Preferences: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Preferences ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            profileId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated profile ID',
            },
            quote: {
              type: 'string',
              description: 'Personal quote (optional)',
            },
            personality: {
              type: 'string',
              enum: ['introvert', 'extrovert', 'ambivert'],
              description: 'Personality type',
            },
            personalityPreference: {
              type: 'string',
              enum: ['introvert', 'extrovert', 'ambivert'],
              description: 'Preferred partner personality',
            },
            agePreference: {
              type: 'string',
              enum: ['same', 'younger', 'older', 'no_preference'],
              description: 'Age preference',
            },
            loveLangExpress: {
              type: 'string',
              description: 'Love language for expression',
            },
            loveLangReceive: {
              type: 'string',
              description: 'Love language for receiving',
            },
            hobbies: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of hobbies',
            },
            fashionStyle: {
              type: 'array',
              items: { type: 'string' },
              description: 'Own fashion style preferences',
            },
            fashionPreference: {
              type: 'array',
              items: { type: 'string' },
              description: 'Partner fashion style preference',
            },
            characteristics: {
              type: 'array',
              items: { type: 'string' },
              description: 'Own characteristics',
            },
            characteristicPreference: {
              type: 'array',
              items: { type: 'string' },
              description: 'Partner characteristic preferences',
            },
            faceType: {
              type: 'array',
              items: { type: 'string' },
              description: 'Own face type',
            },
            faceTypePreference: {
              type: 'array',
              items: { type: 'string' },
              description: 'Preferred partner face type',
            },
          },
        },
        Session: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Session ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Session creation timestamp',
            },
            name: {
              type: 'string',
              description: 'Session name/title',
            },
            description: {
              type: 'string',
              description: 'Detailed description (optional)',
            },
            startDateTime: {
              type: 'string',
              format: 'date-time',
              description: 'Session start date/time',
            },
            durationHours: {
              type: 'number',
              format: 'float',
              description: 'Duration in hours',
            },
            location: {
              type: 'string',
              description: 'Session location',
            },
            earlyBirdPrice: {
              type: 'number',
              format: 'decimal',
              example: '99.99',
              description: 'Early bird price per person',
            },
            regularPrice: {
              type: 'number',
              format: 'decimal',
              example: '149.99',
              description: 'Regular price per person',
            },
            capacity: {
              type: 'integer',
              description: 'Maximum number of participants',
            },
            img_url_list: {
              type: 'array',
              maxItems: 5,
              items: {
                type: 'string',
                format: 'uri',
              },
              description: 'Session images (maximum 5)',
            },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Booking ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Booking creation timestamp',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'User profile ID',
            },
            sessionId: {
              type: 'string',
              format: 'uuid',
              description: 'Session ID',
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'rejected', 'refunded'],
              description: 'Booking registration status',
            },
            amount: {
              type: 'number',
              format: 'decimal',
              example: '149.99',
              description: 'Payment amount',
            },
            transferDateTime: {
              type: 'string',
              format: 'date-time',
              description: 'When payment was made',
            },
            slipUrl: {
              type: 'string',
              format: 'uri',
              description: 'Payment receipt/slip image URL (optional)',
            },
            refundBankName: {
              type: 'string',
              description: 'Bank name for refund',
            },
            refundBankNumber: {
              type: 'string',
              description: 'Bank account number for refund',
            },
            refundAccountName: {
              type: 'string',
              description: 'Account name for refund',
            },
          },
        },
        Match: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Match ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Match creation timestamp',
            },
            maleId: {
              type: 'string',
              format: 'uuid',
              description: 'Male profile ID',
            },
            femaleId: {
              type: 'string',
              format: 'uuid',
              description: 'Female profile ID',
            },
            compatibilityScore: {
              type: 'number',
              format: 'float',
              description: 'Compatibility score (optional)',
            },
          },
        },
      },
    },
  },
  apis: [
    './src/routes/authRoutes.js',
    './src/routes/profileRoutes.js',
    './src/routes/sessionRoutes.js',
    './src/routes/bookingRoutes.js',
    './src/routes/matchRoutes.js',
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
