import * as bcrypt from 'bcrypt';

export const hash = (
  data: string | Buffer,
  salt: string | number = 12,
): Promise<string> => {
  return bcrypt.hash(data, salt);
};
