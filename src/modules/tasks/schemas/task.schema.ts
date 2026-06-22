import { z } from 'zod';
import { ResourceVisibility, TaskPriority, TaskStatus } from '@/common/constants/enums';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Task title is required').max(200),
    description: z.string().max(2000).optional(),
    boardId: objectIdSchema,
    columnId: objectIdSchema,
    workspaceId: objectIdSchema,
    priority: z.nativeEnum(TaskPriority).optional(),
    dueDate: z.string().datetime().optional(),
    assignees: z.array(objectIdSchema).optional(),
    visibility: z.nativeEnum(ResourceVisibility).optional(),
    allowedMembers: z.array(objectIdSchema).optional(),
    labels: z.array(objectIdSchema).optional(),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    columnId: objectIdSchema.optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    order: z.number().optional(),
    dueDate: z.string().datetime().optional(),
    assignees: z.array(objectIdSchema).optional(),
    visibility: z.nativeEnum(ResourceVisibility).optional(),
    allowedMembers: z.array(objectIdSchema).optional(),
    labels: z.array(objectIdSchema).optional(),
  }),
});

export const taskListQuerySchema = z.object({
  query: z.object({
    workspaceId: objectIdSchema.optional(),
    boardId: objectIdSchema.optional(),
    columnId: objectIdSchema.optional(),
    assigneeId: objectIdSchema.optional(),
    labelId: objectIdSchema.optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    keyword: z.string().optional(),
    overdue: z.coerce.boolean().optional(),
    dueBefore: z.string().datetime().optional(),
    dueAfter: z.string().datetime().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const markTaskSchema = z.object({
  body: z.object({
    marked: z.boolean(),
  }),
});

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment content is required'),
    taskId: objectIdSchema,
  }),
});

export const reorderTasksSchema = z.object({
  body: z.object({
    boardId: objectIdSchema,
    columnId: objectIdSchema,
    tasks: z.array(z.object({
      id: objectIdSchema,
      order: z.number().min(0),
    })).min(1),
  }),
});
