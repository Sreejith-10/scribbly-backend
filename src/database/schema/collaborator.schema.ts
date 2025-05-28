import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ versionKey: '__v', timestamps: true })
export class Collaborator extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Board' })
  boardId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ['view', 'edit'], default: 'view' })
  role?: 'view' | 'edit';

  @Prop({ type: Date })
  lastSeen?: Date;
}

export const CollaboratorSchema = SchemaFactory.createForClass(Collaborator);
