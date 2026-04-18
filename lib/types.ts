import { z } from "zod";

export const TaskType = z.enum([
  "create",
  "modify",
  "bug",
  "understand",
  "script",
  "refactor",
]);
export type TaskType = z.infer<typeof TaskType>;

export const Size = z.enum(["small", "medium", "large"]);
export type Size = z.infer<typeof Size>;

export const CreateRequest = z.object({
  mode: z.literal("create"),
  goal: z.string().min(5),
  taskType: TaskType,
  size: Size,
  context: z.string().optional().default(""),
  coach: z.boolean().optional().default(true),
});
export type CreateRequest = z.infer<typeof CreateRequest>;

export const ImproveRequest = z.object({
  mode: z.literal("improve"),
  prompt: z.string().min(5),
  response: z.string().optional().default(""),
});
export type ImproveRequest = z.infer<typeof ImproveRequest>;

export const GenerateRequest = z.discriminatedUnion("mode", [
  CreateRequest,
  ImproveRequest,
]);
export type GenerateRequest = z.infer<typeof GenerateRequest>;

export type ModelRecommendation = {
  primary: string;
  strategy: "solo" | "solo-with-plan" | "advisor";
  reason: string;
  switchCmd: string;
};

export type Followup = { title: string; body: string };

export type Issue = {
  severity: "high" | "medium" | "low";
  label: string;
  detail: string;
};

export type CreateResult = {
  mode: "create";
  source: "llm" | "template";
  model: ModelRecommendation;
  claudeMd: string;
  initialPrompt: string;
  followups: Followup[];
  howto: string;
};

export type ImproveResult = {
  mode: "improve";
  source: "llm" | "template";
  issues: Issue[];
  improvedPrompt: string;
};

export type GenerateResult = CreateResult | ImproveResult;
