import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AbstractDocument } from 'src/database';

@Schema({ versionKey: false, timestamps: true })
export class CollaborationRequest extends AbstractDocument {
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

  @Prop({ type: Number, default: 0 })
  requestCount?: 0;
}

export const CollaborationRequestSchema =
  SchemaFactory.createForClass(CollaborationRequest);
