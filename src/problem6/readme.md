### Software Requirements

1. We have a website with a score board, which shows the top 10 user’s scores
2. We want live update of the score board
3. User can do an action (which we do not need to care what the action is), completing this action will increase the user’s score
4. Upon completion the action will dispatch an API call to the application server to update the score
5. We want to prevent malicious users from increasing scores without authorisation

# Solution
## Introduction
### Goal
Build a secure backend module to manage user scores and maintain a live Top 10 leaderboard

### Score Update
The client only reports that an action has been completed

### Security
Every score update must be authenticated and validated to prevent users from increasing their score without authorization

### Duplicate Protection
Each action completion should be processed only once to prevent duplicate or repeated score updates

### Leaderboard
After a valid score update, the system recalculates or updates the leaderboard and keeps the Top 10 users available

### Real-time Update
The latest leaderboard is pushed to connected clients using WebSocket or Server-Sent Events so users can see score changes without refreshing the page

### Scalability
The module should remain simple for the initial implementation but allow future improvements such as Redis, rate limiting, fraud detection, and distributed real-time updates

## Architecture
                     ┌──────────────────┐
                     │      Client      │
                     │                  │
                     └────────┬─────────┘
                              │
                      complete action
                              │
                              ▼
                    ┌───────────────────┐
                    │    API Server     │
                    │   (controller,    │
                    |service, model,...)|
                    |                   |
                    │  Auth Middleware  │
                    │        ↓          │
                    │  Author Middleware│
                    |    (if needed)    |
                    │        ↓          │
                    │ Action Validator  │
                    │        ↓          │
                    │   Score Service   │
                    └────────┬──────────┘
                             │
                     Transaction
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
       ┌──────────────┐             ┌──────────────┐
       │  Database    │             │    Redis     │
       │              │             │ Leaderboard  │
       │ users        │             │   Top 10     │
       │ actions      │             └──────┬───────┘
       │ score events │                    │
       └──────────────┘                    │
                                          ▼
                                  ┌─────────────────┐
                                  │ WebSocket Server│
                                  └────────┬────────┘
                                           │
                                           ▼
                                      All clients

1. API Server
- The API Server handles the main backend flow
- It receives requests from the client and coordinates:
  - Authentication
  - Authorization
  - Middleware
  - Service
  - Validation
  - Score Update
  - Caching
  - WebSocket

2. Auth Middleware (Authentication)
- The Auth Middleware verifies that the request comes from a valid user
```http
example:
Authorization: Bearer <token>
```
- It validates the token and gets the userId from the authentication context
- The backend should not trust a userId sent directly by the client

3. Author Middleware (Authorization)
- Check whether the user has permission to perform the requested action
- Attach trusted user information to the request context for the next processing steps

4. Action Validator
- The Action Validator checks whether the action is valid before adding points
- It may verify:
  - The action exists
  - The user really completed the action
  - The action has not already been rewarded
  - The completion ID is valid
- This helps prevent users from calling the API manually to increase their score

5. Score Service
- The Score Service contains the main scoring business logic
- It is responsible for:
  - Deciding how many points should be added
  - Creating a score event
  - Updating the user's score
  - Preventing duplicate score updates

For example:
```
ACTION_A -> +10 points
ACTION_B -> +20 points
```

6. Transaction
- A transaction ensures that related database changes are completed together
- If one operation fails, the whole transaction should be rolled back
- This keeps the data consistent

7. Database
- The database is the main source of truth

It can store data such as:
```
users
actions
score_events
```
For example, score_events can store:
```
user_id
action_id
completion_id
points
created_at
```
- This is also useful for auditing and duplicate protection

8. Redis
- Redis can be used to store the leaderboard for fast access
- A Redis Sorted Set is a good fit because users can be sorted directly by score
- The database remains the source of truth, while Redis improves leaderboard performance

9. WebSocket Server
- The WebSocket Server sends leaderboard updates to connected users in real time

When a score changes:
```
Score updated
    ↓
Leaderboard updated
    ↓
WebSocket broadcast
    ↓
Connected clients receive new Top 10
```
- This means users do not need to refresh the page

10. All Clients
- These are all users currently viewing the leaderboard
- When the Top 10 changes, the WebSocket Server broadcasts the latest leaderboard to all connected clients

## API Structure
The API should be designed around actions and leaderboard data instead of allowing the client to directly update a user's score.

1. Complete Action
- POST /api/v1/actions/:actionId/complete

Example request:
```
Authorization: Bearer <access_token>
Content-Type: application/json
{ "score": 10 }
```
Example response:
```
{
  "result": {
    "success": true,
    "scoreAdded": 10,
    "currentScore": 520
  },
  "meta": {}
}
```
- The client reports that a specific action has been completed and sends the corresponding `actionId`
- The `actionId` is generated and stored by the backend in the database, not created by the client
- The backend uses the `actionId` to load the action information and the related scoring rule from the database
- The client can send the score earned from the completed action, but the backend must not trust this value directly
- The backend validates the requested score against the server-side rule associated with the `actionId` before updating the user's score
- The backend checks whether the combination of `userId` and `actionId` has already been processed
- If the same action has already been completed and rewarded for that user, the server returns the previous result without increasing the score again
- If the action is valid and has not been processed before, the backend creates a score event and updates the user's score
- The processed action and result should be stored in `score_events` for duplicate protection, audit history, and troubleshooting

2. Get Leaderboard
- GET /api/v1/leaderboard?page=1&pageSize=2

Example response:
```
{
  "result": [
    {
      "id": "user_1",
      "rank": 1,
      "name": "John",
      "score": 1000
    },
    {
      "id": "user_2",
      "rank": 2,
      "name": "Anna",
      "score": 950
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 2,
      "totalPage": 5
    }
  }
}
```
- This endpoint provides the leaderboard when the page is loaded

3. Get Current User Score
- GET /api/v1/users/me/score

Example response:
```
{
  "result": {
    "id": "userId",
    "rank": 1,
    "name": "John",
    "score": 1000
  },
  "meta": {}
}
```
- this endpoint to see their own score and ranking

4. WebSocket Connection
- /ws/leaderboard

Example event:
```
{
  "event": "leaderboard.updated",
  "data": {
    "users": [
      {
        "rank": 1,
        "userId": "user_1",
        "name": "John",
        "score": 1020
      }
    ]
  }
}
```
- The leaderboard must be updated in real time
- Instead of continuously calling the leaderboard API, the server pushes the latest Top 10 leaderboard to connected clients whenever the ranking changes

## Sequence Diagram

## Sequence Diagram

```text
User        Client        API Server      Auth       Validator      Score Service      Database      Redis      WebSocket
 |             |              |             |            |               |                |            |            |
 | Complete    |              |             |            |               |                |            |            |
 | action      |              |             |            |               |                |            |            |
 |------------>|              |             |            |               |                |            |            |
 |             | Generate     |             |            |               |                |            |            |
 |             | actionId     |             |            |               |                |            |            |
 |             |              |             |            |               |                |            |            |
 |             | POST /actions/:actionId/complete        |               |                |            |            |
 |             | { score }    |             |            |               |                |            |            |
 |             |------------->|             |            |               |                |            |            |
 |             |              | Validate token           |               |                |            |            |
 |             |              |------------>|            |               |                |            |            |
 |             |              |<------------|            |               |                |            |            |
 |             |              | Authenticated user       |               |                |            |            |
 |             |              |                          |               |                |            |            |
 |             |              | Check actionId           |               |                |            |            |
 |             |              |---------------------------------------------------------->|            |            |
 |             |              |<----------------------------------------------------------|            |            |
 |             |              |                          |               |                |            |            |
 |             |              | Validate action & score  |               |                |            |            |
 |             |              |------------------------->|               |                |            |            |
 |             |              |<-------------------------|               |                |            |            |
 |             |              |                          |               |                |            |            |
 |             |              | Process score update     |               |                |            |            |
 |             |              |----------------------------------------->|                |            |            |
 |             |              |                          |               | Save event     |            |            |
 |             |              |                          |               |--------------->|            |            |
 |             |              |                          |               | Update score   |            |            |
 |             |              |                          |               |--------------->|            |            |
 |             |              |                          |               |<---------------|            |            |
 |             |              |                          |               |                |            |            |
 |             |              |                          |               | Update leaderboard          |            |
 |             |              |                          |               |---------------------------->|            |
 |             |              |                          |               | Get Top 10     |            |            |
 |             |              |                          |               |---------------------------->|            |
 |             |              |                          |               |<----------------------------|            |
 |             |              |                          |               |                |            |            |
 |             |              |<-----------------------------------------|                |            |            |
 |             |<-------------| Success + current score  |               |                |            |            |
 |             |              |                          |               |                |            |            |
 |             | Generate new actionId                   |               |                |            |            |
 |             |              |                          |               |                |            |            |
 |             |              |                          |               | Publish leaderboard update               |
 |             |              |                          |               |----------------------------------------->|
 |             |<---------------------------------------------------------------------------------------------------|
 |             |                           Push latest Top 10                                                       |
```


## Database Design

```text
+--------------------+
|       users        |
+--------------------+
| PK id              |
|    name            |
|    score           |
|    created_at      |
|    updated_at      |
+---------+----------+
          |
          | 1
          |
          | N
          v
+-------------------------+
|      score_events       |
+-------------------------+
| PK id                   |
| FK user_id              |
| FK action_rule_id       |
|    action_id            |
|    requested_score      |
|    approved_score       |
|    status               |
|    created_at           |
+------------+------------+
             |
             | N
             |
             | 1
             v
+-------------------------+
|      action_rules       |
+-------------------------+
| PK id                   |
|    code                 |
|    allowed_score        |
|    is_active            |
|    created_at           |
|    updated_at           |
+-------------------------+
```

### 1. Users

Stores the user's current score.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | User identifier |
| `name` | VARCHAR | User display name |
| `score` | INTEGER | Current total score |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update time |

The `score` field is updated atomically whenever a valid action is processed.

---

### 2. Action Rules

Stores server-side rules used to validate the score sent by the client.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Rule identifier |
| `code` | VARCHAR | Action type or action code |
| `allowed_score` | INTEGER | Score allowed for this action |
| `is_active` | BOOLEAN | Whether the rule can currently be used |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update time |

Example:

```text
DAILY_CHECK_IN   -> 10 points
COMPLETE_TASK    -> 20 points
WIN_MATCH        -> 50 points
```

The client can send a score, but the backend validates it against this rule before applying it.

---

### 3. Score Events

Stores every processed score update and provides duplicate protection and audit history.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Event identifier |
| `user_id` | UUID | User who completed the action |
| `action_rule_id` | UUID | Rule used to validate the score |
| `action_id` | UUID | Client-generated idempotency key |
| `requested_score` | INTEGER | Score sent by the client |
| `approved_score` | INTEGER | Score accepted by the backend |
| `status` | VARCHAR | `SUCCESS`, `REJECTED`, etc. |
| `created_at` | TIMESTAMP | Processing time |

A unique constraint should be created on:

```text
(user_id, action_id)
```

This guarantees that the same action request cannot increase the user's score more than once.

---

### Relationships

```text
users 1 -------- N score_events

action_rules 1 - N score_events
```

A user can have many score events.

An action rule can be used by many score events.

---

### Redis Leaderboard

The leaderboard does not need to be stored in a separate database table.

Redis Sorted Set can be used:

```text
leaderboard

user_1 -> 1000
user_2 -> 950
user_3 -> 900
```
The database remains the source of truth, while Redis is used for fast ranking and Top 10 queries.
