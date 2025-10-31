const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
  word: { type: String, required: true },
  meaning: { type: String, required: true },
  language: { type: String, enum: ['turkish', 'english', 'arabic'], required: true },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  studentClass: { type: String, required: true },
  points: { type: Number, default: 10 },
  
  // ✅ KELİME ONAY SİSTEMİ
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  
  // ✅ LIKE/DISLIKE SİSTEMİ (DÜZELTİLMİŞ)
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  votedUsers: [{
    studentId: String,
    voteType: String,
    votedAt: { type: Date, default: Date.now }
  }],
  
  // ✅ CÜMLE SİSTEMİ (DÜZELTİLMİŞ)
  sentence: { type: String, default: '' },
  sentenceStudentId: { type: String, default: '' },
  sentencePoints: { type: Number, default: 0 },
  
  // ✅ CÜMLE ONAY SİSTEMİ
  sentenceStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Word', wordSchema);