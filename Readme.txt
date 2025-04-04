 API Documentation

 Overview
This is a RESTful API service that manages users, members, and agencies with role-based authentication and authorization. The system uses MongoDB as its database and implements secure authentication mechanisms.

 Database Structure
The application uses MongoDB with the following main collections:
- `users`: Central database for all user types (admin, agency, members)
  - Role assignments:
    - Role 0: Admin
    - Role 1: Agency
    - Role 2: Member

 Authentication
The API implements Basic Authentication for secure access control.

 Authentication Endpoints
- `POST /api/v1/members/auth`: Authentication endpoint for members
- Base URL: `http://localhost:8888`

 Authentication Flow
1. All users (admin, agency, members) are stored in the `users` database
2. Authentication is handled through Basic Auth
3. Credentials must be provided in the request headers

 Role-Based Access Control

 Admin Rights
- Full access to all endpoints
- Can update or delete any member account
- Can manage agency accounts

 Agency Rights (Role 1)
- Limited to agency-specific operations
- Can manage their own profile
- Access to agency-specific features

 Member Rights (Role 2)
- Can update or delete their own account
- Access to member-specific features
- Limited to personal data management

 Key Features

 Photo Upload
Endpoint: `POST /api/v1/agency/upload-photo`

 How to Upload Photos:
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

 Authentication Example
Using Postman:
1. Select the "Authorization" tab
2. Choose "Basic Auth"
3. Enter credentials:
   - Username: [your-username]
   - Password: [your-password]

 Important Notes

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

 API Endpoints

 Members
- `POST /api/v1/members/auth`: Member authentication
- `PUT /api/v1/members/:id`: Update member profile
- `DELETE /api/v1/members/:id`: Delete member account

 Agency
- `POST /api/v1/agency/upload-photo`: Upload agency profile photo
- Additional agency-specific endpoints

 Admin
- Full access to all endpoints
- Management endpoints for all user types

 Technical Requirements
- Node.js
- MongoDB
- TypeScript
- Express.js

 Development Notes
1. All user authentication is centralized in the `users` database
2. Role-based access control is implemented through user roles
3. Basic Authentication is used across all endpoints
4. File upload functionality is available for profile photos
5. Secure password handling and validation

 Error Handling
The API implements standard HTTP status codes: 
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

 Security Considerations
1. Use HTTPS in production
2. Implement rate limiting
3. Validate all input data
4. Secure password storage
5. Role-based access control

 API Testing Guide

Base URL: `http://localhost:10888/api/v1`

 Authentication

 Admin Login
- Endpoint: `POST /agency/auth`
- Auth: Basic Authentication (Admin credentials)
- Purpose: Used for admin operations and agency creation

 Member Login
- Endpoint: `POST /members/auth`
- Auth: Basic Authentication
- Purpose: Member authentication

 Agency Management

 1. Create Agency
- Endpoint: `POST /agency/auth`
- Method: POST
- Auth: Basic Auth (Admin credentials)
- Body:

{
  "username": "mary",
  "password": "12345678",
  "email": "mary@wanderlust.com",
  "phone": "86123402",
  "name": {
    "firstname": "mary",
    "lastname": "mary",
    "nickname": "mary"
  }
}


 2. Upload Agency Photo
- Endpoint: `POST /agency/upload-photo`
- Method: POST
- Auth: Basic Auth
//plaintext
Username: peter
Password: 12345678

- Body: form-data
  - Key: `profilePhoto`
  - Type: File
  - Value: [Select image file]

 3. Get Agency Photo
- Endpoint: `GET /agency/{username}`
- Method: GET
- Example: `GET /agency/peter`
- Response: Image file

 Hotel Management

 1. Add Hotel
- Endpoint: `POST /hotel`
- Method: POST
- Body:

{
    "star": 8,
    "name": "8 Seasons Hotel Hong Kong",
    "accommodationType": "Hotel",
    "address": "8 Finance Street, Central",
    "city": "Hong Kong",
    "coordinates": {
        "latitude": 22.2863701,
        "longitude": 114.0849434
    },
    "country": "Hong Kong, China",
    "description": "Luxe harbour-view hotel with a pool",
    "email": "info@fourseasons.com",
    "facilities": [
        "Pool",
        "Spa",
        "Free WiFi",
        "Air-conditioned"
    ],
    "lastUpdate": "2025-03-15",
    "phones": "(852)-3196-8888",
    "ranking": 5,
    "web": "www.fourseasons.com",
    "token": "1743436646980"
}


 2. Update Hotel
- Endpoint: `PUT /hotel/{hotelId}`
- Method: PUT
- Example: `PUT /hotel/67ec3525250d2b71082e472b`
- Body:

{
    "star": 8,
    "name": "8 Seasons Hotel Hong Kong",
    "accommodationType": "Hotel",
    "address": "8 Finance Street, Central",
    "city": "Hong Kong",
    "coordinates": {
        "latitude": 22.2863701,
        "longitude": 114.0849434
    },
    "country": "Hong Kong, China",
    "description": "Luxe harbour-view hotel with a pool",
    "email": "info@fourseasons.com",
    "facilities": [
        "Pool",
        "Spa",
        "Free WiFi",
        "Air-conditioned"
    ],
    "lastUpdate": "2025-03-15",
    "phones": "(852)-3196-8888",
    "ranking": 5,
    "web": "www.fourseasons.com",
    "token": "1743436646980"
}


 3. Delete Hotel
- Endpoint: `DELETE /hotel/{hotelId}`
- Method: DELETE
- Example: `DELETE /hotel/67ec3525250d2b71082e472b`
- Body:

{
    "token": "1743436646980"
}

 Member Management

 1. Register Member
- Endpoint: `POST /member`
- Method: POST
- Auth: None required
- Body:

{
  "username": "mary",
  "password": "12345678",
  "email": "mary@wanderlust.com",
  "phone": "86123402",
  "name": {
    "firstname": "mary",
    "lastname": "mary",
    "nickname": "mary"
  }
}


 2. Get Favorites List
- Endpoint: `GET /favourlist`
- Method: GET
- Body:

{
    "token": "1743528462289",
    "username": "baby",
    "role": 2
}


 Messaging System

 1. Send Message
- Endpoint: `POST /message`
- Method: POST
- Body:

{
    "token": "1743528462289",
    "receiver": "agencyq",
    "content": "Hello, I am interested in your hotel listings",
    "type": "text"
}


 2. Get Messages
- Endpoint: `GET /message`
- Method: GET
- Body:

{
    "token": "1743427268076"
}


 3. Delete Message
- Endpoint: `DELETE /message`
- Method: DELETE
- Body:

{
    "token": "1743528462289",
    "messageId": "67ec27def151a312661411a7"
}


 Testing Flow

 1. Initial Setup
1. Start with admin login
2. Create an agency account
3. Upload agency photo
4. Verify agency photo retrieval

 2. Hotel Management Flow
1. Add a new hotel
2. Update hotel details
3. Delete hotel

 3. Member Operations
1. Register new member
2. Test member authentication
3. Add hotels to favorites
4. View favorites list

 4. Communication Testing
1. Send message from member to agency
2. Retrieve messages
3. Delete messages

 Postman Collection Setup

 Environment Variables
Set up the following variables:
- `base_url`: http://localhost:10888/api/v1
- `token`: [Your authentication token]
- `admin_username`: [Admin username]
- `admin_password`: [Admin password]

 Authentication Headers
For endpoints requiring Basic Auth:
1. Go to "Authorization" tab
2. Select "Basic Auth"
3. Enter credentials as required

 File Upload Testing
For photo upload:
1. Select "Body" tab
2. Choose "form-data"
3. Add key "profilePhoto"
4. Set type to File
5. Select image file to upload

 Error Testing
Test each endpoint with:
1. Invalid tokens
2. Missing required fields
3. Invalid data formats
4. Unauthorized access
5. Non-existent IDs

 Success Criteria
- 200: Successful operation
- 201: Successfully created
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
500: Server error
