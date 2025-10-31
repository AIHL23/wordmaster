const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Basit login endpoint
router.post('/login', async (req, res) => {
  try {
    const { studentId, password } = req.body;

    console.log('Login denemesi:', studentId);

    // Kullanıcıyı bul
    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(401).json({ message: 'Öğrenci bulunamadı' });
    }

    // Şifre kontrolü (basit versiyon - sonra hash'leyeceğiz)
    if (password !== user.password) {
      return res.status(401).json({ message: 'Yanlış şifre' });
    }

    // Ban kontrolü
    if (user.isBanned) {
      return res.status(403).json({ message: 'Hesabınız geçici olarak askıya alınmıştır' });
    }

    // Başarılı giriş
    res.json({
      success: true,
      user: {
        id: user._id,
        studentId: user.studentId,
        name: user.name,
        class: user.class,
        isFirstLogin: user.isFirstLogin,
        points: user.points
      }
    });

  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Şifre değiştirme
router.post('/change-password', async (req, res) => {
  try {
    const { studentId, newPassword } = req.body;

    console.log('Şifre değiştirme:', studentId);

    // Kullanıcıyı bul
    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Yeni şifreyi kaydet
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

module.exports = router;