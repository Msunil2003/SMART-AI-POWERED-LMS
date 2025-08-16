import { model, Schema } from 'mongoose';

const paymentSchema = new Schema({
  payment_id: {
    type: String,
    required: true,
  },
  order_id: {
    type: String,
    required: true,
  },
  razorpay_signature: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, { timestamps: true });

export const Payment = model('Payment', paymentSchema);
