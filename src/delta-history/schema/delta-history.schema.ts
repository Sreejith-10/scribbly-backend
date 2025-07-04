import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AbstractDocument } from 'src/database';

@Schema({ versionKey: false, timestamps: true })
export class DeltaHistory extends AbstractDocument {
  @Prop({ type: Types.ObjectId, ref: 'Board', required: true })
  boardId: Types.ObjectId;

  @Prop({ type: Object, required: true })
  delta: any;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;
}

export const DeltaHistorySchema = SchemaFactory.createForClass(DeltaHistory);
