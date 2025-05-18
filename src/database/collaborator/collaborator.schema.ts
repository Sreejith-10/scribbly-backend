import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../abstract.schema';
import { Types } from 'mongoose';

@Schema()
export class Collaborator extends AbstractDocument {
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
