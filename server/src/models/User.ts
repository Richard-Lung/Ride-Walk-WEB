import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

UserSchema.methods.setPassword = async function (plain: string) {
  const saltRounds = 12;
  this.passwordHash = await bcrypt.hash(plain, saltRounds);
};

UserSchema.methods.validatePassword = function (plain: string) {
  return bcrypt.compare(plain, this.passwordHash);
};

export default mongoose.model("User", UserSchema);
