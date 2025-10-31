const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Bağlantısı
mongoose.connect('mongodb://localhost:27017/ogrenci-sistemi', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB bağlantısı başarılı'))
.catch(err => console.log('❌ MongoDB bağlantı hatası:', err));

// Models
const User = require('./models/User');
const Word = require('./models/Word');

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Sunucu çalışıyor!' });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { studentId, password } = req.body;

    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(401).json({ message: 'Öğrenci bulunamadı' });
    }

    if (password !== user.password) {
      return res.status(401).json({ message: 'Yanlış şifre' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Hesabınız geçici olarak askıya alınmıştır' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        studentId: user.studentId,
        name: user.name,
        class: user.class,
        isFirstLogin: user.isFirstLogin,
        points: user.points,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { studentId, newPassword } = req.body;

    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Şifre başarıyla güncellendi' 
    });

  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    res.status(500).json({ message: 'Şifre güncelleme hatası', error: error.message });
  }
});

// Kelime routes
app.post('/api/words/add', async (req, res) => {
  try {
    const { word, meaning, language, studentId } = req.body;

    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı' });
    }

    const newWord = new Word({
      word,
      meaning,
      language,
      studentId,
      studentName: user.name,
      studentClass: user.class,
      points: 10,
      status: 'pending'
    });

    await newWord.save();

    res.json({
      success: true,
      message: 'Kelime onay için gönderildi! Admin onayından sonra +10 puan alacaksınız.',
      word: newWord
    });

  } catch (error) {
    console.error('Kelime ekleme hatası:', error);
    res.status(500).json({ message: 'Kelime ekleme hatası', error: error.message });
  }
});

// Tüm kelimeleri getir - SADECE ONAYLANMIŞ KELİMELER ve CÜMLELER
app.get('/api/words/all', async (req, res) => {
  try {
    const words = await Word.find({ status: 'approved' }).sort({ createdAt: -1 });
    
    // Cümleleri filtrele: sadece onaylanmış cümleleri göster
    const filteredWords = words.map(word => {
      const wordObj = word.toObject();
      if (wordObj.sentenceStatus !== 'approved') {
        wordObj.sentence = '';
        wordObj.sentenceStatus = '';
        wordObj.sentenceLanguage = '';
      }
      return wordObj;
    });
    
    res.json({ success: true, words: filteredWords });
  } catch (error) {
    res.status(500).json({ message: 'Kelimeleri getirme hatası', error: error.message });
  }
});

// Kelime ara
app.get('/api/words/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    let words;
    if (q && q.trim() !== '') {
      words = await Word.find({
        status: 'approved',
        $or: [
          { word: { $regex: q, $options: 'i' } },
          { meaning: { $regex: q, $options: 'i' } }
        ]
      }).sort({ createdAt: -1 });
    } else {
      words = await Word.find({ status: 'approved' }).sort({ createdAt: -1 });
    }

    // Cümleleri filtrele
    const filteredWords = words.map(word => {
      const wordObj = word.toObject();
      if (wordObj.sentenceStatus !== 'approved') {
        wordObj.sentence = '';
        wordObj.sentenceStatus = '';
        wordObj.sentenceLanguage = '';
      }
      return wordObj;
    });

    res.json({ success: true, words: filteredWords });
  } catch (error) {
    res.status(500).json({ message: 'Arama hatası', error: error.message });
  }
});

// Like/Dislike
app.post('/api/words/vote', async (req, res) => {
  try {
    const { wordId, type, studentId } = req.body;

    const word = await Word.findById(wordId);
    if (!word) {
      return res.status(404).json({ message: 'Kelime bulunamadı' });
    }

    if (word.status !== 'approved') {
      return res.status(400).json({ message: 'Bu kelime henüz onaylanmamış' });
    }

    if (!word.votedUsers) {
      word.votedUsers = [];
    }

    const existingVote = word.votedUsers.find(vote => vote.studentId === studentId);
    
    if (existingVote) {
      if (existingVote.voteType === type) {
        return res.json({
          success: false,
          message: 'Bu kelimeye zaten oy vermişsiniz!'
        });
      }
      
      if (existingVote.voteType === 'like') {
        word.likes = Math.max(0, word.likes - 1);
      } else {
        word.dislikes = Math.max(0, word.dislikes - 1);
      }
      
      word.votedUsers = word.votedUsers.filter(vote => vote.studentId !== studentId);
    }

    if (type === 'like') {
      word.likes += 1;
    } else {
      word.dislikes += 1;
    }

    word.votedUsers.push({
      studentId: studentId,
      voteType: type,
      votedAt: new Date()
    });

    await word.save();

    const user = await User.findOne({ studentId });
    let pointsAdded = 0;
    
    if (user && !existingVote) {
      user.points += 1;
      pointsAdded = 1;
      await user.save();
    }

    res.json({
      success: true,
      message: existingVote ? 'Oyunuz güncellendi!' : `Oy verildi! +${pointsAdded} puan`,
      word,
      newPoints: user ? user.points : 0
    });

  } catch (error) {
    console.error('Oy verme hatası:', error);
    res.status(500).json({ message: 'Oy verme hatası', error: error.message });
  }
});

// Cümle ekleme - DİLE GÖRE PUAN
app.post('/api/words/add-sentence', async (req, res) => {
  try {
    const { wordId, sentence, studentId, sentenceLanguage } = req.body;

    const word = await Word.findById(wordId);
    if (!word) {
      return res.status(404).json({ message: 'Kelime bulunamadı' });
    }

    if (word.status !== 'approved') {
      return res.status(400).json({ message: 'Bu kelime henüz onaylanmamış' });
    }

    if (word.sentence && word.sentenceStatus === 'approved') {
      return res.status(400).json({ 
        message: 'Bu kelimeye zaten onaylanmış bir cümle eklenmiş. Başka cümle eklenemez!' 
      });
    }

    const pointsMap = {
      'turkish': 5,
      'english': 7,
      'arabic': 10
    };
    
    const sentencePoints = pointsMap[sentenceLanguage] || 5;

    word.sentence = sentence;
    word.sentenceStudentId = studentId;
    word.sentenceLanguage = sentenceLanguage;
    word.sentenceStatus = 'pending';
    word.sentencePoints = sentencePoints;

    await word.save();

    res.json({
      success: true,
      message: `Cümle onay için gönderildi! Admin onayından sonra +${sentencePoints} puan alacaksınız.`,
      word
    });

  } catch (error) {
    console.error('Cümle ekleme hatası:', error);
    res.status(500).json({ message: 'Cümle ekleme hatası', error: error.message });
  }
});

// YÖNETİCİ PANELİ ROUTES
app.get('/api/admin/pending-words', async (req, res) => {
  try {
    const pendingWords = await Word.find({ status: 'pending' }).sort({ createdAt: -1 });
    
    const pendingSentences = await Word.find({ 
      sentenceStatus: 'pending', 
      sentence: { $ne: "" } 
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      pendingWords,
      pendingSentences
    });
  } catch (error) {
    res.status(500).json({ message: 'Admin verileri getirme hatası', error: error.message });
  }
});

// Kelime onayla/reddet
app.post('/api/admin/word-action', async (req, res) => {
  try {
    const { wordId, action, adminId } = req.body;

    const word = await Word.findById(wordId);
    if (!word) {
      return res.status(404).json({ message: 'Kelime bulunamadı' });
    }

    if (action === 'approve') {
      word.status = 'approved';
      
      const user = await User.findOne({ studentId: word.studentId });
      if (user) {
        user.points += 10;
        await user.save();
      }
      
      await word.save();
      
      res.json({
        success: true,
        message: 'Kelime onaylandı! Öğrenciye +10 puan verildi.',
        word
      });
    } else if (action === 'reject') {
      word.status = 'rejected';
      await word.save();
      
      res.json({
        success: true,
        message: 'Kelime reddedildi.',
        word
      });
    }

  } catch (error) {
    console.error('Kelime onay/red hatası:', error);
    res.status(500).json({ message: 'İşlem hatası', error: error.message });
  }
});

// Cümle onayla/reddet
app.post('/api/admin/sentence-action', async (req, res) => {
  try {
    const { wordId, action, adminId } = req.body;

    const word = await Word.findById(wordId);
    if (!word) {
      return res.status(404).json({ message: 'Kelime bulunamadı' });
    }

    if (action === 'approve') {
      word.sentenceStatus = 'approved';
      
      const user = await User.findOne({ studentId: word.sentenceStudentId });
      if (user) {
        user.points += word.sentencePoints;
        await user.save();
      }
      
      await word.save();
      
      res.json({
        success: true,
        message: `Cümle onaylandı! Öğrenciye +${word.sentencePoints} puan verildi.`,
        word
      });
    } else if (action === 'reject') {
      word.sentenceStatus = 'rejected';
      word.sentence = '';
      word.sentenceStudentId = '';
      word.sentenceLanguage = '';
      await word.save();
      
      res.json({
        success: true,
        message: 'Cümle reddedildi.',
        word
      });
    }

  } catch (error) {
    console.error('Cümle onay/red hatası:', error);
    res.status(500).json({ message: 'İşlem hatası', error: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Sunucu http://localhost:${PORT} adresinde çalışıyor`);
  console.log(`✅ Cümle sistemi: Onaylanmayan cümleler gizli`);
  console.log(`🎯 Cümle puanları: TR: +5, EN: +7, AR: +10`);
});