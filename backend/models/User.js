const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  class: { type: String, required: true },
  profilePhoto: { type: String, default: '' },
  points: { type: Number, default: 0 },
  isFirstLogin: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  banUntil: { type: Date },
  role: { type: String, enum: ['student', 'admin'], default: 'student' } // ✅ ADMIN EKLENDİ
}, { timestamps: true });

// Şifre hashleme
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Şifre karşılaştırma
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model('User', userSchema);