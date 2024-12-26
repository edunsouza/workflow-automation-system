import { randomUUID } from 'node:crypto';
import mongoose, { Schema, InferSchemaType } from 'mongoose';

const uuid = () => randomUUID();

export enum ExecutionStatus {
  OK = 'ok',
  PENDING = 'pending',
  FAILED = 'failed'
}

export enum ActionStatus {
  OK = 'ok',
  FAILED = 'failed',
}

const ActionSchema = new Schema({
  action_id: { type: Number, required: true },
  status: { type: String, enum: ActionStatus, default: ActionStatus.OK },
  logs: String
}, { _id: false });

const ExecutionSchema = new Schema({
  id: { type: String, default: uuid, unique: true },
  workflow_id: String,
  status: { type: String, enum: ExecutionStatus, default: ExecutionStatus.PENDING },
  created_at: { type: Date, default: Date.now },
  finished_at: { type: Date, default: null },
  retries: Number,
  last_failed_action: Number,
  total_actions: Number,
  executed_actions: [ActionSchema]
});

export type ExecutionActionDB = InferSchemaType<typeof ActionSchema>;
export type ExecutionDB = InferSchemaType<typeof ExecutionSchema>;

export const Execution = mongoose.model('Execution', ExecutionSchema, 'executions');