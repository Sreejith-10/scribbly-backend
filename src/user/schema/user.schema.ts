import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from 'src/database';

@Schema({ versionKey: false })
export class User extends AbstractDocument {
  @Prop({ type: String, required: true })
  username: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ default: null })
  avatarUrl?: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String })
  hashRt: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
