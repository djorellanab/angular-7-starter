import * as bcrypt from 'bcryptjs';
import { Model, model, Schema } from 'mongoose';
import { IUserDocument } from '../interfaces/IUserDocument';
import * as timestamps from 'mongoose-timestamp';
import * as _ from 'lodash';

const validateRole = (value) => {
  const validArr = ['super_admin', 'admin', 'super_moderator', 'moderator', 'support_admin', 'support_agent', 'user'];
  return _.includes(validArr, value);
};

export interface IUser extends IUserDocument {
  comparePassword(password: string, callback: object): boolean;
}

export interface IUserModel extends Model<IUser> {
  hashPassword(password: string): boolean;
}

export const userSchema: Schema = new Schema({
  firstname: { type: String },
  lastname: { type: String },
  phonenumber: { type: String },
  address1: { type: String },
  address2: { type: String },
  city: { type: String },
  country: { type: String },
  zipcode: { type: String },
  postalcode: { type: String },
  email: { type: String, unique: true, lowercase: true, trim: true },
  password: { type: String },
  role: { type: String, default: 'user', validate: [{ validator: validateRole, msg: 'incorrect role data', errorCode: 422 }] },
});

// Before saving the user, hash the password
userSchema.pre('save', function (next) {
  const user = this;
  if (!user.isModified('password')) {
    return next();
  }
  bcrypt.genSalt(10, function (err, salt) {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.password, salt, function (error, hash) {
      if (error) {
        return next(error);
      }
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function (candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
    if (err) {
      return callback(err);
    }
    callback(null, isMatch);
  });
};

userSchema.static('hashPassword', (password: string): string => {
  return bcrypt.hashSync(password);
});


// Omit the password when returning a user
userSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    delete ret.updatedAt;
    delete ret.password;
    // delete ret.role;
    return ret;
  },
});

userSchema.plugin(timestamps);

export const User: IUserModel = model<IUser, IUserModel>('User', userSchema);

export default User;