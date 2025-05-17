import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../abstract.schema';
import { Types } from 'mongoose';

@Schema({ versionKey: '__v', timestamps: true })
export class Board extends AbstractDocument {
  @Prop({ required: true, ref: 'User' })
  ownerId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  shapes: [];

  @Prop({
    enum: [
      'private',
      'collaborative_with_requset',
      'collaborative_public_link',
    ],
    default: 'private',
  })
  accessMode:
    | 'private'
    | 'collaborative_with_requset'
    | 'collaborative_public_link';

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  collaborators: Types.ObjectId[];

  @Prop({
    type: [
      {
        user: { type: Types.ObjectId, ref: 'User' },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected'],
          default: 'pending',
        },
        requestedAt: { type: Date, default: Date.now() },
      },
    ],
  })
  collaborationRequests: {
    user: Types.ObjectId;
    status: 'pending' | 'accepted' | 'rejected';
    requestedAt: Date;
  }[];

  @Prop()
  publicShareLink: string;
}

export const BoardSchema = SchemaFactory.createForClass(Board);
