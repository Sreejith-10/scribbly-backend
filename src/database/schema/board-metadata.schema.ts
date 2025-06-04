import { Prop, Schema } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ versionKey: '__v', timestamps: true })
export class BoardMetadata extends Document {
  @Prop({ required: true, ref: 'Board' })
  boardId: Types.ObjectId;

  @Prop({ required: true, ref: 'User' })
  ownerId: Types.ObjectId;

  @Prop()
  boardThumbnail?: string;

  @Prop({ ref: 'User', default: [] })
  collaborators: Types.ObjectId[];
}
