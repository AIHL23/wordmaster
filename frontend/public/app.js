// Kullanıcı bilgilerini saklayacağımız değişken
let currentUser = null;
let allWords = [];
let currentEditingWordId = null;

// CÜMLE DİL SEÇİMİ DEĞİŞKENLERİ
let selectedSentenceLanguage = 'turkish';
let selectedSentencePoints = 5;

// Sayfa geçiş fonksiyonları
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

// DİL SEÇİMİ FONKSİYONU
function initLanguageSelection() {
    const langOptions = document.querySelectorAll('.lang-option');
    
    langOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Aktif sınıfını kaldır
            langOptions.forEach(opt => {
                opt.classList.remove('active');
            });
            
            // Tıklanana aktif sınıfı ekle
            this.classList.add('active');
            
            // Seçilen dili ve puanı güncelle
            selectedSentenceLanguage = this.dataset.lang;
            selectedSentencePoints = parseInt(this.dataset.points);
            
            // Görsel güncellemeler
            document.getElementById('sentencePoints').textContent = selectedSentencePoints;
            document.getElementById('selectedPoints').textContent = selectedSentencePoints;
            
            // Dil adını güncelle
            const langNames = {
                'turkish': 'Türkçe',
                'english': 'İngilizce', 
                'arabic': 'Arapça'
            };
            document.getElementById('selectedLangName').textContent = langNames[selectedSentenceLanguage];
        });
    });
}

// Cümle modal açıldığında dil seçimini başlat
function openSentenceModal(wordId) {
    const word = allWords.find(w => w._id === wordId);
    if (word) {
        currentEditingWordId = wordId;
        document.getElementById('modalWordName').textContent = word.word;
        document.getElementById('modalWordMeaning').textContent = word.meaning;
        document.getElementById('sentenceInput').value = word.sentence || '';
        document.getElementById('sentenceMessage').innerHTML = '';
        
        // Dil seçimini sıfırla (her açılışta Türkçe)
        selectedSentenceLanguage = 'turkish';
        selectedSentencePoints = 5;
        
        // Aktif butonu sıfırla
        document.querySelectorAll('.lang-option').forEach(opt => opt.classList.remove('active'));
        document.querySelector('.lang-option[data-lang="turkish"]').classList.add('active');
        
        // Puan bilgisini güncelle
        document.getElementById('sentencePoints').textContent = '5';
        document.getElementById('selectedPoints').textContent = '5';
        document.getElementById('selectedLangName').textContent = 'Türkçe';
        
        // Cümle onay durumuna göre mesaj göster
        if (word.sentence && word.sentenceStatus === 'pending') {
            document.getElementById('sentenceMessage').innerHTML = 
                '<div class="message warning">⏳ Cümleniz onay bekliyor</div>';
        }
        
        document.getElementById('sentenceModal').classList.add('active');
        
        // Dil seçimini başlat
        setTimeout(initLanguageSelection, 100);
    }
}

// ADMIN PANELİ FONKSİYONLARI - GERÇEK BACKEND BAĞLANTILI
function showAdminPage() {
    if (currentUser && currentUser.role === 'admin') {
        showPage('adminPage');
        loadAdminData();
    } else {
        alert('❌ Admin yetkiniz yok!');
    }
}

function showAdminTab(tabName) {
    // Tab butonlarını güncelle
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Tab içeriklerini güncelle
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById('admin' + tabName.charAt(0).toUpperCase() + tabName.slice(1) + 'Tab').classList.add('active');
}

async function loadAdminData() {
    // Admin verilerini backend'den yükle
    await loadPendingWords();
    await loadPendingSentences();
}

// GERÇEK: Backend'den onay bekleyen kelimeleri çek
async function loadPendingWords() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/pending-words');
        const data = await response.json();
        
        if (data.success) {
            displayPendingWords(data.pendingWords);
        } else {
            document.getElementById('pendingWordsList').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">❌</div>
                    <h3>Veri yüklenemedi</h3>
                </div>
            `;
        }
    } catch (error) {
        console.error('Admin kelime yükleme hatası:', error);
        document.getElementById('pendingWordsList').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔌</div>
                <h3>Sunucu bağlantı hatası</h3>
                <p>Backend çalışıyor mu kontrol edin</p>
            </div>
        `;
    }
}

function displayPendingWords(words) {
    const pendingWordsList = document.getElementById('pendingWordsList');
    
    if (!words || words.length === 0) {
        pendingWordsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✅</div>
                <h3>Onay bekleyen kelime yok</h3>
            </div>
        `;
        return;
    }
    
    pendingWordsList.innerHTML = words.map(word => `
        <div class="admin-item">
            <div class="item-info">
                <span class="lang-badge">${getLanguageFlag(word.language)} ${word.language.toUpperCase()}</span>
                <strong>${word.word}</strong> - ${word.meaning}
                <br>
                <small>Ekleyen: ${word.studentName} • ${formatTime(word.createdAt)}</small>
            </div>
            <div class="item-actions">
                <button class="btn-approve" onclick="approveWord('${word._id}')">✅ Onayla</button>
                <button class="btn-reject" onclick="rejectWord('${word._id}')">❌ Reddet</button>
            </div>
        </div>
    `).join('');
}

// GERÇEK: Backend'den onay bekleyen cümleleri çek
async function loadPendingSentences() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/pending-words');
        const data = await response.json();
        
        if (data.success) {
            displayPendingSentences(data.pendingSentences);
        } else {
            document.getElementById('pendingSentencesList').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">❌</div>
                    <h3>Veri yüklenemedi</h3>
                </div>
            `;
        }
    } catch (error) {
        console.error('Admin cümle yükleme hatası:', error);
        document.getElementById('pendingSentencesList').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔌</div>
                <h3>Sunucu bağlantı hatası</h3>
            </div>
        `;
    }
}

function displayPendingSentences(sentences) {
    const pendingSentencesList = document.getElementById('pendingSentencesList');
    
    if (!sentences || sentences.length === 0) {
        pendingSentencesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✅</div>
                <h3>Onay bekleyen cümle yok</h3>
            </div>
        `;
        return;
    }
    
    pendingSentencesList.innerHTML = sentences.map(word => `
        <div class="admin-item">
            <div class="item-info">
                <span class="lang-badge">${getLanguageFlag(word.language)} ${word.language.toUpperCase()}</span>
                <strong>Kelime:</strong> ${word.word}
                <br>
                <strong>Cümle:</strong> "${word.sentence}"
                <br>
                <small>Ekleyen: ${word.studentName} • ${formatTime(word.createdAt)}</small>
            </div>
            <div class="item-actions">
                <button class="btn-approve" onclick="approveSentence('${word._id}')">✅ Onayla</button>
                <button class="btn-reject" onclick="rejectSentence('${word._id}')">❌ Reddet</button>
            </div>
        </div>
    `).join('');
}

// GERÇEK: Backend'e kelime onaylama isteği gönder
async function approveWord(wordId) {
    if(!confirm('Bu kelimeyi onaylamak istediğinize emin misiniz?\nÖğrenciye +10 puan verilecek.')) return;
    
    try {
        const response = await fetch('http://localhost:5000/api/admin/word-action', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                wordId: wordId,
                action: 'approve',
                adminId: currentUser.studentId 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ ' + data.message);
            await loadPendingWords(); // Listeyi yenile
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        alert('❌ Sunucu hatası! Backend çalışıyor mu?');
    }
}

// GERÇEK: Backend'e kelime reddetme isteği gönder
async function rejectWord(wordId) {
    const reason = prompt('Reddetme sebebini yazın:');
    if (!reason) return;
    
    try {
        const response = await fetch('http://localhost:5000/api/admin/word-action', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                wordId: wordId,
                action: 'reject',
                adminId: currentUser.studentId 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('❌ ' + data.message);
            await loadPendingWords(); // Listeyi yenile
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        alert('❌ Sunucu hatası!');
    }
}

// GERÇEK: Backend'e cümle onaylama isteği gönder
async function approveSentence(wordId) {
    if(!confirm('Bu cümleyi onaylamak istediğinize emin misiniz?')) return;
    
    try {
        const response = await fetch('http://localhost:5000/api/admin/sentence-action', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                wordId: wordId,
                action: 'approve',
                adminId: currentUser.studentId 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ ' + data.message);
            await loadPendingSentences(); // Listeyi yenile
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        alert('❌ Sunucu hatası!');
    }
}

// GERÇEK: Backend'e cümle reddetme isteği gönder
async function rejectSentence(wordId) {
    const reason = prompt('Reddetme sebebini yazın:');
    if (!reason) return;
    
    try {
        const response = await fetch('http://localhost:5000/api/admin/sentence-action', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                wordId: wordId,
                action: 'reject',
                adminId: currentUser.studentId 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('❌ ' + data.message);
            await loadPendingSentences(); // Listeyi yenile
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        alert('❌ Sunucu hatası!');
    }
}

// Zaman formatlama
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR');
}

// Login form işleyici
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const studentId = document.getElementById('studentId').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ studentId, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            messageDiv.innerHTML = '<div class="message success">✅ Giriş başarılı! Yönlendiriliyorsunuz...</div>';
            
            setTimeout(() => {
                if (currentUser.isFirstLogin) {
                    showPage('changePasswordPage');
                } else {
                    showProfilePage();
                }
            }, 1500);
            
        } else {
            messageDiv.innerHTML = '<div class="message error">❌ ' + data.message + '</div>';
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="message error">❌ Sunucu bağlantı hatası!</div>';
    }
});

// Şifre değiştirme form işleyici
document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageDiv = document.getElementById('passwordMessage');
    
    if (newPassword !== confirmPassword) {
        messageDiv.innerHTML = '<div class="message error">❌ Şifreler eşleşmiyor!</div>';
        return;
    }
    
    if (newPassword.length < 6) {
        messageDiv.innerHTML = '<div class="message error">❌ Şifre en az 6 karakter olmalı!</div>';
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                studentId: currentUser.studentId, 
                newPassword: newPassword 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            messageDiv.innerHTML = '<div class="message success">✅ Şifre başarıyla değiştirildi!</div>';
            
            setTimeout(() => {
                showProfilePage();
            }, 2000);
            
        } else {
            messageDiv.innerHTML = '<div class="message error">❌ ' + data.message + '</div>';
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="message error">❌ Şifre değiştirme hatası!</div>';
    }
});

// Kelime ekleme form işleyici
document.getElementById('wordAddForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const word = document.getElementById('wordInput').value;
    const meaning = document.getElementById('wordMeaning').value;
    const messageDiv = document.getElementById('wordMessage');
    const language = document.getElementById('wordAddTitle').textContent.includes('Türkçe') ? 'turkish' : 
                    document.getElementById('wordAddTitle').textContent.includes('İngilizce') ? 'english' : 'arabic';
    
    try {
        const response = await fetch('http://localhost:5000/api/words/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                word, 
                meaning, 
                language, 
                studentId: currentUser.studentId 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            messageDiv.innerHTML = '<div class="message success">✅ ' + data.message + '</div>';
            
            // Formu temizle
            document.getElementById('wordAddForm').reset();
            
            // 2 saniye sonra profil sayfasına dön
            setTimeout(() => {
                showProfilePage();
            }, 2000);
        } else {
            messageDiv.innerHTML = '<div class="message error">❌ ' + data.message + '</div>';
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="message error">❌ Kelime ekleme hatası!</div>';
    }
});

// CÜMLE EKLEME FORM İŞLEYİCİSİ - GÜNCELLENDİ
document.getElementById('sentenceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const sentence = document.getElementById('sentenceInput').value;
    const messageDiv = document.getElementById('sentenceMessage');
    
    try {
        const response = await fetch('http://localhost:5000/api/words/add-sentence', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                wordId: currentEditingWordId, 
                sentence, 
                studentId: currentUser.studentId,
                sentenceLanguage: selectedSentenceLanguage // YENİ: DİL BİLGİSİ EKLENDİ
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            messageDiv.innerHTML = '<div class="message success">✅ ' + data.message + '</div>';
            
            // Kelime listesini güncelle
            await loadAllWords();
            
            // 2 saniye sonra modal'ı kapat
            setTimeout(() => {
                closeSentenceModal();
            }, 2000);
        } else {
            messageDiv.innerHTML = '<div class="message error">❌ ' + data.message + '</div>';
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="message error">❌ Cümle ekleme hatası!</div>';
    }
});

// Profil sayfasını göster
function showProfilePage() {
    if (currentUser) {
        document.getElementById('profileName').textContent = currentUser.name;
        document.getElementById('profileClass').textContent = currentUser.class;
        document.getElementById('profileStudentId').textContent = currentUser.studentId;
        document.getElementById('profilePoints').textContent = currentUser.points;
        
        // Admin ise admin butonunu göster
        const adminBtn = document.getElementById('adminBtn');
        if (adminBtn) {
            adminBtn.style.display = currentUser.role === 'admin' ? 'block' : 'none';
        }
        
        showPage('profilePage');
    }
}

// Kelime ekleme sayfasını göster
function showWordAddPage(language) {
    const titles = {
        'turkish': '🇹🇷 Türkçe Kelime Ekle',
        'english': '🇺🇸 İngilizce Kelime Ekle', 
        'arabic': '🇸🇦 Arapça Kelime Ekle'
    };
    
    document.getElementById('wordAddTitle').textContent = titles[language];
    document.getElementById('wordMessage').innerHTML = '';
    document.getElementById('wordAddForm').reset();
    showPage('wordAddPage');
}

// TÜM KELİMELER sayfasını göster
async function showAllWordsPage() {
    if (currentUser) {
        document.getElementById('allWordsPoints').textContent = currentUser.points;
        showPage('allWordsPage');
        await loadAllWords();
    }
}

// Tüm kelimeleri yükle
async function loadAllWords() {
    try {
        const response = await fetch('http://localhost:5000/api/words/all');
        const data = await response.json();
        
        if (data.success) {
            allWords = data.words;
            renderWords();
        }
    } catch (error) {
        console.error('Kelimeleri yükleme hatası:', error);
    }
}

// Kelimeleri ekrana render et
function renderWords() {
    const wordsGrid = document.getElementById('wordsGrid');
    const wordsCount = document.getElementById('wordsCount');
    
    wordsCount.textContent = allWords.length;
    
    if (allWords.length === 0) {
        wordsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>Henüz kelime eklenmemiş</h3>
                <p>İlk kelimeyi eklemek için yukarıdaki butonları kullanın</p>
            </div>
        `;
        return;
    }
    
    wordsGrid.innerHTML = allWords.map(word => {
        // Kullanıcının bu kelimeye oy verip vermediğini kontrol et
        const userVote = word.votedUsers ? word.votedUsers.find(vote => vote.studentId === currentUser.studentId) : null;
        const hasUserVoted = !!userVote;
        const userVoteType = userVote ? userVote.voteType : null;
        
        // Cümle durumunu kontrol et
        const canAddSentence = !word.sentence || word.sentenceStatus === 'pending';
        const hasApprovedSentence = word.sentence && word.sentenceStatus === 'approved';
        
        return `
        <div class="word-card">
            <div class="word-header">
                <div class="word-title">${word.word}</div>
                <div class="word-language">${getLanguageFlag(word.language)}</div>
            </div>
            
            <div class="word-meaning-preview">${word.meaning}</div>
            
            ${hasApprovedSentence ? `
                <div class="sentence-preview">
                    <strong>💬 Cümle:</strong> ${word.sentence}
                </div>
            ` : word.sentence && word.sentenceStatus === 'pending' ? `
                <div class="sentence-preview pending">
                    <strong>⏳ Cümle:</strong> ${word.sentence} <em>(Onay bekliyor)</em>
                </div>
            ` : ''}
            
            <div class="word-stats">
                <div class="word-stat ${userVoteType === 'like' ? 'user-vote' : ''}">
                    <span class="stat-icon">👍</span> ${word.likes || 0}
                </div>
                <div class="word-stat ${userVoteType === 'dislike' ? 'user-vote' : ''}">
                    <span class="stat-icon">👎</span> ${word.dislikes || 0}
                </div>
                <div class="word-stat">
                    <span class="stat-icon">👤</span> ${word.studentName}
                </div>
            </div>
            
            <div class="word-actions">
                <button class="btn-vote like-btn ${userVoteType === 'like' ? 'active' : ''}" 
                        onclick="voteWord('${word._id}', 'like')"
                        ${hasUserVoted && userVoteType === 'like' ? 'disabled' : ''}>
                    👍 Beğen
                </button>
                <button class="btn-vote dislike-btn ${userVoteType === 'dislike' ? 'active' : ''}" 
                        onclick="voteWord('${word._id}', 'dislike')"
                        ${hasUserVoted && userVoteType === 'dislike' ? 'disabled' : ''}>
                    👎 Beğenme
                </button>
                <button class="btn-secondary" 
                        onclick="openSentenceModal('${word._id}')"
                        ${!canAddSentence ? 'disabled' : ''}>
                    💬 Cümle Ekle
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// Kelime arama
async function searchWords() {
    const searchTerm = document.getElementById('searchWordsInput').value;
    
    try {
        const response = await fetch(`http://localhost:5000/api/words/search?q=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        
        if (data.success) {
            allWords = data.words;
            renderWords();
        }
    } catch (error) {
        console.error('Arama hatası:', error);
    }
}

// Like/Dislike işlemi
async function voteWord(wordId, type) {
    try {
        const response = await fetch('http://localhost:5000/api/words/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                wordId, 
                type, 
                studentId: currentUser.studentId 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.newPoints) {
                currentUser.points = data.newPoints;
                updatePointsDisplay();
            }
            
            // Kelime listesini güncelle
            await loadAllWords();
            
            // Başarı mesajı
            showTempMessage(data.message, 'success');
        } else {
            showTempMessage(data.message, 'error');
        }
    } catch (error) {
        console.error('Oy verme hatası:', error);
        showTempMessage('Oy verme hatası!', 'error');
    }
}

// Cümle ekleme modal'ını kapat
function closeSentenceModal() {
    document.getElementById('sentenceModal').classList.remove('active');
    currentEditingWordId = null;
}

// Dil bayrağı getir
function getLanguageFlag(language) {
    const flags = {
        'turkish': '🇹🇷',
        'english': '🇺🇸',
        'arabic': '🇸🇦'
    };
    return flags[language] || '🌐';
}

// Puan display'ini güncelle
function updatePointsDisplay() {
    document.getElementById('profilePoints').textContent = currentUser.points;
    document.getElementById('allWordsPoints').textContent = currentUser.points;
}

// Geçici mesaj göster
function showTempMessage(message, type) {
    const tempDiv = document.createElement('div');
    tempDiv.className = `message ${type}`;
    tempDiv.textContent = message;
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '20px';
    tempDiv.style.left = '50%';
    tempDiv.style.transform = 'translateX(-50%)';
    tempDiv.style.zIndex = '1000';
    
    document.body.appendChild(tempDiv);
    
    setTimeout(() => {
        document.body.removeChild(tempDiv);
    }, 3000);
}

// Çıkış yap
function logout() {
    currentUser = null;
    allWords = [];
    currentEditingWordId = null;
    
    document.getElementById('loginForm').reset();
    document.getElementById('changePasswordForm').reset();
    document.getElementById('wordAddForm').reset();
    document.getElementById('sentenceForm').reset();
    
    document.getElementById('message').innerHTML = '';
    document.getElementById('passwordMessage').innerHTML = '';
    document.getElementById('wordMessage').innerHTML = '';
    document.getElementById('sentenceMessage').innerHTML = '';
    
    showPage('loginPage');
}

// Sayfa yüklendiğinde login ekranını göster
document.addEventListener('DOMContentLoaded', function() {
    showPage('loginPage');
});