import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AbstractDocument } from 'src/database';

@Schema({ versionKey: false, timestamps: true })
export class Board extends AbstractDocument {
  @Prop({ required: true, ref: 'User' })
  ownerId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ default: null })
  description?: string;

  @Prop({ type: Object, default: { shapes: {}, version: 0 } })
  snapshot: {
    shapes: Record<PropertyKey, any>;
    version: 0;
  };

  @Prop({
    enum: ['private', 'public'],
    default: 'private',
  })
  accessMode: 'private' | 'public';

  @Prop({ ref: 'User', default: [] })
  collaborators: Types.ObjectId[];

  @Prop({ type: [Object], default: [] })
  deltas: Array<{
    operation: 'create' | 'update' | 'delete';
    shapeId: string;
    data?: any;
    timestamp: Date;
    author: Types.ObjectId;
    sequence: number;
  }>;

  @Prop({ type: Number, default: 0 })
  sequence: number;
}

export const BoardSchema = SchemaFactory.createForClass(Board);
