let selectedRepoValue = ""; 
let activeModalUser = ""; 
let activeDetailGameIndex = null; 
let currentGenreFilter = "전체";
let currentSearchKeyword = "";
let isPopularView = false;
let previewLogoBase64 = "";
let previewBannerBase64 = "";

// UI 편집 모드 상태 변수
let isUiEditMode = false;

// 설정창 열기/닫기
function openSettingsModal() {
    document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettingsModal() {
    document.getElementById('settings-modal').classList.add('hidden');
}

// 🌟 설정창에서 'UI 수정 시작'을 누를 때: 설정창을 닫고 메인에 펜 팝업을 띄움
function openUiEditModeAndCloseSettings() {
    isUiEditMode = true;
    closeSettingsModal();
    document.getElementById('ui-edit-floating-popup').classList.remove('hidden');
}

// 🌟 메인 화면의 펜 팝업에서 [X] 버튼을 누를 때: 수정 모드를 끝내고 다시 설정창을 띄움
function closeUiEditModeAndReturnSettings() {
    isUiEditMode = false;
    document.getElementById('ui-edit-floating-popup').classList.add('hidden');
    openSettingsModal();
}

// 그 자리에서 바로 키보드로 수정하는 인라인 편집 함수
function handleEditableClick(event, key, defaultText) {
    if (!isUiEditMode) return;
    event.stopPropagation();
    
    const targetEl = event.currentTarget;
    if (targetEl.tagName === 'INPUT') return;

    const currentText = targetEl.textContent.trim();
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = "px-3 py-1 bg-white/90 border-2 border-amber-500 rounded-xl text-amber-950 font-bold focus:outline-none shadow-md text-center inline-block";
    
    targetEl.replaceWith(input);
    input.focus();
    input.select();

    const saveAndRestore = () => {
        const newText = input.value.trim() || defaultText;
        const newEl = document.createElement(targetEl.tagName.toLowerCase());
        newEl.id = targetEl.id;
        newEl.className = targetEl.className;
        newEl.setAttribute('onclick', targetEl.getAttribute('onclick'));
        if (targetEl.hasAttribute('data-genre')) {
            newEl.setAttribute('data-genre', targetEl.getAttribute('data-genre'));
        }
        newEl.textContent = newText;
        input.replaceWith(newEl);

        let customTexts = JSON.parse(localStorage.getItem('pancake_custom_texts')) || {};
        customTexts[key] = newText;
        localStorage.setItem('pancake_custom_texts', JSON.stringify(customTexts));
    };

    input.addEventListener('blur', saveAndRestore);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            input.blur();
        }
    });
}

function handleTabClick(genreName) {
    if (isUiEditMode) {
        const targetBtn = event.currentTarget;
        if (targetBtn.tagName === 'INPUT') return;

        const currentName = targetBtn.textContent.trim();
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = "px-3 py-1 bg-white/90 border-2 border-amber-500 rounded-xl text-amber-950 text-xs font-bold focus:outline-none shadow-md";
        
        targetBtn.replaceWith(input);
        input.focus();
        input.select();

        const saveTabChange = () => {
            const newName = input.value.trim() || genreName;
            const newBtn = document.createElement('button');
            newBtn.className = targetBtn.className;
            newBtn.setAttribute('onclick', targetBtn.getAttribute('onclick'));
            newBtn.setAttribute('data-genre', genreName);
            newBtn.textContent = newName;
            input.replaceWith(newBtn);

            let customTabs = JSON.parse(localStorage.getItem('pancake_custom_tabs')) || {};
            customTabs[genreName] = newName;
            localStorage.setItem('pancake_custom_tabs', JSON.stringify(customTabs));
        };

        input.addEventListener('blur', saveTabChange);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        });
    } else {
        if (genreName === '인기') {
            filterByPopular();
        } else {
            setGenreFilter(genreName);
        }
    }
}

// 모달 배경(백드롭) 클릭 시 닫기 핸들러
function checkBackdropClose(event, modalId) {
    if (event.target.id === modalId) {
        if (modalId === 'upload-modal') closeUploadModal();
        else if (modalId === 'detail-modal') closeDetailModal();
        else if (modalId === 'mypage-modal') closeMyPageModal();
        else if (modalId === 'studio-board-modal') closeStudioBoardModal();
        else if (modalId === 'studio-modal') closeStudioModal();
        else if (modalId === 'studio-profile-modal') closeStudioProfileModal();
        else if (modalId === 'recruit-modal') closeRecruitModal();
        else if (modalId === 'settings-modal') closeSettingsModal();
    }
}

function resetToHome() {
    currentGenreFilter = "전체";
    currentSearchKeyword = "";
    isPopularView = false;
    document.getElementById('search-input').value = "";
    let customTexts = JSON.parse(localStorage.getItem('pancake_custom_texts')) || {};
    document.getElementById('editable-section-title').textContent = customTexts.sectionTitle || "🥞 갓 구워 나온 따끈따끈한 게임";
    updateGenreButtonsUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderGames();
}

function openUploadModal() {
    const loggedInUser = localStorage.getItem('github_user');
    if (!loggedInUser) {
        alert('GitHub 로그인이 필요한 기능입니다! 먼저 우측 상단에서 로그인해 주세요.');
        return;
    }
    document.getElementById('upload-modal').classList.remove('hidden');
}

function closeUploadModal() {
    document.getElementById('upload-modal').classList.add('hidden');
    closeDropdownList();
}

function toggleDiscordProfilePopup(event) {
    event.stopPropagation();
    const popup = document.getElementById('discord-profile-popup');
    if (popup) popup.classList.toggle('hidden');
}

function handleBodyClick(event) {
    const popup = document.getElementById('discord-profile-popup');
    const profileBtn = document.getElementById('profile-widget-btn');
    if (popup && !popup.contains(event.target) && profileBtn && !profileBtn.contains(event.target)) {
        popup.classList.add('hidden');
    }
}

function handleBannerUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
        const loggedInUser = localStorage.getItem('github_user');
        localStorage.setItem(`banner_${loggedInUser}`, reader.result);
        
        const bannerView = document.getElementById('profile-banner-view');
        if (bannerView) {
            bannerView.style.backgroundImage = `url(${reader.result})`;
        }
    };
}

function handleSearchInput(event) {
    currentSearchKeyword = event.target.value.toLowerCase().trim();
    renderGames();
}

function setGenreFilter(genre) {
    currentGenreFilter = genre;
    isPopularView = false;
    let customTexts = JSON.parse(localStorage.getItem('pancake_custom_texts')) || {};
    const baseSecTitle = customTexts.sectionTitle || "🥞 갓 구워 나온 따끈따끈한 게임";
    document.getElementById('editable-section-title').textContent = genre === "전체" ? baseSecTitle : `🥞 [${genre}] 장르 게임`;
    updateGenreButtonsUI();
    renderGames();
}

function filterByPopular() {
    isPopularView = true;
    currentGenreFilter = "전체";
    document.getElementById('editable-section-title').textContent = "🔥 인기 급상승 게임";
    updateGenreButtonsUI();
    renderGames();
}

function updateGenreButtonsUI() {
    const buttons = document.querySelectorAll('.genre-btn');
    buttons.forEach(btn => {
        const g = btn.getAttribute('data-genre');
        if (!isPopularView && g === currentGenreFilter) {
            btn.className = "px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white shadow-sm transition genre-btn";
        } else if (isPopularView && g === "인기") {
            btn.className = "px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white shadow-sm transition genre-btn";
        } else {
            btn.className = "px-4 py-2 rounded-xl text-xs font-bold bg-white/60 text-amber-900 hover:bg-white transition genre-btn";
        }
    });
}

function openMyPageModal() {
    const loggedInUser = localStorage.getItem('github_user');
    if (!loggedInUser) {
        alert('GitHub 로그인이 필요한 기능입니다! 먼저 우측 상단에서 로그인해 주세요.');
        return;
    }

    const popup = document.getElementById('discord-profile-popup');
    if (popup) popup.classList.add('hidden');

    activeModalUser = loggedInUser;
    setupProfileModalData(loggedInUser, true);
    document.getElementById('mypage-modal').classList.remove('hidden');
}

function openDeveloperProfileFromDetail() {
    let games = JSON.parse(localStorage.getItem('pancake_games')) || [];
    const game = games[activeDetailGameIndex];
    if (!game) return;

    closeDetailModal();
    activeModalUser = game.author;
    setupProfileModalData(game.author, false);
    document.getElementById('mypage-modal').classList.remove('hidden');
}

function setupProfileModalData(username, isMyPage) {
    document.getElementById('mypage-modal-title').textContent = isMyPage ? "마이 페이지" : `@${username} 개발자 프로필`;
    document.getElementById('profile-avatar-view').src = `https://github.com/${username}.png`;
    document.getElementById('profile-name-view').textContent = `@${username}`;
    document.getElementById('profile-sub-view').textContent = isMyPage ? "팬케이크 드라이브 인증 학생 개발자 🥞" : "인디 게임 크리에이터";

    const bannerView = document.getElementById('profile-banner-view');
    const bannerBtn = document.getElementById('banner-change-btn');
    const savedBanner = localStorage.getItem(`banner_${username}`);

    if (savedBanner) {
        bannerView.style.backgroundImage = `url(${savedBanner})`;
    } else {
        bannerView.style.backgroundImage = '';
    }

    const loggedInUser = localStorage.getItem('github_user');
    if (isMyPage && loggedInUser === username) {
        bannerBtn.classList.remove('hidden');
    } else {
        bannerBtn.classList.add('hidden');
    }

    switchMyPageTab('games');
    renderMyPageGames();
    renderMyPageStudios();
}

function switchMyPageTab(tab) {
    const tabGamesBtn = document.getElementById('tab-games-btn');
    const tabStudiosBtn = document.getElementById('tab-studios-btn');
    const tabGuestbookBtn = document.getElementById('tab-guestbook-btn');
    const secGames = document.getElementById('section-my-games');
    const secStudios = document.getElementById('section-my-studios');
    const secGuestbook = document.getElementById('section-guestbook');

    tabGamesBtn.className = "w-1/3 py-2 text-xs font-bold rounded-xl text-gray-500 hover:text-gray-700 transition";
    tabStudiosBtn.className = "w-1/3 py-2 text-xs font-bold rounded-xl text-gray-500 hover:text-gray-700 transition";
    tabGuestbookBtn.className = "w-1/3 py-2 text-xs font-bold rounded-xl text-gray-500 hover:text-gray-700 transition";
    secGames.classList.add('hidden');
    secStudios.classList.add('hidden');
    secGuestbook.classList.add('hidden');

    if (tab === 'games') {
        tabGamesBtn.className = "w-1/3 py-2 text-xs font-bold rounded-xl bg-white text-amber-900 shadow-sm transition";
        secGames.classList.remove('hidden');
    } else if (tab === 'studios') {
        tabStudiosBtn.className = "w-1/3 py-2 text-xs font-bold rounded-xl bg-white text-amber-900 shadow-sm transition";
        secStudios.classList.remove('hidden');
        renderMyPageStudios();
    } else {
        tabGuestbookBtn.className = "w-1/3 py-2 text-xs font-bold rounded-xl bg-white text-amber-900 shadow-sm transition";
        secGuestbook.classList.remove('hidden');
        renderDevGuestbook();
    }
}

function closeMyPageModal() {
    document.getElementById('mypage-modal').classList.add('hidden');
}

function renderMyPageGames() {
    const container = document.getElementById('section-my-games');
    let games = JSON.parse(localStorage.getItem('pancake_games')) || [];
    const targetUser = activeModalUser;
    const loggedInUser = localStorage.getItem('github_user');
    
    const userGames = games.filter(game => game.author === targetUser);

    if (userGames.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">등록된 게임이 없습니다.</div>`;
        return;
    }

    container.innerHTML = "";
    userGames.forEach((game) => {
        const realIndex = games.findIndex(g => g.title === game.title && g.repo === game.repo);
        const isOwner = loggedInUser === targetUser;

        const item = document.createElement('div');
        item.className = "flex items-center justify-between p-3 bg-white border border-amber-100 rounded-xl shadow-sm";
        item.innerHTML = `
            <div class="flex items-center space-x-3 cursor-pointer" onclick="closeMyPageModal(); openDetailModal(${realIndex})">
                <img src="${game.thumbnail}" alt="썸네일" class="w-10 h-10 rounded-lg object-cover border">
                <div>
                    <h5 class="font-bold text-xs text-gray-900">${game.title} <span class="ml-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] rounded-full">${game.genre}</span></h5>
                    <p class="text-[10px] text-gray-500">${game.repo}</p>
                </div>
            </div>
            ${isOwner ? `<button onclick="deleteGame(${realIndex})" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition cursor-pointer">연동 해제</button>` : ''}
        `;
        container.appendChild(item);
    });
}

function renderMyPageStudios() {
    const container = document.getElementById('section-my-studios');
    let studios = JSON.parse(localStorage.getItem('pancake_studios')) || [];
    const targetUser = activeModalUser;
    const loggedInUser = localStorage.getItem('github_user');

    const userStudios = studios.filter(s => s.author === targetUser);

    if (userStudios.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">등록된 스튜디오가 없습니다.</div>`;
        return;
    }

    container.innerHTML = "";
    userStudios.forEach((studio) => {
        const realIndex = studios.findIndex(s => s.name === studio.name);
        const isOwner = loggedInUser === targetUser;
        const logoContent = studio.logo && studio.logo.startsWith('data:') ? `<img src="${studio.logo}" class="w-full h-full object-cover">` : (studio.logo || "🥞");

        const item = document.createElement('div');
        item.className = "flex items-center justify-between p-3 bg-white border border-amber-100 rounded-xl shadow-sm";
        item.innerHTML = `
            <div class="flex items-center space-x-3 cursor-pointer" onclick="closeMyPageModal(); openStudioProfile('${studio.name}')">
                <div class="w-10 h-10 rounded-xl bg-amber-200 overflow-hidden border border-amber-300 flex items-center justify-center text-lg flex-shrink-0">${logoContent}</div>
                <div>
                    <h5 class="font-bold text-xs text-gray-900">${studio.name}</h5>
                    <p class="text-[10px] text-gray-500 line-clamp-1">${studio.desc}</p>
                </div>
            </div>
            ${isOwner ? `<button onclick="deleteStudio(${realIndex})" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap">스튜디오 폐지</button>` : ''}
        `;
        container.appendChild(item);
    });
}

function deleteStudio(index) {
    if (confirm('정말로 이 스튜디오를 폐지(삭제)하시겠습니까?')) {
        let studios = JSON.parse(localStorage.getItem('pancake_studios')) || [];
        studios.splice(index, 1);
        localStorage.setItem('pancake_studios', JSON.stringify(studios));
        renderMyPageStudios();
        renderStudios();
    }
}

function deleteGame(index) {
    if (confirm('정말 이 게임의 연동을 해제하시겠습니까?')) {
        let games = JSON.parse(localStorage.getItem('pancake_games')) || [];
        games.splice(index, 1);
        localStorage.setItem('pancake_games', JSON.stringify(games));
        renderMyPageGames(); 
        renderGames();
        closeDetailModal();
    }
}

function addDevGuestbook() {
    const input = document.getElementById('dev-guestbook-input');
    const text = input.value.trim();
    const loggedInUser = localStorage.getItem('github_user');

    if (!loggedInUser) { alert('로그인 후 작성할 수 있습니다.'); return; }
    if (!text) return;

    let guestbooks = JSON.parse(localStorage.getItem(`guestbook_${activeModalUser}`)) || [];
    guestbooks.unshift({
        author: loggedInUser, text: text,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        replies: []
    });

    localStorage.setItem(`guestbook_${activeModalUser}`, JSON.stringify(guestbooks));
    input.value = "";
    renderDevGuestbook();
}

function addDevReply(gbIndex) {
    const input = document.getElementById(`dev-reply-input-${gbIndex}`);
    const text = input.value.trim();
    const loggedInUser = localStorage.getItem('github_user');

    if (!loggedInUser) { alert('로그인 후 작성할 수 있습니다.'); return; }
    if (!text) return;

    let guestbooks = JSON.parse(localStorage.getItem(`guestbook_${activeModalUser}`)) || [];
    if (!guestbooks[gbIndex].replies) guestbooks[gbIndex].replies = [];

    guestbooks[gbIndex].replies.push({
        author: loggedInUser, text: text,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });

    localStorage.setItem(`guestbook_${activeModalUser}`, JSON.stringify(guestbooks));
    renderDevGuestbook();
}

function renderDevGuestbook() {
    const container = document.getElementById('dev-guestbook-list');
    let guestbooks = JSON.parse(localStorage.getItem(`guestbook_${activeModalUser}`)) || [];

    if (guestbooks.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">남겨진 방명록이 없습니다. 첫 응원의 메시지를 남겨보세요!</div>`;
        return;
    }

    container.innerHTML = "";
    guestbooks.forEach((gb, gbIndex) => {
        let repliesHtml = "";
        if (gb.replies && gb.replies.length > 0) {
            gb.replies.forEach(rep => {
                repliesHtml += `
                    <div class="flex items-start space-x-2 pl-6 mt-2 border-l-2 border-amber-200">
                        <img src="https://github.com/${rep.author}.png" class="w-5 h-5 rounded-full border">
                        <div class="bg-gray-50 p-2 rounded-xl text-xs w-full">
                            <div class="flex justify-between items-center mb-1">
                                <span class="font-bold text-amber-950">@${rep.author}</span>
                                <span class="text-[9px] text-gray-400">${rep.time}</span>
                            </div>
                            <p class="text-gray-700">${rep.text}</p>
                        </div>
                    </div>
                `;
            });
        }

        const item = document.createElement('div');
        item.className = "bg-white p-3 border border-amber-100 rounded-xl shadow-sm space-y-2";
        item.innerHTML = `
            <div class="flex items-start space-x-2">
                <img src="https://github.com/${gb.author}.png" class="w-6 h-6 rounded-full border">
                <div class="bg-amber-50/50 p-2.5 rounded-xl text-xs w-full">
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-bold text-amber-950">@${gb.author}</span>
                        <span class="text-[9px] text-gray-400">${gb.time}</span>
                    </div>
                    <p class="text-gray-800">${gb.text}</p>
                </div>
            </div>
            ${repliesHtml}
            <div class="flex space-x-2 pl-6 pt-1">
                <input type="text" id="dev-reply-input-${gbIndex}" placeholder="답글(대댓글) 남기기..." 
                       class="w-full px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500">
                <button onclick="addDevReply(${gbIndex})" class="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-medium transition cursor-pointer whitespace-nowrap">등록</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function openDetailModal(index) {
    if (isUiEditMode) return;

    let games = JSON.parse(localStorage.getItem('pancake_games')) || [];
    const game = games[index];
    if (!game) return;

    activeDetailGameIndex = index;
    document.getElementById('detail-genre-badge').textContent = game.genre || '기타';
    document.getElementById('detail-thumbnail').innerHTML = `<img src="${game.thumbnail}" alt="상세 썸네일" class="w-full h-full object-cover">`;
    document.getElementById('detail-title').textContent = game.title;
    document.getElementById('detail-author-avatar').src = `https://github.com/${game.author}.png`;
    document.getElementById('detail-author-name').textContent = `@${game.author}`;
    document.getElementById('detail-desc').textContent = game.desc;
    document.getElementById('detail-github-btn').href = `https://github.com/${game.repo}`;

    const loggedInUser = localStorage.getItem('github_user');
    const ownerActions = document.getElementById('detail-owner-actions');
    if (loggedInUser === game.author) {
        ownerActions.innerHTML = `<button onclick="deleteGame(${index})" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition cursor-pointer">연동 해제</button>`;
    } else {
        ownerActions.innerHTML = "";
    }

    switchDetailTab('comments');
    document.getElementById('detail-modal').classList.remove('hidden');
}

function closeDetailModal() {
    document.getElementById('detail-modal').classList.add('hidden');
}

function switchDetailTab(tab) {
    const btnComments = document.getElementById('detail-tab-comments-btn');
    const btnBugs = document.getElementById('detail-tab-bugs-btn');
    const secComments = document.getElementById('detail-section-comments');
    const secBugs = document.getElementById('detail-section-bugs');

    if (tab === 'comments') {
        btnComments.className = "w-1/2 py-2 text-xs font-bold rounded-xl bg-white text-amber-900 shadow-sm transition";
        btnBugs.className = "w-1/2 py-2 text-xs font-bold rounded-xl text-gray-500 hover:text-gray-700 transition";
        secComments.classList.remove('hidden');
        secBugs.classList.add('hidden');
        renderGameComments();
    } else {
        btnBugs.className = "w-1/2 py-2 text-xs font-bold rounded-xl bg-white text-amber-900 shadow-sm transition";
        btnComments.className = "w-1/2 py-2 text-xs font-bold rounded-xl text-gray-500 hover:text-gray-700 transition";
        secBugs.classList.remove('hidden');
        secComments.classList.add('hidden');
        renderGameBugs();
    }
}

function addGameComment() {
    const input = document.getElementById('game-comment-input');
    const text = input.value.trim();
    const loggedInUser = localStorage.getItem('github_user');

    if (!loggedInUser) { alert('로그인 후 작성할 수 있습니다.'); return; }
    if (!text) return;

    let games = JSON.parse(localStorage.getItem('pancake_games')) || [];
    const game = games[activeDetailGameIndex];
    const gameKey = `game_comments_${game.title}_${game.author}`;

    let comments = JSON.parse(localStorage.getItem(gameKey)) || [];
    comments.unshift({
        author: loggedInUser, text: text,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        replies: []
    });

    localStorage.setItem(gameKey, JSON.stringify(comments));
    input.value = "";
    renderGameComments();
}

function addGameReply(cIndex) {
    const input = document.getElementById(`game-reply-input-${cIndex}`);
    const text = input.value.trim();
    const loggedInUser = localStorage.getItem('github_user');

    if (!loggedInUser) { alert('로그인 후 작성할 수 있습니다.'); return; }
    if (!text) return;

    let games = JSON.parse(localStorage.getItem('pancake_games')) || [];
    const game = games[activeDetailGameIndex];
    const gameKey = `game_comments_${game.title}_${game.author}`;

    let comments = JSON.parse(localStorage.getItem(gameKey)) || [];
    if (!comments[cIndex].replies) comments[cIndex].replies = [];

    comments[cIndex].replies.push({
        author: loggedInUser, text: text,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });

    localStorage.setItem(gameKey, JSON.stringify(comments));
    renderGameComments();
}

function renderGameComments() {
    const container = document.getElementById('game-comments-list');
    let games = JSON.parse(localStorage.getItem('pancake_games')) || [];
    const game = games[activeDetailGameIndex];
    if (!game) return;

    const gameKey = `game_comments_${game.title}_${game.author}`;
    let comments = JSON.parse(localStorage.getItem(gameKey)) || [];

    if (comments.length === 0) {
        container.innerHTML = `<div class="p-3 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">아직 피드백이 없습니다. 첫 댓글을 남겨보세요!</div>`;
        return;
    }

    container.innerHTML = "";
    comments.forEach((c, cIndex) => {
        let repliesHtml = "";
        if (c.replies && c.replies.length > 0) {
            c.replies.forEach(rep => {
                repliesHtml += `
                    <div class="flex items-start space-x-2 pl-6 mt-2 border-l-2 border-amber-200">
                        <img src="https://github.com/${rep.author}.png" class="w-5 h-5 rounded-full border">
                        <div class="bg-gray-50 p-2 rounded-xl text-xs w-full">
                            <div class="flex justify-between items-center mb-1">
                                <span class="font-bold text-amber-950">@${rep.author}</span>
                                <span class="text-[9px] text-gray-400">${rep.time}</span>
                            </div>
                            <p class="text-gray-700">${rep.text}</p>
                        </div>
                    </div>
                `;
            });
        }

        const item = document.createElement('div');
        item.className = "bg-white p-3 border border-amber-100 rounded-xl shadow-sm space-y-2";
        item.innerHTML = `
            <div class="flex items-start space-x-2">
                <img src="https://github.com/${c.author}.png" class="w-6 h-6 rounded-full border">
                <div class="bg-amber-50/50 p-2.5 rounded-xl text-xs w-full">
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-bold text-amber-950">@${c.author}</span>
                        <span class="text-[9px] text-gray-400">${c.time}</span>
                    </div>
                    <p class="text-gray-800">${c.text}</p>
                </div>
            </div>
            ${repliesHtml}
            <div class="flex space-x-2 pl-6 pt-1">
                <input type="text" id="game-reply-input-${cIndex}" placeholder="답글(대댓글) 남기기..." 
                       class="w-full px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500">
                <button onclick="addGameReply(${cIndex})" class="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-medium transition cursor-pointer whitespace-nowrap">등록</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function addGameBugReport() {
    const input = document.getElementById('game-bug-input');
    const text = input.value.trim();
    const loggedInUser = localStorage.getItem('github_user');

    if (!loggedInUser) { alert('로그인 후 제보할 수 있습니다.'); return; }
    if (!text) return;

    let games = JSON.parse(localStorage.getItem('pancake_games')) || [];
    const game = games[activeDetailGameIndex];
    const bugKey = `game_bugs_${game.title}_${game.author}`;

    let bugs = JSON.parse(localStorage.getItem(bugKey)) || [];
    bugs.unshift({
        author: loggedInUser, text: text,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });

    localStorage.setItem(bugKey, JSON.stringify(bugs));
    input.value = "";
    renderGameBugs();
}

function renderGameBugs() {
    const container = document.getElementById('game-bugs-list');
    let games = JSON.parse(localStorage.getItem('pancake_games')) || [];
    const game = games[activeDetailGameIndex];
    if (!game) return;

    const bugKey = `game_bugs_${game.title}_${game.author}`;
    let bugs = JSON.parse(localStorage.getItem(bugKey)) || [];

    if (bugs.length === 0) {
        container.innerHTML = `<div class="p-3 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">제보된 버그가 없습니다. 쾌적한 플레이 환경을 위해 버그를 제보해 주세요!</div>`;
        return;
    }

    container.innerHTML = "";
    bugs.forEach((b) => {
        const item = document.createElement('div');
        item.className = "bg-white p-3 border border-red-100 rounded-xl shadow-sm flex items-start space-x-2";
        item.innerHTML = `
            <img src="https://github.com/${b.author}.png" class="w-6 h-6 rounded-full border">
            <div class="bg-red-50/50 p-2.5 rounded-xl text-xs w-full">
                <div class="flex justify-between items-center mb-1">
                    <span class="font-bold text-red-950">@${b.author}</span>
                    <span class="text-[9px] text-gray-400">${b.time}</span>
                </div>
                <p class="text-gray-800">${b.text}</p>
            </div>
        `;
        container.appendChild(item);
    });
}

function openStudioBoardModal() {
    renderStudios();
    renderRecruitPosts();
    document.getElementById('studio-board-modal').classList.remove('hidden');
}

function closeStudioBoardModal() {
    document.getElementById('studio-board-modal').classList.add('hidden');
}

function switchStudioBoardTab(tab) {
    const tabStudios = document.getElementById('board-tab-studios');
    const tabRecruit = document.getElementById('board-tab-recruit');
    const secStudios = document.getElementById('board-section-studios');
    const secRecruit = document.getElementById('board-section-recruit');

    if (tab === 'studios') {
        tabStudios.className = "px-6 py-2 rounded-xl text-xs font-bold bg-white text-amber-900 shadow-sm transition";
        tabRecruit.className = "px-6 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 transition";
        secStudios.classList.remove('hidden');
        secRecruit.classList.add('hidden');
    } else {
        tabRecruit.className = "px-6 py-2 rounded-xl text-xs font-bold bg-white text-amber-900 shadow-sm transition";
        tabStudios.className = "px-6 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 transition";
        secRecruit.classList.remove('hidden');
        secStudios.classList.add('hidden');
    }
}

function openStudioModal() {
    document.getElementById('studio-modal').classList.remove('hidden');
    const container = document.getElementById('link-rows-container');
    if (container.children.length === 0) {
        addLinkInputRow();
    }
}

function closeStudioModal() {
    document.getElementById('studio-modal').classList.add('hidden');
}

function addLinkInputRow(type = '기타', customName = '', url = '') {
    const container = document.getElementById('link-rows-container');
    const row = document.createElement('div');
    row.className = "flex space-x-2 items-center link-row";
    row.innerHTML = `
        <select class="link-type-select px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500" onchange="toggleCustomLabel(this)">
            <option value="톡방" ${type === '톡방' ? 'selected' : ''}>💬 톡방</option>
            <option value="디스코드" ${type === '디스코드' ? 'selected' : ''}>🎮 디스코드</option>
            <option value="깃허브" ${type === '깃허브' ? 'selected' : ''}>🐱 깃허브</option>
            <option value="기타" ${type === '기타' ? 'selected' : ''}>🔗 기타 (직접 입력)</option>
        </select>
        <input type="text" placeholder="링크 이름" value="${customName}" 
               class="link-label-input px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs w-28 ${type === '기타' ? '' : 'hidden'}">
        <input type="text" placeholder="https://..." value="${url}" required
               class="link-url-input w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500">
        <button type="button" onclick="this.parentElement.remove()" class="text-gray-400 hover:text-red-500 font-bold px-2 cursor-pointer">&times;</button>
    `;
    container.appendChild(row);
}

function toggleCustomLabel(selectEl) {
    const row = selectEl.parentElement;
    const labelInput = row.querySelector('.link-label-input');
    if (selectEl.value === '기타') {
        labelInput.classList.remove('hidden');
        labelInput.required = true;
    } else {
        labelInput.classList.add('hidden');
        labelInput.required = false;
        labelInput.value = '';
    }
}

function openRecruitModal() {
    updateStudioSelectOptions();
    document.getElementById('recruit-modal').classList.remove('hidden');
}

function closeRecruitModal() {
    document.getElementById('recruit-modal').classList.add('hidden');
}

function updatePreview() {
    const name = document.getElementById('studio-name').value;
    const desc = document.getElementById('studio-desc').value;
    
    document.getElementById('preview-name').textContent = name || "스튜디오 이름을 입력하세요";
    document.getElementById('preview-desc').textContent = desc || "스튜디오 소개 및 비전이 여기에 표시됩니다.";

    const checkedTechs = Array.from(document.querySelectorAll('input[name="tech"]:checked')).map(el => el.value);
    const badgesContainer = document.getElementById('preview-badges');
    badgesContainer.innerHTML = "";

    checkedTechs.forEach(tech => {
        const badge = document.createElement('span');
        badge.className = "px-2.5 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-bold rounded-full shadow-xs";
        badge.textContent = tech;
        badgesContainer.appendChild(badge);
    });
}

function updatePreviewLogo(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
        previewLogoBase64 = reader.result;
        document.getElementById('preview-logo-box').innerHTML = `<img src="${previewLogoBase64}" class="w-full h-full object-cover">`;
    };
}

function updatePreviewBanner(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
        previewBannerBase64 = reader.result;
        document.getElementById('preview-banner').style.backgroundImage = `url(${previewBannerBase64})`;
    };
}

function openStudioProfile(studioName) {
    let studios = JSON.parse(localStorage.getItem('pancake_studios')) || [];
    const studio = studios.find(s => s.name === studioName);

    const studioData = studio || {
        name: "시럽 스튜디오",
        desc: "도트 감성 플랫폼 액션 게임을 함께 만드는 학생 개발 팀입니다.",
        techs: ["Unity", "Blender", "PixelArt"],
        links: [
            { type: "디스코드", customName: "", url: "https://discord.com" },
            { type: "톡방", customName: "", url: "https://open.kakao.com" },
            { type: "깃허브", customName: "", url: "https://github.com" }
        ],
        logo: "🥞",
        banner: ""
    };

    document.getElementById('modal-studio-name').textContent = studioData.name;
    document.getElementById('modal-studio-desc').textContent = studioData.desc;
    
    const bannerBox = document.getElementById('modal-studio-banner');
    if (studioData.banner && studioData.banner.startsWith('data:')) {
        bannerBox.style.backgroundImage = `url(${studioData.banner})`;
    } else {
        bannerBox.style.backgroundImage = '';
    }

    const logoBox = document.getElementById('modal-studio-logo');
    if (studioData.logo && studioData.logo.startsWith('data:')) {
        logoBox.innerHTML = `<img src="${studioData.logo}" class="w-full h-full object-cover">`;
    } else {
        logoBox.textContent = studioData.logo || "🥞";
    }

    const modalBadges = document.getElementById('modal-studio-badges');
    modalBadges.innerHTML = "";
    (studioData.techs || []).forEach(tech => {
        const badge = document.createElement('span');
        badge.className = "px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200";
        badge.textContent = tech;
        modalBadges.appendChild(badge);
    });

    const linksContainer = document.getElementById('modal-studio-links');
    linksContainer.innerHTML = "";
    
    const linksList = studioData.links || [];
    linksList.forEach(link => {
        let icon = "🔗";
        let bgStyle = "bg-gray-800 hover:bg-gray-900 text-white";
        let label = link.type === "기타" ? (link.customName || "관련 링크") : `${link.type} 방문하기`;

        if (link.type === "톡방") {
            icon = "💬";
            bgStyle = "bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-bold";
            label = "카카오 오픈 톡방 참여하기";
        } else if (link.type === "디스코드") {
            icon = "🎮";
            bgStyle = "bg-indigo-600 hover:bg-indigo-700 text-white";
            label = "디스코드 커뮤니티 입장하기";
        } else if (link.type === "깃허브") {
            icon = "🐱";
            bgStyle = "bg-gray-900 hover:bg-black text-white";
            label = "깃허브 저장소 방문하기";
        }

        const a = document.createElement('a');
        a.href = link.url;
        a.target = "_blank";
        a.className = `block w-full py-2.5 px-4 rounded-xl text-xs font-medium transition text-center shadow-sm flex items-center justify-center space-x-2 ${bgStyle}`;
        a.innerHTML = `<span>${icon}</span><span>${label}</span>`;
        linksContainer.appendChild(a);
    });

    let games = JSON.parse(localStorage.getItem('pancake_games')) || [];
    const studioGames = games.filter(g => g.author === studioData.name || g.studio === studioData.name);
    const gamesContainer = document.getElementById('modal-studio-games');

    if (studioGames.length === 0) {
        gamesContainer.innerHTML = `<div class="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl">아직 등록된 게임이 없습니다.</div>`;
    } else {
        gamesContainer.innerHTML = "";
        studioGames.forEach(g => {
            gamesContainer.innerHTML += `
                <div class="flex items-center space-x-3 p-2 bg-gray-50 rounded-xl">
                    <img src="${g.thumbnail}" class="w-8 h-8 rounded-lg object-cover">
                    <span class="font-bold text-xs text-gray-800">${g.title}</span>
                </div>
            `;
        });
    }

    document.getElementById('studio-profile-modal').classList.remove('hidden');
}

function closeStudioProfileModal() {
    document.getElementById('studio-profile-modal').classList.add('hidden');
}

function handleStudioUpload(event) {
    event.preventDefault();
    const name = document.getElementById('studio-name').value;
    const desc = document.getElementById('studio-desc').value;
    const techs = Array.from(document.querySelectorAll('input[name="tech"]:checked')).map(el => el.value);
    const loggedInUser = localStorage.getItem('github_user');

    const linkRows = document.querySelectorAll('.link-row');
    let links = [];
    linkRows.forEach(row => {
        const type = row.querySelector('.link-type-select').value;
        const customName = row.querySelector('.link-label-input').value.trim();
        const url = row.querySelector('.link-url-input').value.trim();
        if (url) {
            links.push({ type, customName, url });
        }
    });

    const newStudio = { 
        name, desc, techs, links, 
        logo: previewLogoBase64 || "🥞",
        banner: previewBannerBase64 || "",
        author: loggedInUser
    };

    try {
        let studios = JSON.parse(localStorage.getItem('pancake_studios')) || [];
        studios.unshift(newStudio);
        localStorage.setItem('pancake_studios', JSON.stringify(studios));

        alert(`🎉 "${name}" 스튜디오가 성공적으로 창설되었습니다!`);
        closeStudioModal();
        event.target.reset();
        document.getElementById('link-rows-container').innerHTML = "";
        previewLogoBase64 = "";
        previewBannerBase64 = "";
        document.getElementById('preview-logo-box').textContent = "🥞";
        document.getElementById('preview-banner').style.backgroundImage = "";
        updatePreview();
        renderStudios();
    } catch (error) {
        console.error(error);
        alert('⚠️ 이미지 용량이 너무 커서 브라우저 저장소(localStorage) 용량을 초과했습니다!');
    }
}

function handleRecruitUpload(event) {
    event.preventDefault();
    const studioName = document.getElementById('recruit-studio-select').value;
    const role = document.getElementById('recruit-role').value;
    const desc = document.getElementById('recruit-desc').value;

    const newPost = { studioName, role, desc, time: "방금 전" };

    try {
        let posts = JSON.parse(localStorage.getItem('pancake_teams')) || [];
        posts.unshift(newPost);
        localStorage.setItem('pancake_teams', JSON.stringify(posts));

        alert('📢 팀원 모집 공고가 등록되었습니다!');
        closeRecruitModal();
        event.target.reset();
        renderRecruitPosts();
    } catch (error) {
        alert('⚠️ 저장 공간이 부족합니다.');
    }
}

function updateStudioSelectOptions() {
    const select = document.getElementById('recruit-studio-select');
    let studios = JSON.parse(localStorage.getItem('pancake_studios')) || [];

    select.innerHTML = '<option value="">등록된 스튜디오를 선택하세요</option>';
    studios.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = s.name;
        select.appendChild(opt);
    });
}

function renderStudios() {
    const grid = document.getElementById('studio-grid');
    let studios = JSON.parse(localStorage.getItem('pancake_studios')) || [];

    if (studios.length === 0) {
        grid.innerHTML = `
            <div class="bg-white/40 border border-white/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                    <div class="flex items-center space-x-3 mb-3">
                        <div class="w-12 h-12 rounded-xl bg-amber-200 flex items-center justify-center text-xl shadow-sm">🥞</div>
                        <div>
                            <h3 class="font-extrabold text-gray-900 text-sm">시럽 스튜디오</h3>
                            <span class="text-[10px] text-amber-800/70 font-semibold">공식 샘플 스튜디오</span>
                        </div>
                    </div>
                    <p class="text-xs text-gray-600 mb-3">도트 감성 플랫폼 액션 게임을 함께 만드는 학생 개발 팀입니다.</p>
                    <div class="flex flex-wrap gap-1 mb-4">
                        <span class="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">Unity</span>
                        <span class="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">Blender</span>
                    </div>
                </div>
                <button onclick="openStudioProfile('시럽 스튜디오')" class="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition cursor-pointer">스튜디오 방문하기</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = "";
    studios.forEach(studio => {
        const logoContent = studio.logo && studio.logo.startsWith('data:') ? `<img src="${studio.logo}" class="w-full h-full object-cover">` : (studio.logo || "🥞");
        let badgesHtml = "";
        (studio.techs || []).forEach(t => {
            badgesHtml += `<span class="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">${t}</span>`;
        });

        const card = document.createElement('div');
        card.className = "bg-white/40 border border-white/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between";
        card.innerHTML = `
            <div>
                <div class="flex items-center space-x-3 mb-3">
                    <div class="w-12 h-12 rounded-xl bg-amber-200 overflow-hidden border border-amber-300 flex items-center justify-center text-xl flex-shrink-0">${logoContent}</div>
                    <div>
                        <h3 class="font-extrabold text-gray-900 text-sm">${studio.name}</h3>
                        <span class="text-[10px] text-amber-800/70 font-semibold">학생 인디 스튜디오</span>
                    </div>
                </div>
                <p class="text-xs text-gray-600 mb-3">${studio.desc}</p>
                <div class="flex flex-wrap gap-1 mb-4">${badgesHtml}</div>
            </div>
            <button onclick="openStudioProfile('${studio.name}')" class="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition cursor-pointer">스튜디오 방문하기</button>
        `;
        grid.appendChild(card);
    });
}

function renderRecruitPosts() {
    const grid = document.getElementById('recruit-grid');
    let posts = JSON.parse(localStorage.getItem('pancake_teams')) || [];

    if (posts.length === 0) {
        grid.innerHTML = `
            <div class="bg-white/40 border border-white/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-start mb-3">
                        <span class="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">픽셀 아티스트</span>
                        <span class="text-[10px] text-gray-400">오늘</span>
                    </div>
                    <h3 class="font-extrabold text-gray-900 text-base mb-1">시럽 스튜디오</h3>
                    <p class="text-xs text-gray-600 mb-6">따뜻한 도트 감성의 액션 게임을 같이 만드실 아티스트분을 모셔요!</p>
                </div>
                <button onclick="openStudioProfile('시럽 스튜디오')" class="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-medium transition text-center shadow-sm cursor-pointer">
                    스튜디오 방문 및 지원하기
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = "";
    posts.forEach(post => {
        const card = document.createElement('div');
        card.className = "bg-white/40 border border-white/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between";
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-3">
                    <span class="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">${post.role}</span>
                    <span class="text-[10px] text-gray-400">${post.time}</span>
                </div>
                <h3 class="font-extrabold text-gray-900 text-base mb-1">${post.studioName}</h3>
                <p class="text-xs text-gray-600 mb-6">${post.desc}</p>
            </div>
            <button onclick="openStudioProfile('${post.studioName}')" class="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-medium transition text-center shadow-sm cursor-pointer">
                스튜디오 방문 및 지원하기
            </button>
        `;
        grid.appendChild(card);
    });
}

function toggleDropdownList() {
    const list = document.getElementById('dropdown-list');
    const arrow = document.getElementById('dropdown-arrow');
    if (list.classList.contains('hidden')) {
        list.classList.remove('hidden');
        arrow.classList.add('rotate-180');
    } else {
        closeDropdownList();
    }
}

function closeDropdownList() {
    document.getElementById('dropdown-list').classList.add('hidden');
    document.getElementById('dropdown-arrow').classList.remove('rotate-180');
}

async function loadUserRepositories() {
    const loggedInUser = localStorage.getItem('github_user');
    if (!loggedInUser) { alert('로그인 정보가 없습니다.'); return; }

    const dropdownList = document.getElementById('dropdown-list');
    const selectedText = document.getElementById('selected-repo-text');
    selectedText.textContent = "저장소 불러오는 중...";
    dropdownList.innerHTML = '<div class="px-4 py-3 text-xs text-gray-400 text-center">불러오는 중...</div>';

    try {
        const response = await fetch(`https://api.github.com/users/${loggedInUser}/repos?per_page=100&sort=updated`);
        if (response.ok) {
            const repos = await response.json();
            dropdownList.innerHTML = '';
            if (repos.length === 0) {
                dropdownList.innerHTML = '<div class="px-4 py-3 text-xs text-gray-400 text-center">공개된 저장소가 없습니다.</div>';
                selectedText.textContent = "저장소가 없습니다";
                return;
            }
            repos.forEach(repo => {
                const item = document.createElement('div');
                item.className = "px-4 py-2.5 text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-900 cursor-pointer transition flex justify-between items-center";
                item.innerHTML = `<span>${repo.name}</span> <span class="text-[10px] text-gray-400">공개</span>`;
                item.onclick = () => {
                    selectedRepoValue = repo.full_name;
                    selectedText.textContent = repo.full_name;
                    selectedText.className = "text-gray-800 font-semibold";
                    closeDropdownList();
                };
                dropdownList.appendChild(item);
            });
            selectedText.textContent = "저장소를 선택해주세요";
        } else {
            dropdownList.innerHTML = '<div class="px-4 py-3 text-xs text-red-500 text-center">저장소 조회 실패</div>';
        }
    } catch (error) {
        dropdownList.innerHTML = '<div class="px-4 py-3 text-xs text-red-500 text-center">네트워크 오류</div>';
    }
}

function handleGameUpload(event) {
    event.preventDefault();
    const title = document.getElementById('game-title').value;
    const genre = document.getElementById('game-genre').value;
    const desc = document.getElementById('game-desc').value;
    const thumbnailFile = document.getElementById('game-thumbnail').files[0];
    const loggedInUser = localStorage.getItem('github_user');

    if (!selectedRepoValue) { alert('연동할 GitHub 저장소를 선택해주세요!'); return; }

    const reader = new FileReader();
    reader.readAsDataURL(thumbnailFile);
    reader.onload = function () {
        const newGame = { title, genre, desc, thumbnail: reader.result, repo: selectedRepoValue, author: loggedInUser };
        try {
            let games = JSON.parse(localStorage.getItem('pancake_games')) || [];
            games.unshift(newGame);
            localStorage.setItem('pancake_games', JSON.stringify(games));
            alert(`🎉 "${title}" 게임이 메인에 등록되었습니다!`);
            closeUploadModal();
            document.getElementById('upload-form').reset();
            selectedRepoValue = "";
            document.getElementById('selected-repo-text').textContent = "우측 상단의 '저장소 목록 불러오기'를 누르세요";
            renderGames();
        } catch (e) {
            alert('⚠️ 이미지 용량이 너무 큽니다.');
        }
    };
}

function renderGames() {
    const grid = document.getElementById('game-grid');
    let games = JSON.parse(localStorage.getItem('pancake_games')) || [];

    let filteredGames = games.filter(game => {
        const matchesGenre = currentGenreFilter === "전체" || game.genre === currentGenreFilter;
        const matchesSearch = game.title.toLowerCase().includes(currentSearchKeyword) || game.desc.toLowerCase().includes(currentSearchKeyword);
        return matchesGenre && matchesSearch;
    });

    if (isPopularView) {
        filteredGames = [...games].sort(() => 0.5 - Math.random());
    }

    if (filteredGames.length === 0) {
        grid.innerHTML = `
            <div class="col-span-3 p-12 text-center text-gray-500 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50">
                <span class="text-3xl block mb-2">🔍</span> 조건에 맞는 게임이 없습니다.
            </div>
        `;
        return;
    }

    grid.innerHTML = "";
    filteredGames.forEach((game) => {
        const realIndex = games.findIndex(g => g.title === game.title && g.repo === game.repo);
        const card = document.createElement('div');
        card.className = "backdrop-blur-md bg-white/40 border border-white/50 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:scale-[1.02] transition cursor-pointer flex flex-col justify-between";
        card.onclick = () => openDetailModal(realIndex);
        card.innerHTML = `
            <div>
                <div class="h-40 bg-amber-100 rounded-xl mb-4 overflow-hidden flex items-center justify-center border border-amber-200/50 relative">
                    <span class="absolute top-2 left-2 px-2.5 py-0.5 bg-white/80 backdrop-blur-sm text-[10px] font-bold text-amber-900 rounded-full">${game.genre || '기타'}</span>
                    <img src="${game.thumbnail}" alt="썸네일" class="w-full h-full object-cover">
                </div>
                <h3 class="font-bold text-gray-900 mb-2">${game.title}</h3>
                <div class="flex items-center space-x-2.5 mb-3">
                    <img src="https://github.com/${game.author}.png" alt="프로필" class="w-6 h-6 rounded-full border border-amber-300">
                    <div class="flex flex-col text-left">
                        <span class="font-bold text-[11px] text-amber-950">@${game.author}</span>
                        <span class="text-[8px] text-amber-800/70">학생 개발자</span>
                    </div>
                </div>
                <p class="text-xs text-gray-600 mb-2">${game.desc}</p>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const customTexts = JSON.parse(localStorage.getItem('pancake_custom_texts')) || {};
    if (customTexts.heroTitle) {
        document.getElementById('editable-hero-title').textContent = customTexts.heroTitle;
    }
    if (customTexts.sectionTitle) {
        document.getElementById('editable-section-title').textContent = customTexts.sectionTitle;
    }

    const customTabs = JSON.parse(localStorage.getItem('pancake_custom_tabs')) || {};
    const genreButtons = document.querySelectorAll('.genre-btn');
    genreButtons.forEach(btn => {
        const gKey = btn.getAttribute('data-genre');
        if (customTabs[gKey]) {
            btn.textContent = customTabs[gKey];
        }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    if (authCode) {
        localStorage.setItem('github_user', 'daroo919'); 
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const loggedInUser = localStorage.getItem('github_user');
    if (loggedInUser) {
        const authContainer = document.getElementById('auth-container');
        const savedBanner = localStorage.getItem(`banner_${loggedInUser}`);
        
        authContainer.innerHTML = `
            <div class="relative">
                <div id="profile-widget-btn" onclick="toggleDiscordProfilePopup(event)" class="flex items-center space-x-3 px-3 py-1.5 bg-white/70 backdrop-blur-md border border-white/50 rounded-2xl shadow-sm cursor-pointer hover:bg-white/90 transition">
                    <img src="https://github.com/${loggedInUser}.png" alt="프로필" class="w-8 h-8 rounded-full border border-amber-300">
                    <div class="flex flex-col text-left">
                        <span class="font-bold text-xs text-amber-950">@${loggedInUser}</span>
                        <span class="text-[9px] text-amber-800/70">학생 개발자</span>
                    </div>
                </div>

                <div id="discord-profile-popup" class="absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur-md text-gray-800 rounded-3xl shadow-2xl border border-amber-200 overflow-hidden hidden z-50 select-none">
                    <div class="h-24 bg-amber-200 relative bg-cover bg-center" style="${savedBanner ? `background-image: url(${savedBanner});` : ''}"></div>
                    <div class="px-4 pb-4 relative">
                        <div class="flex items-end -mt-10 mb-3 relative z-10">
                            <div class="w-16 h-16 rounded-full border-4 border-white overflow-hidden bg-amber-100 shadow-md flex-shrink-0">
                                <img src="https://github.com/${loggedInUser}.png" alt="아바타" class="w-full h-full object-cover">
                            </div>
                        </div>
                        <div class="mb-4">
                            <h3 class="font-extrabold text-base text-amber-950">한다루 (Daroo)</h3>
                            <p class="text-xs text-amber-800/70">@${loggedInUser} • 학생 개발자</p>
                        </div>
                        <div class="bg-amber-50 rounded-2xl p-1.5 space-y-1 border border-amber-100">
                            <button onclick="openMyPageModal()" class="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-700 hover:bg-amber-100/70 hover:text-amber-950 rounded-xl transition cursor-pointer">
                                <span>👤 마이 페이지 바로가기</span>
                                <span class="text-amber-600">›</span>
                            </button>
                            <button onclick="logout()" class="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition cursor-pointer">
                                <span>🚪 로그아웃</span>
                                <span class="text-red-400">›</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderGames();
});

function logout() {
    localStorage.removeItem('github_user');
    window.location.href = window.location.pathname;
}

document.getElementById('github-login-btn').addEventListener('click', function() {
    const CLIENT_ID = '여기에_실제_클라이언트_ID를_입력하세요';
    const REDIRECT_URI = 'http://127.0.0.1:5500/';
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=repo,read:user`;
});