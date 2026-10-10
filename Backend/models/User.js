// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Using bcryptjs for consistent cross-platform runtimes

const UserSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please add a name'] },
  email: {
    type: String,
    required: [true, 'Please add a valid email'],
    unique: true,
    lowercase: true, // A@x.com and a@x.com are the same person
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/, 'Please add a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },

  // Phone-app device key. Only the SHA-256 hash is stored.
  deviceKeyHash: { type: String, select: false, unique: true, sparse: true },
  deviceKeyPrefix: { type: String }, // e.g. "fina_ab12cd", safe to display
  deviceKeyCreatedAt: { type: Date },
  deviceLastSeenAt: { type: Date } // shows "last sent 2 min ago" in the dashboard
}, { timestamps: true });

// Encrypt password using bcrypt before saving
// (async hook: Mongoose 9 no longer passes `next`, so just return / throw)
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);