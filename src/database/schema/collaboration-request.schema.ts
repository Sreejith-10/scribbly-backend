import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ versionKey: '__v', timestamps: true })
export class CollaborationRequest extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Board', index: true })
  boardId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  })
  status?: 'pending' | 'accepted' | 'rejected';

  @Prop({ type: Date, default: Date.now })
  requestedAt?: Date;

  @Prop({ type: Date, expires: 86400 })
  expiresAt?: Date;
}

export const CollaborationRequestSchema =
  SchemaFactory.createForClass(CollaborationRequest);
