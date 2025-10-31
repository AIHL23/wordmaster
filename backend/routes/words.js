const express = require('express');
const Word = require('../models/Word');
const User = require('../models/User');
const router = express.Router();

// Kelime ekle
router.post('/add', async (req, res) => {
  try {
    const { word, meaning, language, studentId } = req.body;

    // Öğrenciyi bul
    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı' });
    }

    // Yeni kelime oluştur
    const newWord = new Word({
      word,
      meaning,
      language,
      studentId,
      studentName: user.name,
      studentClass: user.class,
      points: 10
    });

    await newWord.save();

    // Öğrenciye puan ekle
    user.points += 10;
    await user.save();

    res.json({
      success: true,
      message: 'Kelime başarıyla eklendi! +10 puan',
      word: newWord,
      newPoints: user.points
    });

  } catch (error) {
    console.error('Kelime ekleme hatası:', error);
    res.status(500).json({ message: 'Kelime ekleme hatası', error: error.message });
  }
});

// Tüm kelimeleri getir
router.get('/all', async (req, res) => {
  try {
    const words = await Word.find({ status: 'approved' })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, words });
  } catch (error) {
    res.status(500).json({ message: 'Kelimeleri getirme hatası', error: error.message });
  }
});

// Kelime ara
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    const words = await Word.find({
      status: 'approved',
      $or: [
        { word: { $regex: q, $options: 'i' } },
        { meaning: { $regex: q, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, words });
  } catch (error) {
    res.status(500).json({ message: 'Arama hatası', error: error.message });
  }
});

module.exports = router;