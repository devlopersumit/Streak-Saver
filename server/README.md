# Streak Saver Backend API

A complete backend API for the Streak Saver application that helps users maintain their posting streaks on X/Twitter by automatically posting backup tweets when they haven't posted in 24 hours.

## 📋 Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Setup](#setup)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Cron Jobs](#cron-jobs)
- [X API Integration](#x-api-integration)
- [Plan Limits](#plan-limits)
- [Error Handling](#error-handling)

## ✨ Features

- ✅ Complete CRUD operations for Users
- ✅ Complete CRUD operations for Backup Tweets
- ✅ **FREE plan: 5 backup tweets limit**
- ✅ **PREMIUM plan: Unlimited backup tweets ($5/month)**
- ✅ Daily streak checking via cron job
- ✅ **Auto-posting backup tweets when users don't post in 24 hours**
- ✅ X/Twitter OAuth integration support
- ✅ User statistics tracking
- ✅ Error handling middleware
- ✅ Input validation
- ✅ Clean and readable code with comments

## 🎯 How It Works

1. **User connects X account** via OAuth (you'll implement the OAuth flow in your frontend)
2. **User adds backup tweets** (5 for FREE users, unlimited for PREMIUM)
3. **Daily cron job runs at midnight** and checks:
   - If user posted in last 24 hours (via X API)
   - If not, automatically posts oldest unused backup tweet
   - Updates user's `lastPostedAt` timestamp
   - Marks backup tweet as used
4. **Streak is maintained** automatically!

## 🚀 Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create a `.env` file in the server directory:**
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   NODE_ENV=development
   ```

3. **Set up X API credentials** (you'll need these for OAuth):
   - Get API keys from https://developer.twitter.com/
   - Implement OAuth flow in your frontend
   - Store tokens via `/api/users/:id/connect-x-account` endpoint

4. **Start the server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000` (or your configured PORT).

## 📡 API Endpoints

### Users

#### Create a User
- **POST** `/api/users`
- **Body:**
  ```json
  {
    "xUserId": "twitter_user_id",
    "username": "twitter_username",
    "accessToken": "token",
    "refreshToken": "refresh_token",
    "plan": "FREE",
    "isActive": true
  }
  ```

#### Get All Users
- **GET** `/api/users`
- Returns a list of all users

#### Get User by ID
- **GET** `/api/users/:id`
- Returns a single user by their database ID

#### Get User by X/Twitter User ID
- **GET** `/api/users/x/:xUserId`
- Returns a user by their X/Twitter user ID

#### Get User Statistics
- **GET** `/api/users/:id/stats`
- Returns user information and statistics including:
  - Total backup tweets
  - Used/unused backup tweets count
  - Streak status (hours/days since last post)
  - Plan limits
  - Whether streak is active (< 24 hours)

#### Connect/Update X Account
- **PATCH** `/api/users/:id/connect-x-account`
- **Body:**
  ```json
  {
    "accessToken": "oauth_access_token",
    "refreshToken": "oauth_refresh_token",
    "xUserId": "twitter_user_id",
    "username": "twitter_username"
  }
  ```
- Use this after OAuth flow completes

#### Update User
- **PUT** `/api/users/:id`
- **Body:** Any user fields to update

#### Update Last Posted Timestamp
- **PATCH** `/api/users/:id/last-posted`
- Updates the user's `lastPostedAt` timestamp to current time

#### Delete User
- **DELETE** `/api/users/:id`
- Deletes user and all associated backup tweets

---

### Backup Tweets

#### Create Backup Tweet
- **POST** `/api/backup-tweets`
- **Body:**
  ```json
  {
    "userId": "user_database_id",
    "content": "Your backup tweet content here"
  }
  ```
- **FREE users:** Returns 403 error if they already have 5 unused backup tweets
- **PREMIUM users:** Unlimited backup tweets

#### Get All Backup Tweets
- **GET** `/api/backup-tweets`
- **Query Parameters:**
  - `userId` - Filter by user ID
  - `used` - Filter by used status (`true` or `false`)

#### Get Backup Tweet by ID
- **GET** `/api/backup-tweets/:id`

#### Get Unused Backup Tweets for User
- **GET** `/api/backup-tweets/user/:userId/unused`
- Returns all unused backup tweets for a specific user

#### Check Backup Tweet Quota
- **GET** `/api/backup-tweets/user/:userId/quota`
- Returns quota information:
  ```json
  {
    "plan": "FREE",
    "unusedCount": 3,
    "totalCount": 5,
    "maxAllowed": 5,
    "canAddMore": true,
    "remaining": 2
  }
  ```

#### Get Random Unused Backup Tweet
- **GET** `/api/backup-tweets/user/:userId/random-unused`
- Returns a random unused backup tweet for a user

#### Update Backup Tweet
- **PUT** `/api/backup-tweets/:id`
- **Body:** Fields to update

#### Mark Backup Tweet as Used
- **PATCH** `/api/backup-tweets/:id/mark-used`
- Marks a backup tweet as used and sets `usedAt` timestamp

#### Delete Backup Tweet
- **DELETE** `/api/backup-tweets/:id`

---

## 🗄️ Database Models

### User Model
```javascript
{
  xUserId: String,           // X/Twitter user ID
  username: String,          // X/Twitter username
  accessToken: String,       // OAuth access token (required for auto-posting)
  refreshToken: String,      // OAuth refresh token
  lastPostedAt: Date,        // Last time user posted (updated automatically)
  plan: String,              // User plan: "FREE" | "PREMIUM" | "PRO" (default: "FREE")
  isActive: Boolean,         // Whether user is active (default: true)
  createdAt: Date,           // Auto-generated
  updatedAt: Date            // Auto-generated
}
```

### BackupTweet Model
```javascript
{
  userId: ObjectId,          // Reference to User
  content: String,           // Tweet content (required, max 280 chars)
  used: Boolean,             // Whether tweet has been used (default: false)
  usedAt: Date,              // When tweet was used
  createdAt: Date,           // Auto-generated
  updatedAt: Date            // Auto-generated
}
```

## ⏰ Cron Jobs

### Streak Check Job
- **Schedule:** Runs daily at midnight (00:00 UTC)
- **Location:** `server/jobs/StreakCheck.job.js`

**What it does:**
1. Finds all active users with connected X accounts (`accessToken` exists)
2. Checks if user posted in last 24 hours via X API
3. If user hasn't posted:
   - Gets oldest unused backup tweet
   - Posts it via X API
   - Marks tweet as used
   - Updates user's `lastPostedAt` timestamp
4. Handles token refresh if access token expired
5. Logs all actions for monitoring

**To test manually:**
```javascript
// In StreakCheck.job.js, uncomment:
streakCheckJob();
```

## 🔌 X API Integration

The X API service (`server/services/xApiService.js`) provides functions for:
- `postTweet(accessToken, content)` - Post a tweet
- `checkRecentPosts(accessToken, xUserId)` - Check if user posted recently
- `refreshAccessToken(refreshToken)` - Refresh expired tokens

**⚠️ Important:** The X API functions are currently placeholders. You need to:
1. Get X API credentials from https://developer.twitter.com/
2. Implement actual API calls using X API v2 endpoints
3. Handle OAuth2 authentication properly

**Example X API v2 implementation:**
```javascript
const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: content })
});
```

## 💰 Plan Limits

### FREE Plan
- ✅ 5 backup tweets maximum (unused)
- ✅ Auto-posting enabled
- ✅ Basic streak tracking

### PREMIUM Plan ($5/month)
- ✅ **Unlimited backup tweets**
- ✅ Auto-posting enabled
- ✅ Advanced streak tracking
- ✅ Custom scheduling (future feature)

**Upgrade endpoint:** Update user's `plan` field to `"PREMIUM"` via `PUT /api/users/:id`

## 🛡️ Error Handling

All endpoints return consistent error responses:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error message"
}
```

**Plan Limit Error (403):**
```json
{
  "success": false,
  "message": "FREE plan limit reached. Upgrade to PREMIUM for unlimited backup tweets.",
  "currentCount": 5,
  "maxCount": 5,
  "upgradeMessage": "Upgrade to PREMIUM plan ($5/month) for unlimited backup tweets"
}
```

## 📝 Code Structure

```
server/
├── app.js                           # Main application file
├── config/
│   └── db.js                       # Database connection
├── controller/
│   ├── user.controller.js          # User business logic
│   └── backupTweet.controller.js   # Backup tweet business logic
├── models/
│   ├── User.js                     # User database model
│   └── BackupTweet.js              # Backup tweet database model
├── routes/
│   ├── user.routes.js              # User API routes
│   └── backupTweet.routes.js       # Backup tweet API routes
├── services/
│   └── xApiService.js              # X/Twitter API integration
├── jobs/
│   └── StreakCheck.job.js          # Daily streak check cron job
└── middleware/
    ├── errorHandler.js             # Error handling middleware
    └── notFound.js                 # 404 handler middleware
```

## 💡 Tips for Understanding the Code

1. **Controllers** contain the business logic - they handle requests and responses
2. **Routes** define the API endpoints and link them to controller functions
3. **Models** define the database schema structure with validation
4. **Services** handle external API integrations (like X API)
5. **Jobs** run scheduled tasks (like the daily streak check)
6. **Middleware** runs before/after routes to handle common tasks

All code includes detailed comments explaining what each function does!

## 🔐 Security Notes

- **Never commit `.env` file** - it contains sensitive credentials
- **Store OAuth tokens securely** - consider encrypting them in the database
- **Validate all inputs** - models and controllers include validation
- **Use HTTPS in production** - especially for OAuth callbacks
- **Rate limiting** - consider adding rate limiting middleware for production

## 🚧 Next Steps

1. **Implement X OAuth flow** in your frontend
2. **Complete X API integration** in `services/xApiService.js`
3. **Add payment processing** for PREMIUM plan upgrades
4. **Add email notifications** when backup tweets are posted
5. **Add custom scheduling** for PREMIUM users
6. **Add analytics dashboard** for users to see their streak history
