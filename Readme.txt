Demo Link:
https://youtu.be/WJXr_CzEnSs



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
- Endpoint: `POST /agency`
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


 2. Update Agency
- Endpoint: `PUT /agency`
- Method: PUT
- Auth: Basic Auth
- Body:

{
  "username": "mary",
  "password": "newpassword",
  "email": "newemail@wanderlust.com",
  "phone": "newphone",
  "name": {
    "firstname": "newfirstname",
    "lastname": "newlastname",
    "nickname": "newnickname"
  }
}


 3. Upload Agency Photo
- Endpoint: `POST /agency/upload-photo`
- Method: POST
- Auth: Basic Auth
- Body: form-data
  - Key: `profilePhoto`
  - Type: File
  - Value: [Select image file]

 4. Get Agency Photo
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


 2. Update Member
- Endpoint: `PUT /member`
- Method: PUT
- Auth: Basic Auth
- Body:

{
  "username": "mary",
  "password": "newpassword",
  "email": "newemail@wanderlust.com",
  "phone": "newphone",
  "name": {
    "firstname": "newfirstname",
    "lastname": "newlastname",
    "nickname": "newnickname"
  }
}


 3. Upload Member Photo
- Endpoint: `POST /member/upload-photo`
- Method: POST
- Auth: Basic Auth
- Body: form-data
  - Key: `profilePhoto`
  - Type: File
  - Value: [Select image file]


 4. Get Member Photo
- Endpoint: `GET /member/{username}`
- Method: GET
- Example: `GET /member/mary`
- Response: Image file

 5. Delete Member
- Endpoint: `DELETE /member`
- Method: DELETE
- Auth: Basic Auth
- Body: None required


 Favorites Management

 1. Get Favorites List
- Endpoint: `GET /favourlist`
- Method: GET
- Auth: Token required
- Body:

{
    "token": "1743528462289"
}


 2. Add to Favorites
- Endpoint: `POST /favourlist`
- Method: POST
- Auth: Token required
- Body:

{
    "token": "1743528462289",
    "hotelId": "67ec3525250d2b71082e472b"
}


 3. Remove from Favorites
- Endpoint: `DELETE /favourlist`
- Method: DELETE
- Auth: Token required
- Body:

{
    "token": "1743528462289",
    "hotelId": "67ec3525250d2b71082e472b"
}


 Messaging System

 1. Send Message
- Endpoint: `POST /message`
- Method: POST
- Auth: Token required
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
- Auth: Token required
- Body:

{
    "token": "1743528462289"
}


 3. Delete Message
- Endpoint: `DELETE /message`
- Method: DELETE
- Auth: Token required
- Body:

{
    "token": "1743528462289",
    "messageId": "67ec27def151a312661411a7"
}

OpenAPI specification:

openapi: 3.0.0
info:
  title: Wanderlust Travel API
  description: API for managing hotels, agencies, members, and related operations
  version: 1.0.0
  contact:
    name: API Support
    email: support@wanderlust.com

servers:
  - url: http://localhost:10888
    description: Development server

components:
  securitySchemes:
    BasicAuth:
      type: http
      scheme: basic
    BearerAuth:
      type: http
      scheme: bearer

  schemas:
    User:
      type: object
      properties:
        username:
          type: string
        password:
          type: string
        token:
          type: string
        email:
          type: string
        phone:
          type: string
        name:
          type: object
          properties:
            firstname:
              type: string
            lastname:
              type: string
            middlename:
              type: string
            nickname:
              type: string
        status:
          type: boolean
        role:
          type: integer
          enum: [0, 1, 2]
          description: 0 for admin, 1 for agency, 2 for member
        profilePhoto:
          type: string

    Hotel:
      type: object
      properties:
        star:
          type: integer
        name:
          type: string
        accommodationType:
          type: string
        address:
          type: string
        city:
          type: string
        coordinates:
          type: object
          properties:
            latitude:
              type: number
            longitude:
              type: number
        country:
          type: string
        description:
          type: string
        email:
          type: string
        facilities:
          type: array
          items:
            type: string
        lastUpdate:
          type: string
          format: date
        phones:
          type: string
        ranking:
          type: number
        web:
          type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    Message:
      type: object
      properties:
        id:
          type: integer
        senderId:
          type: integer
        receiverId:
          type: integer
        content:
          type: string
        timestamp:
          type: string
          format: date-time

    Favour:
      type: object
      properties:
        id:
          type: integer
        memberId:
          type: integer
        hotelId:
          type: integer

paths:
  /api/v1/agency:
    post:
      summary: Create a new agency
      security:
        - BasicAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
      responses:
        '201':
          description: Agency created successfully
        '401':
          description: Unauthorized
        '403':
          description: Forbidden - Admin privileges required

    put:
      summary: Update an existing agency
      security:
        - BasicAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
      responses:
        '200':
          description: Agency updated successfully
        '401':
          description: Unauthorized
        '403':
          description: Forbidden - Admin privileges required

  /api/v1/agency/upload-photo:
    post:
      summary: Upload agency profile photo
      security:
        - BasicAuth: []
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                profilePhoto:
                  type: string
                  format: binary
      responses:
        '200':
          description: Photo uploaded successfully
        '401':
          description: Unauthorized

  /api/v1/agency/auth:
    get:
      summary: Authenticate agency
      security:
        - BasicAuth: []
      responses:
        '200':
          description: Authentication successful
        '401':
          description: Unauthorized

  /api/v1/member:
    get:
      summary: Get member information
      security:
        - BasicAuth: []
      responses:
        '200':
          description: Member information retrieved successfully
        '401':
          description: Unauthorized

    post:
      summary: Create a new member
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
      responses:
        '201':
          description: Member created successfully
        '400':
          description: Bad request

    delete:
      summary: Delete a member
      security:
        - BasicAuth: []
      responses:
        '200':
          description: Member deleted successfully
        '401':
          description: Unauthorized

  /api/v1/member/upload-photo:
    post:
      summary: Upload member profile photo
      security:
        - BasicAuth: []
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                profilePhoto:
                  type: string
                  format: binary
      responses:
        '200':
          description: Photo uploaded successfully
        '401':
          description: Unauthorized

  /api/v1/member/auth:
    get:
      summary: Authenticate member
      security:
        - BasicAuth: []
      responses:
        '200':
          description: Authentication successful
        '401':
          description: Unauthorized

  /api/v1/hotel:
    get:
      summary: Get all hotels
      responses:
        '200':
          description: List of hotels
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Hotel'

    post:
      summary: Add a new hotel
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Hotel'
      responses:
        '201':
          description: Hotel added successfully
        '401':
          description: Unauthorized

  /api/v1/hotel/{id}:
    delete:
      summary: Delete a hotel
      security:
        - BearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Hotel deleted successfully
        '401':
          description: Unauthorized
        '404':
          description: Hotel not found

  /api/v1/favourlist:
    get:
      summary: Get user's favorites
      security:
        - BearerAuth: []
      responses:
        '200':
          description: List of favorites
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Favour'
        '401':
          description: Unauthorized

  /api/v1/message:
    get:
      summary: Get messages
      security:
        - BearerAuth: []
      responses:
        '200':
          description: List of messages
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Message'
        '401':
          description: Unauthorized 
