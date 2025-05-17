import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from 'src/database';

@Schema({ versionKey: false })
export class User extends AbstractDocument {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: false })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  hashRt: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
