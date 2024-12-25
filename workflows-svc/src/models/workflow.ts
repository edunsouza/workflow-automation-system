import mongoose, { Schema } from 'mongoose';

export enum WorkflowTrigger {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled'
}

const TriggerSchema = new Schema({
  type: { type: String, enum: WorkflowTrigger, default: WorkflowTrigger.MANUAL },
  interval: Number,
  next_run: Date
}, { _id: false });

export enum WorkflowAction {
  LOG = 'log',
  HTTP_REQUEST = 'http-request'
}

const ActionSchema = new Schema({
  action_id: { type: Number, required: true },
  type: { type: String, enum: WorkflowAction, default: WorkflowAction.LOG },
  url: String,
  method: String,
  message: String
}, { _id: false });


export enum WorkflowStatus {
  ACTIVE = 'active',
  SCHEDULED = 'scheduled',
  LOCKED = 'locked'
}

const WorkflowSchema = new Schema({
  workflow_id: { type: String, unique: true },
  status: { type: String, enum: WorkflowStatus, default: WorkflowStatus.ACTIVE },
  created_at: { type: Date, default: Date.now },
  trigger: TriggerSchema,
  actions: [ActionSchema]
});

export const Workflow = mongoose.model('Workflow', WorkflowSchema, 'workflows');