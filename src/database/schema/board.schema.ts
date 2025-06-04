import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ versionKey: '__v', timestamps: true })
export class Board extends Document {
  @Prop({ required: true, ref: 'User' })
  ownerId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ default: null })
  description?: string;

  @Prop({ default: [] })
  shapes: Record<PropertyKey, any>[];

  @Prop({
    enum: ['private', 'request_access', 'public'],
    default: 'private',
  })
  accessMode: 'private' | 'request_access' | 'public';

  @Prop({ ref: 'User', default: [] })
  collaborators: Types.ObjectId[];
}

export const BoardSchema = SchemaFactory.createForClass(Board);
