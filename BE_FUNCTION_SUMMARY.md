# TÃ³m táº¯t chá»©c nÄƒng Backend SaaS

TÃ i liá»‡u nÃ y mÃ´ táº£ backend hiá»‡n táº¡i trong thÆ° má»¥c `src`. Backend dÃ¹ng Node.js, Express 5, TypeScript, MongoDB/Mongoose, JWT access token vÃ  refresh token, Zod validation, Winston/Morgan logging, Helmet, CORS vÃ  cookie-parser.

Base API:

```text
/api/v1
```

Health check:

```text
GET /health
```

## 1. Entry Point VÃ  Cáº¥u HÃ¬nh

- `src/server.ts`: káº¿t ná»‘i MongoDB, start server, graceful shutdown vÃ  báº¯t lá»—i process.
- `src/app.ts`: cáº¥u hÃ¬nh middleware, route `/api/v1`, health check, 404 handler vÃ  global error handler.
- `src/routes/index.ts`: gom route theo module.
- `src/configs/env.ts`: Ä‘á»c vÃ  validate `.env` báº±ng Zod.
- `src/configs/logger.ts`: ghi log ra console, `logs/error.log`, `logs/all.log`.

Biáº¿n mÃ´i trÆ°á»ng chÃ­nh:

- `NODE_ENV`
- `PORT`
- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRES_IN`
- `FRONTEND_URL`

## 2. Middleware Chung

Middleware há»‡ thá»‘ng:

- `helmet()`
- `cors()` vá»›i `FRONTEND_URL` vÃ  credentials.
- `express.json({ limit: '10kb' })`
- `express.urlencoded({ extended: true, limit: '10kb' })`
- `cookieParser()`
- `morgan('dev')` trong development.

Middleware auth:

- `protect`: yÃªu cáº§u `Authorization: Bearer <accessToken>`, verify JWT, kiá»ƒm tra user tá»“n táº¡i vÃ  khÃ´ng bá»‹ ban.
- `restrictTo`: role guard cÅ©, váº«n giá»¯ Ä‘á»ƒ tÆ°Æ¡ng thÃ­ch.
- `requirePlatformPermission(permission)`
- `requireWorkspacePermission(permission, workspaceIdSelector?)`

Middleware validation:

- `validate(schema)`: validate `body`, `query`, `params`, `cookies` báº±ng Zod.
- Khi sai validation, response cÃ³ `errors` dáº¡ng map theo field, vÃ­ dá»¥ `email`, `password`, `workspaceId`.

Middleware rate limit:

- `src/common/middlewares/rateLimit.ts`
- Äang Ã¡p dá»¥ng cho auth endpoints nháº¡y cáº£m nhÆ° register, login, refresh token, forgot password, reset password, verify email.

## 3. Response VÃ  Error Format

Response thÃ nh cÃ´ng:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Response lá»—i:

```json
{
  "success": false,
  "message": "...",
  "errors": {}
}
```

`AppError` há»— trá»£ `statusCode`, `isOperational`, `errors`. `globalErrorHandler` tráº£ lá»—i chi tiáº¿t trong development vÃ  áº©n lá»—i khÃ´ng operational trong production.

## 4. PhÃ¢n Quyá»n

Há»‡ thá»‘ng phÃ¢n quyá»n chÃ­nh náº±m trong:

- `src/common/authorization/permissions.ts`
- `src/common/authorization/accessControl.ts`
- `src/common/middlewares/authorize.ts`

Role platform:

- `SUPER_ADMIN`: override toÃ n bá»™ permission.
- `ADMIN`
- `USER`

Role workspace:

- `WORKSPACE_OWNER`
- `WORKSPACE_ADMIN`
- `MEMBER`
- `GUEST`

NhÃ³m permission chÃ­nh:

- Workspace: `workspace:create`, `workspace:view`, `workspace:update`, `workspace:delete`, `workspace:invite`, `workspace:remove_member`, `workspace:manage_roles`, `workspace:transfer_ownership`, `workspace:manage_settings`.
- Board: `board:create`, `board:view`, `board:update`, `board:delete`, `board:manage_visibility`.
- Task: `task:create`, `task:view`, `task:update`, `task:update_own`, `task:delete`, `task:assign`, `task:move`, `task:manage_private`.
- Comment/attachment: `comment:create`, `comment:view`, `attachment:upload`.
- Platform admin: `admin:access`, `user:manage`, `user:ban`.

Helper quan trá»ng:

- `assertPlatformPermission`
- `assertWorkspaceMember`
- `assertWorkspacePermission`
- `assertBoardAccess`
- `assertTaskAccess`
- `assertTaskDocumentAccess`
- `buildTaskVisibilityFilter`

## 5. Module Auth

Route prefix:

```text
/api/v1/auth
```

API:

| Method | Path | Chá»©c nÄƒng |
| --- | --- | --- |
| POST | `/register` | ÄÄƒng kÃ½ user má»›i |
| POST | `/login` | ÄÄƒng nháº­p |
| POST | `/refresh-token` | Táº¡o access token má»›i báº±ng refresh token cookie |
| POST | `/logout` | ÄÄƒng xuáº¥t |
| POST | `/forgot-password` | Táº¡o reset token |
| POST | `/reset-password` | Äáº·t láº¡i máº­t kháº©u báº±ng reset token |
| POST | `/verify-email` | XÃ¡c thá»±c email báº±ng verification token |

Ghi chÃº báº£o máº­t:

- Password hash báº±ng bcrypt.
- Refresh token Ä‘Æ°á»£c hash SHA-256 trÆ°á»›c khi lÆ°u vÃ o DB.
- Refresh token rotation khi refresh.
- Äá»•i máº­t kháº©u sáº½ revoke refresh token hiá»‡n táº¡i.
- Reset password vÃ  verify email hiá»‡n tráº£ token á»Ÿ API Ä‘á»ƒ phá»¥c vá»¥ development. Khi tÃ­ch há»£p email tháº­t, nÃªn gá»­i token qua email vÃ  khÃ´ng tráº£ token trá»±c tiáº¿p cho client.

## 6. Module Users

Route prefix:

```text
/api/v1/users
```

Táº¥t cáº£ route yÃªu cáº§u access token.

API:

| Method | Path | Chá»©c nÄƒng |
| --- | --- | --- |
| GET | `/me` | Láº¥y profile user hiá»‡n táº¡i |
| PATCH | `/me` | Cáº­p nháº­t `name`, `avatar` |
| PATCH | `/me/password` | Äá»•i máº­t kháº©u |
| DELETE | `/me` | Deactivate tÃ i khoáº£n hiá»‡n táº¡i |
| GET | `/` | Admin list/search users |
| PATCH | `/:id/role` | Admin cáº­p nháº­t platform role |
| PATCH | `/:id/ban` | Admin ban user |
| PATCH | `/:id/unban` | Admin unban user |

Model `User`:

- `name`, `email`, `password`
- `role`
- `avatar`
- `isEmailVerified`
- `refreshToken`
- `passwordResetToken`
- `passwordResetExpires`
- `emailVerificationToken`
- `lastLogin`
- `isBanned`
- `isDeleted`

## 7. Module Workspaces VÃ  Invitations

Route prefix:

```text
/api/v1/workspaces
```

API workspace:

| Method | Path | Chá»©c nÄƒng |
| --- | --- | --- |
| POST | `/` | Táº¡o workspace |
| GET | `/` | Láº¥y workspace cá»§a user |
| GET | `/:id` | Láº¥y chi tiáº¿t workspace |
| PATCH | `/:id` | Cáº­p nháº­t workspace |
| DELETE | `/:id` | XÃ³a má»m workspace |
| POST | `/:id/invitations` | Táº¡o invitation |
| PATCH | `/:id/members/:memberId/role` | Äá»•i role member |
| DELETE | `/:id/members/:memberId` | XÃ³a member |
| POST | `/:id/transfer-ownership/:memberId` | Chuyá»ƒn owner |

API invitation:

| Method | Path | Chá»©c nÄƒng |
| --- | --- | --- |
| GET | `/invitations/:token` | Xem invitation báº±ng token |
| POST | `/invitations/:token/accept` | Cháº¥p nháº­n invitation |
| POST | `/invitations/:token/reject` | Tá»« chá»‘i invitation |

Chá»©c nÄƒng chÃ­nh:

- Táº¡o workspace tá»± thÃªm creator lÃ m `WORKSPACE_OWNER`.
- Invitation cÃ³ token random, háº¿t háº¡n sau 7 ngÃ y.
- Accept invitation yÃªu cáº§u email user hiá»‡n táº¡i khá»›p email Ä‘Æ°á»£c má»i.
- Role Ä‘Æ°á»£c kiá»ƒm soÃ¡t báº±ng hierarchy, khÃ´ng cho admin/member gÃ¡n role báº±ng hoáº·c cao hÆ¡n mÃ¬nh.
- CÃ¡c thao tÃ¡c workspace/member/invitation Ä‘Æ°á»£c ghi activity log.
- Khi invite user Ä‘Ã£ tá»“n táº¡i, backend táº¡o notification cho user Ä‘Ã³.

## 8. Workflow Chinh

Workflow domain chinh:

```text
Workspace -> Board -> Column -> Task
```

Project khong con la domain chinh va route `/api/v1/projects` khong duoc mount trong `src/routes/index.ts`. Board thuoc truc tiep workspace; task thuoc truc tiep workspace, board va column.
## 9. Module Boards VÃ  Columns

Route prefix:

```text
/api/v1/boards
```

API board:

| Method | Path | Chá»©c nÄƒng |
| --- | --- | --- |
| POST | `/` | Tao board trong workspace, body can `workspaceId` hoac `workspace` |
| GET | `/workspace/:workspaceId` | Lay board theo workspace |
| GET | `/:id` | Láº¥y board kÃ¨m columns |
| PATCH | `/:id` | Cáº­p nháº­t board |
| DELETE | `/:id` | XÃ³a má»m board |

Khi táº¡o board, backend tá»± táº¡o 3 column máº·c Ä‘á»‹nh: `To Do`, `In Progress`, `Done`.

Route prefix column:

```text
/api/v1/columns
```

API column:

| Method | Path | Chá»©c nÄƒng |
| --- | --- | --- |
| POST | `/` | Táº¡o column trong board |
| PATCH | `/reorder` | Reorder columns |
| PATCH | `/:id` | Äá»•i tÃªn column |
| DELETE | `/:id` | XÃ³a má»m column náº¿u chÆ°a cÃ³ task |

Board há»— trá»£ `PUBLIC` vÃ  `PRIVATE`. Board private chá»‰ má»Ÿ cho owner/admin, creator hoáº·c `allowedMembers`.

## 10. Module Tasks VÃ  Labels

Route prefix:

```text
/api/v1/tasks
```

API task:

| Method | Path | Chá»©c nÄƒng |
| --- | --- | --- |
| POST | `/` | Táº¡o task |
| GET | `/marked` | Láº¥y task Ä‘Ã£ Ä‘Ã¡nh dáº¥u |
| GET | `/recent` | Láº¥y task gáº§n Ä‘Ã¢y |
| GET | `/my` | Láº¥y task Ä‘Æ°á»£c assign cho user hiá»‡n táº¡i |
| GET | `/search` | Search/filter task |
| GET | `/column/:columnId` | Láº¥y task theo column |
| PATCH | `/:id/mark` | ÄÃ¡nh dáº¥u/bá» Ä‘Ã¡nh dáº¥u task |
| PATCH | `/reorder` | Reorder task trong má»™t column |
| PATCH | `/:id` | Cáº­p nháº­t task |
| DELETE | `/:id` | XÃ³a má»m task |

Search/filter há»— trá»£:

- `workspaceId`, `boardId`, `columnId`
- `assigneeId`, `labelId`
- `priority`, `status`
- `keyword`
- `overdue`
- `dueBefore`, `dueAfter`
- `page`, `limit`

Chá»©c nÄƒng chÃ­nh:

- Validate workspace/board/column phai thuoc cung cay tai nguyen.
- Validate labels thuá»™c cÃ¹ng workspace.
- Task private cáº§n `task:manage_private`.
- Assign user khÃ¡c cáº§n `task:assign`.
- Guest chá»‰ xem task public, task Ä‘Æ°á»£c assign hoáº·c task náº±m trong `allowedMembers`.
- Táº¡o/cáº­p nháº­t/xÃ³a task ghi activity log.
- Khi user Ä‘Æ°á»£c assign task má»›i, backend táº¡o notification.

Route prefix label:

```text
/api/v1/labels
```

API label:

| Method | Path | Chá»©c nÄƒng |
| --- | --- | --- |
| POST | `/` | Táº¡o label |
| GET | `/workspace/:workspaceId` | Láº¥y label theo workspace |
| PATCH | `/:id` | Cáº­p nháº­t label |
| DELETE | `/:id` | XÃ³a label |

## 11. Module Comments VÃ  Attachments

Route prefix:

```text
/api/v1/comments
```

API:

| Method | Path | Chá»©c nÄƒng |
| --- | --- | --- |
| POST | `/` | ThÃªm comment vÃ o task |
| GET | `/task/:taskId` | Láº¥y comment theo task |
| PATCH | `/:id` | Sá»­a comment cá»§a chÃ­nh mÃ¬nh |
| DELETE | `/:id` | XÃ³a má»m comment |

Comment há»— trá»£ `attachments` dáº¡ng danh sÃ¡ch URL. Backend chÆ°a cÃ³ upload binary trá»±c tiáº¿p lÃªn local/S3/Cloudinary.

Khi thÃªm comment:

- Backend kiá»ƒm tra quyá»n xem task vÃ  quyá»n comment.
- Notification Ä‘Æ°á»£c gá»­i tá»›i assignees vÃ  creator cá»§a task, trá»« ngÆ°á»i comment.
- Activity log Ä‘Æ°á»£c ghi cho workspace.

## 12. Module Notifications

Route prefix:

```text
/api/v1/notifications
```

API:

| Method | Path | Chá»©c nÄƒng |
| --- | --- | --- |
| GET | `/` | Láº¥y notification cá»§a user hiá»‡n táº¡i |
| PATCH | `/read-all` | ÄÃ¡nh dáº¥u táº¥t cáº£ Ä‘Ã£ Ä‘á»c |
| PATCH | `/:id/read` | ÄÃ¡nh dáº¥u má»™t notification Ä‘Ã£ Ä‘á»c |

Query list:

- `unreadOnly`
- `page`
- `limit`

Notification hiá»‡n Ä‘Æ°á»£c táº¡o cho:

- Workspace invitation.
- User Ä‘Æ°á»£c assign task.
- Task cÃ³ comment má»›i.

## 13. Module Activity Logs

Route prefix:

```text
/api/v1/activities
```

API:

| Method | Path | Chá»©c nÄƒng |
| --- | --- | --- |
| GET | `/workspaces/:workspaceId` | Láº¥y activity feed theo workspace |

Query:

- `action`
- `entityType`
- `userId`
- `page`
- `limit`

Activity log hiá»‡n ghi cho:

- Workspace create/update/delete.
- Invitation create/accept/reject.
- Member role update/remove.
- Transfer ownership.
- Board create/update/delete.
- Task create/update/delete.
- Comment create.

## 14. Module Dashboard

Route prefix:

```text
/api/v1/dashboard
```

API:

| Method | Path | Chá»©c nÄƒng |
| --- | --- | --- |
| GET | `/` | Láº¥y sá»‘ liá»‡u tá»•ng quan dashboard cá»§a user hiá»‡n táº¡i |

Dashboard dem workspace, board, task trong pham vi user co quyen xem. Co `completedTasks`, `overdueTasks`, `myTasks`, `markedTasks`, `recentTasks`.

## 15. Nhá»¯ng Äiá»ƒm CÃ²n NÃªn LÃ m Tiáº¿p

CÃ¡c pháº§n Ä‘Ã£ Ä‘Æ°á»£c scaffold hoáº·c há»— trá»£ cÆ¡ báº£n nhÆ°ng chÆ°a pháº£i báº£n production Ä‘áº§y Ä‘á»§:

- Email service tháº­t cho verify email, forgot password vÃ  workspace invitation.
- Upload file binary tháº­t cho attachment qua S3, Cloudinary hoáº·c local storage.
- Realtime notification báº±ng Socket.IO hoáº·c SSE.
- Refresh token multi-session theo tá»«ng thiáº¿t bá»‹ thay vÃ¬ má»™t token hash trÃªn user.
- Test suite cho RBAC, visibility, invitation, task reorder, notification.
- API docs báº±ng Swagger/OpenAPI hoáº·c Postman collection.
- Billing/subscription náº¿u sáº£n pháº©m SaaS cáº§n gÃ³i tráº£ phÃ­.
