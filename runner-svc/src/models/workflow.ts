import mongoose, { Schema, InferSchemaType } from 'mongoose';

export enum WorkflowTrigger {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled'
}

export enum WorkflowAction {
  LOG = 'log',
  HTTP_REQUEST = 'http-request'
}

export enum WorkflowStatus {
  ACTIVE = 'active',
  SCHEDULED = 'scheduled',
  LOCKED = 'locked'
}

const TriggerSchema = new Schema({
  type: { type: String, enum: WorkflowTrigger, default: WorkflowTrigger.MANUAL },
  interval: Number,
  next_run: Date
}, { _id: false });

const ActionSchema = new Schema({
  action_id: { type: Number, required: true },
  type: { type: String, enum: WorkflowAction, default: WorkflowAction.LOG },
  url: String,
  method: String,
  message: String
}, { _id: false });

const WorkflowSchema = new Schema({
  workflow_id: { type: String, unique: true },
  status: { type: String, enum: WorkflowStatus, default: WorkflowStatus.ACTIVE },
  created_at: { type: Date, default: Date.now },
  trigger: TriggerSchema,
  actions: [ActionSchema]
});

export type WorkflowActionDB = InferSchemaType<typeof ActionSchema>;
export type WorkflowDB = InferSchemaType<typeof WorkflowSchema>;

export const Workflow = mongoose.model('Workflow', WorkflowSchema, 'workflows');