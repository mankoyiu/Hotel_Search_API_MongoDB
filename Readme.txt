# API Documentation

## Overview
This is a RESTful API service that manages users, members, and agencies with role-based authentication and authorization. The system uses MongoDB as its database and implements secure authentication mechanisms.

## Database Structure
The application uses MongoDB with the following main collections:
- `users`: Central database for all user types (admin, agency, members)
  - Role assignments:
    - Role 0: Admin
    - Role 1: Agency
    - Role 2: Member

## Authentication
The API implements Basic Authentication for secure access control.

### Authentication Endpoints
- `POST /api/v1/members/auth`: Authentication endpoint for members
- Base URL: `http://localhost:8888`

### Authentication Flow
1. All users (admin, agency, members) are stored in the `users` database
2. Authentication is handled through Basic Auth
3. Credentials must be provided in the request headers

## Role-Based Access Control

### Admin Rights
- Full access to all endpoints
- Can update or delete any member account
- Can manage agency accounts

### Agency Rights (Role 1)
- Limited to agency-specific operations
- Can manage their own profile
- Access to agency-specific features

### Member Rights (Role 2)
- Can update or delete their own account
- Access to member-specific features
- Limited to personal data management

## Key Features

### Photo Upload
Endpoint: `POST /api/v1/agency/upload-photo`

#### How to Upload Photos:
1. Use form-data in the request body
2. Key name: `profilePhoto`
3. File type: Image files

Example using Postman:
1. Select POST method
2. Enter URL: `http://your-server-address/api/v1/agency/upload-photo`
3. In Body tab:
   - Select form-data
   - Add key `profilePhoto` (Type: File)
   - Attach image file

### Authentication Example
Using Postman:
1. Select the "Authorization" tab
2. Choose "Basic Auth"
3. Enter credentials:
   - Username: [your-username]
   - Password: [your-password]

## Important Notes

1. Member Registration
   - New members are automatically assigned Role 2
   - Registration data is stored in the `users` database

2. Data Management
   - Members can manage their own accounts
   - Admins have full management rights
   - All user types are centralized in the `users` database

3. Security
   - Uses Basic Authentication
   - Secure password handling
   - Role-based access control

## API Endpoints

### Members
- `POST /api/v1/members/auth`: Member authentication
- `PUT /api/v1/members/:id`: Update member profile
- `DELETE /api/v1/members/:id`: Delete member account

### Agency
- `POST /api/v1/agency/upload-photo`: Upload agency profile photo
- Additional agency-specific endpoints

### Admin
- Full access to all endpoints
- Management endpoints for all user types

## Technical Requirements
- Node.js
- MongoDB
- TypeScript
- Express.js

## Development Notes
1. All user authentication is centralized in the `users` database
2. Role-based access control is implemented through user roles
3. Basic Authentication is used across all endpoints
4. File upload functionality is available for profile photos
5. Secure password handling and validation

## Error Handling
The API implements standard HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Security Considerations
1. Use HTTPS in production
2. Implement rate limiting
3. Validate all input data
4. Secure password storage
5. Role-based access control