import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ versionKey: '__v', timestamps: true })
export class User extends Document {
  @Prop({ type: String, required: true })
  firstName: string;

  @Prop({ type: String, required: true })
  lastName: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ default: String })
  avatarUrl?: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String })
  hashRt: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
