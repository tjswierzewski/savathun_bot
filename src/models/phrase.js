import { model, Schema } from 'mongoose';

const phraseSchema = new Schema(
  {
    phrase: String,
  },
  { timestamps: { createdAt: 'created_at' } },
);

const Phrase = model('Phrase', phraseSchema);

export default Phrase;
