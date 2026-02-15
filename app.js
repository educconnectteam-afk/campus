// ==================== CONFIG ====================
const API_URL = 'http://localhost:3000/api';
let currentUser = null;

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', function() {
    // Événements
    document.getElementById('login-btn').addEventListener('click', showLogin);
    document.getElementById('register-btn').addEventListener('click', showRegister);
    
    // Vérifier si connecté
    const savedUser = localStorage.getItem('edu_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showFeed();
        loadPosts();
        updateProfile();
    } else {
        showLogin();
    }
});

// ==================== AUTH ====================
function showLogin() {
    hideAllScreens();
    document.getElementById('login-screen').classList.add('active');
    updateAuthButtons('login');
}

function showRegister() {
    hideAllScreens();
    document.getElementById('register-screen').classList.add('active');
    updateAuthButtons('register');
}

function showFeed() {
    hideAllScreens();
    document.getElementById('feed-screen').classList.add('active');
    updateAuthButtons('feed');
    
    // Charger les données
    loadPosts();
    updateProfile();
    loadRecommendations(); 
}
// ==================== RECOMMANDATIONS ====================

// Charger les recommandations
async function loadRecommendations() {
    if (!currentUser) return;
    
    const container = document.getElementById('recommended-posts');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_URL}/users/${currentUser.id}/recommendations`);
        const data = await response.json();
        
        if (data.success && data.recommendations.length > 0) {
            container.innerHTML = data.recommendations.map(post => `
                <div class="recommended-item" onclick="showPost(${post.id})" 
                     style="cursor: pointer; margin-bottom: 12px; padding: 10px; 
                            background: #f8f9fa; border-radius: 8px; border-left: 3px solid #1877f2;">
                    <div style="font-size: 13px; color: #1877f2; margin-bottom: 4px;">
                        <i class="fas fa-star"></i> ${data.type}
                    </div>
                    <div style="font-weight: 500; font-size: 14px; margin-bottom: 4px;">
                        ${post.content.length > 60 ? post.content.substring(0, 60) + '...' : post.content}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; color: #65676b;">
                        <span>${post.username || 'Étudiant'}</span>
                        <span>${post.likes || 0} ❤️</span>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p style="color: #65676b; font-size: 14px;">Aucune recommandation</p>';
        }
    } catch (error) {
        console.log('Mode démo recommandations');
        container.innerHTML = `
            <div class="recommended-item" style="margin-bottom: 12px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                <div style="font-size: 13px; color: #1877f2; margin-bottom: 4px;">
                    <i class="fas fa-star"></i> Tendance
                </div>
                <div style="font-weight: 500; font-size: 14px;">
                    Aucun poste pour le moment!
                </div>
                
        `;
    }
}

// Tracer les interactions
async function trackView(postId) {
    if (!currentUser || !postId) return;
    
    try {
        await fetch(`${API_URL}/interactions/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                postId: postId,
                type: 'view',
                duration: 5
            })
        });
    } catch (error) {
        console.log('Tracking en mode démo');
    }
}

// Afficher un post spécifique
function showPost(postId) {
    // Trouver le post
    const postElement = document.querySelector(`[data-id="${postId}"]`);
    if (postElement) {
        postElement.scrollIntoView({ behavior: 'smooth' });
        // Surligner le post
        postElement.style.backgroundColor = '#f0f8ff';
        setTimeout(() => postElement.style.backgroundColor = '', 2000);
    }
    trackView(postId);
}

function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

function updateAuthButtons(state) {
    const authSection = document.getElementById('auth-section');
    
    switch(state) {
        case 'login':
            authSection.innerHTML = `
                <button id="login-btn" class="btn btn-outline">Connexion</button>
                <button id="register-btn" class="btn btn-primary">Inscription</button>
            `;
            break;
            
        case 'register':
            authSection.innerHTML = `
                <button id="login-btn" class="btn btn-primary">Connexion</button>
                <button id="register-btn" class="btn btn-outline">Inscription</button>
            `;
            break;
            
        case 'feed':
            authSection.innerHTML = `
                <span style="color: white; margin-right: 15px;">
                    <i class="fas fa-user"></i> ${currentUser?.username || 'Utilisateur'}
                </span>
                <button class="btn btn-outline" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Déconnexion
                </button>
            `;
            break;
    }
    
    // Réattacher les événements
    if (document.getElementById('login-btn')) {
        document.getElementById('login-btn').addEventListener('click', showLogin);
    }
    if (document.getElementById('register-btn')) {
        document.getElementById('register-btn').addEventListener('click', showRegister);
    }
}

async function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email) {
        showNotification('Email requis', 'error');
        return;
    }

    try {
        showNotification('Connexion en cours...', 'info');
        
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('edu_user', JSON.stringify(currentUser));
            
            showFeed();
            loadPosts();
            updateProfile();
            showNotification('Connecté !', 'success');
        } else {
            showNotification(data.error || 'Échec connexion', 'error');
        }
    } catch (error) {
        console.log('Mode démo activé');
        // Mode démo
        currentUser = {
            id: 1,
            username: email.split('@')[0] || 'demo',
            email: email,
            university: 'Paris-Saclay'
        };
        
        localStorage.setItem('edu_user', JSON.stringify(currentUser));
        showFeed();
        loadPosts();
        updateProfile();
        showNotification('Mode démo activé', 'success');
    }
}

async function register() {
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const username = document.getElementById('register-username').value.trim();
    const university = document.getElementById('register-university').value;
    const password = document.getElementById('register-password').value;

    if (!name || !email || !username || !university || !password) {
        showNotification('Tous les champs sont requis', 'error');
        return;
    }

    try {
        showNotification('Inscription en cours...', 'info');
        
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username, 
                email, 
                password, 
                fullName: name, 
                university 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('edu_user', JSON.stringify(currentUser));
            
            showFeed();
            loadPosts();
            updateProfile();
            showNotification('Compte créé !', 'success');
        } else {
            showNotification(data.error || 'Échec inscription', 'error');
        }
    } catch (error) {
        console.log('Mode démo inscription');
        currentUser = {
            id: Date.now(),
            username: username,
            email: email,
            fullName: name,
            university: university
        };
        
        localStorage.setItem('edu_user', JSON.stringify(currentUser));
        showFeed();
        loadPosts();
        updateProfile();
        showNotification('Compte démo créé', 'success');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('edu_user');
    showLogin();
    showNotification('Déconnecté', 'info');
}

// ==================== POSTS ====================
async function loadPosts() {
    try {
        const response = await fetch(`${API_URL}/posts`);
        const posts = await response.json();
        displayPosts(posts);
    } catch (error) {
        console.error('Erreur posts:', error);
        displayDemoPosts();
    }
}

function displayPosts(posts) {
    const container = document.getElementById('posts-container');
    
    if (!posts || posts.length === 0) {
        container.innerHTML = `
            <div class="post-card">
                <p style="text-align: center; color: #65676b; padding: 40px;">
                    Aucune publication. Sois le premier à poster !
                </p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = posts.map(post => `
        <div class="post-card">
            <div class="post-header">
                <div class="user-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="post-info">
                    <strong>${post.username || 'Étudiant'}</strong>
                    <small>${post.university || 'Université'} • ${formatDate(post.timestamp)}</small>
                </div>
            </div>
            <div class="post-content">
                <p>${post.content}</p>
            </div>
            <div class="post-stats">
                <span><i class="fas fa-thumbs-up"></i> ${post.likes || 0}</span>
                <span><i class="fas fa-comment"></i> ${post.comments || 0}</span>
            </div>
            <div class="post-actions">
                <button class="post-btn" onclick="likePost(${post.id})">
                    <i class="fas fa-thumbs-up"></i> J'aime
                </button>
                <button class="post-btn" onclick="commentPost(${post.id})">
                    <i class="fas fa-comment"></i> Repondre
                </button>
                <button class="post-btn" onclick="sharePost(${post.id})">
                    <i class="fas fa-share"></i> Partager
                </button>
            </div>
        </div>
    `).join('');
}
async function createPost() {
    const content = document.getElementById('post-content').value.trim();
    
    if (!content) {
        showNotification('Le post ne peut pas être vide', 'error');
        return;
    }
    
    if (!currentUser) {
        showNotification('Connecte-toi d\'abord', 'error');
        showLogin();
        return;
    }
    
    try {
        showNotification('Publication en cours...', 'info');
        
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: content,
                userId: currentUser.id,
                username: currentUser.username,
                university: currentUser.university
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('post-content').value = '';
            loadPosts();
            showNotification('Post publié !', 'success');
        }
    } catch (error) {
        console.log('Mode démo publication');
        // Ajouter en local
        const newPost = {
            id: Date.now(),
            content: content,
            username: currentUser.username,
            university: currentUser.university,
            likes: 0,
            comments: 0,
            timestamp: new Date().toISOString()
        };
        
       
        const container = document.getElementById('posts-container');
        const firstPost = container.querySelector('.post-card');
        
        if (firstPost) {
            const postHTML = `
                <div class="post-card">
                    <div class="post-header">
                        <div class="user-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="post-info">
                            <strong>${newPost.username}</strong>
                            <small>${newPost.university} • À l'instant</small>
                        </div>
                    </div>
                    <div class="post-content">
                        <p>${newPost.content}</p>
                    </div>
                    <div class="post-stats">
                        <span><i class="fas fa-thumbs-up"></i> 0</span>
                        <span><i class="fas fa-comment"></i> 0</span>
                    </div>
                    <div class="post-actions">
                        <button class="post-btn">
                            <i class="fas fa-thumbs-up"></i> J'aime
                        </button>
                        <button class="post-btn">
                            <i class="fas fa-comment"></i> Repondre
                        </button>
                        <button class="post-btn">
                            <i class="fas fa-share"></i> Partager
                        </button>
                    </div>
                </div>
            `;
            
            container.innerHTML = postHTML + container.innerHTML;
        }
        
        document.getElementById('post-content').value = '';
        showNotification('Post publié (démo)', 'success');
    }
}

// ==================== UTILITAIRES ====================
function updateProfile() {
    if (!currentUser) return;
    
    document.getElementById('profile-name').textContent = currentUser.username || currentUser.fullName || 'Utilisateur';
    document.getElementById('profile-university').textContent = currentUser.university || 'Étudiant';
}

function formatDate(timestamp) {
    if (!timestamp) return 'À l\'instant';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    if (days < 7) return `Il y a ${days} j`;
    
    return date.toLocaleDateString('fr-FR');
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const colors = {
        success: '#31a24c',
        error: '#e41e3f',
        warning: '#f0ad4e',
        info: '#1877f2'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// ==================== FONCTIONS À VENIR ==================== 
function addImage() {
    showNotification('Ajout d\'image à venir', 'info');
}

function likePost(postId) {
    showNotification('Like à venir', 'info');
}

function commentPost(postId) {
    showNotification('Commentaire à venir', 'info');
}

function sharePost(postId) {
    showNotification('Partage à venir', 'info');
}
// ==================== RECHERCHE ====================
let allPosts = []; // Pour stocker tous les posts

// Initialiser la recherche
document.addEventListener('DOMContentLoaded', function() {
    
    
    // Écouter la recherche en temps réel
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
});

async function loadPosts() {
    try {
        const response = await fetch(`${API_URL}/posts`);
        allPosts = await response.json(); 
        displayPosts(allPosts);
    } catch (error) {
        console.error('Erreur posts:', error);
        displayDemoPosts();
        allPosts = getDemoPosts(); 
    }
}

function handleSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    
    if (query.length === 0) {
        displayPosts(allPosts);
        return;
    }
    
    // Filtrer les posts
    const filteredPosts = allPosts.filter(post => {
        return (
            post.content.toLowerCase().includes(query) ||
            (post.username && post.username.toLowerCase().includes(query)) ||
            (post.university && post.university.toLowerCase().includes(query)) ||
            (post.tags && post.tags.some(tag => tag.toLowerCase().includes(query)))
        );
    });
    
    displayPosts(filteredPosts);
    
    // Afficher le nombre de résultats
    if (query.length > 0) {
        showNotification(`${filteredPosts.length} résultats pour "${query}"`, 'info');
    }
}


// ==================== UPLOAD PHOTOS ====================

let selectedImage = null;

function addImage() {
   
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB max
                showNotification('Image trop grande (max 5MB)', 'error');
                return;
            }
            
            // Prévisualiser l'image
            const reader = new FileReader();
            reader.onload = function(e) {
                selectedImage = {
                    file: file,
                    url: e.target.result
                };
                showImagePreview();
            };
            reader.readAsDataURL(file);
        }
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

function showImagePreview() {
    const textarea = document.getElementById('post-content');
    const preview = document.getElementById('image-preview');
    
    
    if (!preview) {
        const previewDiv = document.createElement('div');
        previewDiv.id = 'image-preview';
        previewDiv.style.cssText = `
            position: relative;
            margin-top: 10px;
            max-width: 300px;
        `;
        
        textarea.parentNode.insertBefore(previewDiv, textarea.nextSibling);
    }
    
    // Mettre à jour la prévisualisation
    const previewDiv = document.getElementById('image-preview');
    previewDiv.innerHTML = `
        <div style="position: relative; display: inline-block;">
            <img src="${selectedImage.url}" style="max-width: 100%; border-radius: 8px;">
            <button onclick="removeImage()" style="
                position: absolute;
                top: 5px;
                right: 5px;
                background: rgba(0,0,0,0.7);
                color: white;
                border: none;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                cursor: pointer;
            ">×</button>
        </div>
    `;
}

function removeImage() {
    selectedImage = null;
    const preview = document.getElementById('image-preview');
    if (preview) {
        preview.remove();
    }
}

async function createPost() {
    const content = document.getElementById('post-content').value.trim();
    
    if (!content && !selectedImage) {
        showNotification('Le post ne peut pas être vide', 'error');
        return;
    }
    
    if (!currentUser) {
        showNotification('Connecte-toi d\'abord', 'error');
        showLogin();
        return;
    }
    
    try {
        showNotification('Publication en cours...', 'info');
        
        // Préparer les données
        const postData = {
            content: content,
            userId: currentUser.id,
            username: currentUser.username,
            university: currentUser.university
        };
        
        // Si il y a une image
        if (selectedImage) {
            
            postData.image = 'uploaded-image.jpg';
            postData.hasImage = true;
        }
        
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Réinitialiser
            document.getElementById('post-content').value = '';
            if (selectedImage) {
                removeImage();
                selectedImage = null;
            }
            
            loadPosts();
            showNotification('Post publié !', 'success');
        }
    } catch (error) {
        console.log('Mode démo publication');
        // Mode démo avec image
        const newPost = {
            id: Date.now(),
            content: content,
            username: currentUser.username,
            university: currentUser.university,
            likes: 0,
            comments: 0,
            timestamp: new Date().toISOString(),
            hasImage: !!selectedImage
        };
        
        // Simuler l'affichage
        const container = document.getElementById('posts-container');
        const postHTML = `
            <div class="post-card">
                <div class="post-header">
                    <div class="user-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="post-info">
                        <strong>${newPost.username}</strong>
                        <small>${newPost.university} • À l'instant</small>
                    </div>
                </div>
                ${newPost.hasImage ? `
                    <div class="post-image">
                        <img src="${selectedImage.url}" style="width: 100%; border-radius: 8px; margin: 10px 0;">
                    </div>
                ` : ''}
                <div class="post-content">
                    <p>${newPost.content || ''}</p>
                </div>
                <div class="post-stats">
                    <span><i class="fas fa-thumbs-up"></i> 0</span>
                    <span><i class="fas fa-comment"></i> 0</span>
                </div>
                <div class="post-actions">
                    <button class="post-btn" onclick="likePost(${newPost.id})">
                        <i class="fas fa-thumbs-up"></i> J'aime
                    </button>
                    <button class="post-btn" onclick="commentPost(${newPost.id})">
                        <i class="fas fa-comment"></i> Repondre
                    </button>
                    <button class="post-btn" onclick="sharePost(${newPost.id})">
                        <i class="fas fa-share"></i> Partager
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML = postHTML + container.innerHTML;
        
        // Réinitialiser
        document.getElementById('post-content').value = '';
        if (selectedImage) {
            removeImage();
            selectedImage = null;
        }
        
        showNotification('Post avec image publié !', 'success');
    }
}
// ==================== FILTRES ====================

let currentFilter = 'all';

function initFilters() {
    // Activer les filtres
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // Activer celui cliqué
            this.classList.add('active');
            
            // Appliquer le filtre
            currentFilter = this.textContent.toLowerCase();
            applyFilter(currentFilter);
        });
    });
}

// Appeler dans DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    
    initFilters();
});

function applyFilter(filter) {
    let filteredPosts = [...allPosts];
    
    switch(filter) {
        case 'questions':
            filteredPosts = allPosts.filter(post => 
                post.content.includes('?') || 
                post.tags?.includes('question') ||
                post.content.toLowerCase().includes('qui a') ||
                post.content.toLowerCase().includes('comment') ||
                post.content.toLowerCase().includes('pourquoi')
            );
            break;
            
        case 'ressources':
            filteredPosts = allPosts.filter(post => 
                post.tags?.includes('ressources') ||
                post.content.toLowerCase().includes('ressource') ||
                post.content.toLowerCase().includes('polycopié') ||
                post.content.toLowerCase().includes('cours') ||
                post.content.toLowerCase().includes('document')
            );
            break;
            
        case 'abonnements':
           
            showNotification('Filtre abonnements à venir', 'info');
            break;
    }
    
    displayPosts(filteredPosts);
    showNotification(`${filteredPosts.length} posts ${filter}`, 'info');
}
// ==================== LIKES ====================

let likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]');

async function likePost(postId) {
    if (!currentUser) {
        showNotification('Connecte-toi pour liker', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Mettre à jour l'affichage
            updatePostLikes(postId, data.newLikes);
            showNotification('Post liké !', 'success');
            
            // Sauvegarder localement
            if (!likedPosts.includes(postId)) {
                likedPosts.push(postId);
                localStorage.setItem('liked_posts', JSON.stringify(likedPosts));
            }
        }
    } catch (error) {
        // Mode démo
        const postElement = document.querySelector(`.post-card[data-id="${postId}"]`);
        if (postElement) {
            const likesSpan = postElement.querySelector('.post-stats span:first-child');
            if (likesSpan) {
                const currentLikes = parseInt(likesSpan.textContent) || 0;
                likesSpan.innerHTML = `<i class="fas fa-thumbs-up"></i> ${currentLikes + 1}`;
                
                // Changer le bouton
                const likeBtn = postElement.querySelector('.post-btn:first-child');
                if (likeBtn) {
                    likeBtn.innerHTML = '<i class="fas fa-thumbs-up"></i> Aimé';
                    likeBtn.style.color = '#1877f2';
                }
            }
        }
        
        if (!likedPosts.includes(postId)) {
            likedPosts.push(postId);
            localStorage.setItem('liked_posts', JSON.stringify(likedPosts));
        }
        
        showNotification('Like enregistré !', 'success');
    }
}

function updatePostLikes(postId, newLikes) {
    const postElement = document.querySelector(`.post-card[data-id="${postId}"]`);
    if (postElement) {
        const likesSpan = postElement.querySelector('.post-stats span:first-child');
        if (likesSpan) {
            likesSpan.innerHTML = `<i class="fas fa-thumbs-up"></i> ${newLikes}`;
        }
    }
}


function displayPosts(posts) {
    const container = document.getElementById('posts-container');
    
    if (!posts || posts.length === 0) {
        container.innerHTML = `
            <div class="post-card">
                <p style="text-align: center; color: #65676b; padding: 40px;">
                    Aucune publication. Sois le premier à poster !
                </p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = posts.map(post => `
        <div class="post-card" data-id="${post.id}">
            <div class="post-header">
                <div class="user-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="post-info">
                    <strong>${post.username || 'Étudiant'}</strong>
                    <small>${post.university || 'Université'} • ${formatDate(post.timestamp)}</small>
                </div>
            </div>
            ${post.hasImage ? `
                <div class="post-image">
                    <img src="${post.imageUrl || 'https://via.placeholder.com/600x400/1877f2/ffffff?text=Photo+du+post'}" 
                         style="width: 100%; border-radius: 8px; margin: 10px 0;">
                </div>
            ` : ''}
            <div class="post-content">
                <p>${post.content}</p>
                ${post.tags && post.tags.length > 0 ? `
                    <div class="post-tags">
                        ${post.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="post-stats">
                <span><i class="fas fa-thumbs-up"></i> ${post.likes || 0}</span>
                <span><i class="fas fa-comment"></i> ${post.comments || 0}</span>
            </div>
            <div class="post-actions">
                <button class="post-btn" onclick="likePost(${post.id})" 
                        style="${likedPosts.includes(post.id) ? 'color: #1877f2;' : ''}">
                    <i class="fas fa-thumbs-up"></i> ${likedPosts.includes(post.id) ? 'Aimé' : 'J\'aime'}
                </button>
                <button class="post-btn" onclick="showComments(${post.id})">
                    <i class="fas fa-comment"></i> Repondre
                </button>
                <button class="post-btn" onclick="sharePost(${post.id})">
                    <i class="fas fa-share"></i> Partager
                </button>
            </div>
        </div>
    `).join('');
}
// ==================== COMMENTAIRES ====================

async function showComments(postId) {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/comments`);
        const data = await response.json();
        
        if (data.success) {
            displayCommentsModal(postId, data.comments);
        }
    } catch (error) {
        // Mode démo
        displayCommentsModal(postId, [
            {
                id: 1,
                username: "Marie Curie",
                content: "Super question ! J'ai les ressources si tu veux.",
                timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            {
                id: 2,
                username: "Pierre Curie",
                content: "Moi aussi je cherche ça !",
                timestamp: new Date(Date.now() - 1800000).toISOString()
            }
        ]);
    }
}

function displayCommentsModal(postId, comments) {
    // Créer la modale
    const modal = document.createElement('div');
    modal.id = 'comments-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            width: 90%;
            max-width: 500px;
            max-height: 80vh;
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        ">
            <div style="
                padding: 20px;
                border-bottom: 1px solid #e4e6eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <h3 style="margin: 0;">Commentaires</h3>
                <button onclick="closeModal()" style="
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #65676b;
                ">×</button>
            </div>
            
            <div style="
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            " id="comments-list">
                ${comments.map(comment => `
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; margin-bottom: 5px;">
                            <strong>${comment.username}</strong>
                            <small style="margin-left: 10px; color: #65676b;">
                                ${formatDate(comment.timestamp)}
                            </small>
                        </div>
                        <p style="margin: 0; color: #1c1e21;">${comment.content}</p>
                    </div>
                `).join('')}
                
                ${comments.length === 0 ? 
                    '<p style="text-align: center; color: #65676b;">Aucun commentaire</p>' : ''}
            </div>
            
            <div style="padding: 20px; border-top: 1px solid #e4e6eb;">
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="new-comment" placeholder="Écrire un commentaire..." 
                           style="flex: 1; padding: 10px; border: 1px solid #dddfe2; border-radius: 20px;">
                    <button onclick="postComment(${postId})" style="
                        background: #1877f2;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 20px;
                        cursor: pointer;
                    ">Envoyer</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeModal() {
    const modal = document.getElementById('comments-modal');
    if (modal) {
        modal.remove();
    }
}

async function postComment(postId) {
    const input = document.getElementById('new-comment');
    const content = input.value.trim();
    
    if (!content || !currentUser) {
        showNotification('Commentaire vide ou non connecté', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: content,
                userId: currentUser.id,
                username: currentUser.username
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            input.value = '';
            showComments(postId); 
            showNotification('Commentaire posté !', 'success');
            
            // Mettre à jour le compteur
            updatePostComments(postId);
        }
    } catch (error) {
        // Mode démo
        const commentsList = document.getElementById('comments-list');
        if (commentsList) {
            const newComment = document.createElement('div');
            newComment.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; margin-bottom: 5px;">
                        <strong>${currentUser.username}</strong>
                        <small style="margin-left: 10px; color: #65676b;">
                            À l'instant
                        </small>
                    </div>
                    <p style="margin: 0; color: #1c1e21;">${content}</p>
                </div>
            `;
            commentsList.prepend(newComment);
        }
        
        input.value = '';
        showNotification('Commentaire posté (démo)', 'success');
        updatePostComments(postId);
    }
}

function updatePostComments(postId) {
    const postElement = document.querySelector(`.post-card[data-id="${postId}"]`);
    if (postElement) {
        const commentsSpan = postElement.querySelector('.post-stats span:nth-child(2)');
        if (commentsSpan) {
            const currentComments = parseInt(commentsSpan.textContent) || 0;
            commentsSpan.innerHTML = `<i class="fas fa-comment"></i> ${currentComments + 1}`;
        }
    }
}
// ==================== PARTAGE ====================

function sharePost(postId) {
    const post = allPosts.find(p => p.id === postId);
    
    if (!post) {
        showNotification('Post non trouvé', 'error');
        return;
    }
    
    // Vérifier si l'API Web Share est disponible
    if (navigator.share) {
        navigator.share({
            title: `Post de ${post.username} sur Edu-Connect`,
            text: post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content,
            url: window.location.href + `?post=${postId}`
        })
        .then(() => showNotification('Partagé avec succès !', 'success'))
        .catch(error => {
            console.log('Erreur partage:', error);
            copyToClipboard();
        });
    } else {
        // Fallback : copier le lien
        copyToClipboard();
    }
}

function copyToClipboard() {
    const textToCopy = window.location.href;
    
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            showNotification('Lien copié dans le presse-papier !', 'success');
        })
        .catch(err => {
            console.error('Erreur copie:', err);
            showNotification('Erreur lors de la copie', 'error');
        });
}