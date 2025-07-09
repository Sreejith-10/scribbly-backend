import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AbstractDocument } from 'src/database';

@Schema({ versionKey: false, timestamps: true })
export class Collaborator extends AbstractDocument {
  @Prop({ type: Types.ObjectId, ref: 'Board' })
  boardId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ['view', 'edit'], default: 'view' })
  role?: 'view' | 'edit';

  @Prop({ type: String, enum: ['active', 'inactive'], default: 'inactive' })
  status?: 'active' | 'inactive';

  @Prop({ type: Date })
  lastSeen?: Date;
}

export const CollaboratorSchema = SchemaFactory.createForClass(Collaborator);
