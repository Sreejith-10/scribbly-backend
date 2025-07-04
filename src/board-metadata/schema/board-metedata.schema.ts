import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AbstractDocument } from 'src/database';

@Schema({ versionKey: false, timestamps: true })
export class BoardMetadata extends AbstractDocument {
  @Prop({ required: true, ref: 'Board' })
  boardId: Types.ObjectId;

  @Prop({ required: true, ref: 'User' })
  ownerId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ default: null })
  description?: string;

  @Prop({ default: null })
  boardThumbnail?: string;

  @Prop({
    enum: ['private', 'request_access', 'public'],
    default: 'private',
  })
  accessMode: 'private' | 'request_access' | 'public';

  @Prop({ ref: 'User', default: [] })
  collaborators: Types.ObjectId[];
}

export const BoardMetadataSchema = SchemaFactory.createForClass(BoardMetadata);
