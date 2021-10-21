import { model, Schema } from 'mongoose';

const triggerSchema = new Schema(
  {
    trigger: String,
  },
  { timestamps: { createdAt: 'created_at' } },
);

const Trigger = model('Trigger', triggerSchema);

export default Trigger;
