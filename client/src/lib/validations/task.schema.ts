import { z } from "zod";

export const TaskStatusSchema = z.enum(["todo", "in_progress", "review", "done"]);
export const TaskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const TaskTypeSchema = z.enum(["task", "bug", "feature", "nudge"]);

export const CreateTaskSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().optional(),
  status: TaskStatusSchema.default("todo"),
  type: TaskTypeSchema.default("task"),
  assigneeId: z.string().uuid("Invalid assignee ID").optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  priority: TaskPrioritySchema.default("medium"),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  id: z.string().uuid("Invalid task ID"),
});

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
