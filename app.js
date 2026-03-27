// app.js - 보안 강화 및 5분 자동 저장 버전

document.addEventListener('DOMContentLoaded', () => {
    const aboutSlot = document.getElementById('about-display-area');
    const aboutInput = document.getElementById('about-file-input');
    const projectContainer = document.getElementById('projects-container');
    const projectInput = document.getElementById('direct-project-file-input');
    const editModeTriggers = document.querySelectorAll('.edit-mode-trigger');
    const clearBtn = document.getElementById('clear-storage');

    let isEditMode = false;
    let isLoggedIn = false;
    let currentProjectIndex = null;
    
    // 데이터 로드
    let projects = JSON.parse(localStorage.getItem('portfolio_projects')) || new Array(6).fill(null);
    let aboutFile = JSON.parse(localStorage.getItem('about_file')) || null;

    // --- 1. 카카오 SDK 초기화 (안정적인 1.x) ---
    const KAKAO_KEY = '84bc6e0cb6d58fc4fca663bb14964778';
    function initializeKakao() {
        try {
            if (window.Kakao && !Kakao.isInitialized()) {
                Kakao.init(KAKAO_KEY);
            }
        } catch (e) {
            console.error('Kakao init error:', e);
        }
    }
    initializeKakao();

    // --- 2. 로그인/로그아웃 로직 ---
    window.loginWithKakao = function() {
        if (!window.Kakao || !Kakao.Auth) {
            setTimeout(window.loginWithKakao, 1000);
            return;
        }
        Kakao.Auth.login({
            success: fetchUserInfo,
            fail: (err) => { console.error('Login Fail:', err); }
        });
    };

    window.logoutWithKakao = function() {
        if (Kakao.Auth.getAccessToken()) {
            Kakao.Auth.logout(() => {
                isLoggedIn = false;
                updateAuthUI(null);
                renderAll();
                alert('로그아웃 되었습니다. 편집 권한이 해제됩니다.');
            });
        }
    };

    function fetchUserInfo() {
        Kakao.API.request({
            url: '/v2/user/me',
            success: (res) => {
                isLoggedIn = true;
                try {
                    updateAuthUI(res);
                } catch(e) { console.error('UI Update Error:', e); }
                renderAll(); // 즉각적인 렌더링 강제 실행
            },
            fail: (err) => {
                console.error(err);
                alert('계정 정보를 가져오지 못했습니다. 다시 시도해주세요.');
            }
        });
    }

    function updateAuthUI(user) {
        const loggedOutView = document.getElementById('logged-out-view');
        const loggedInView = document.getElementById('logged-in-view');

        if (user) {
            // [핵심해결] 바디에 로그인 클래스를 부여하여 모든 편집 버튼을 CSS로 즉시 노출
            document.body.classList.add('logged-in');
            
            if (loggedOutView) loggedOutView.style.display = 'none';
            if (loggedInView) loggedInView.style.display = 'flex';
            
            // 안전한 데이터를 추출하여 예외 방지 (에러 시 렌더링이 멈추는 현상 완벽 차단)
            const nickname = user?.properties?.nickname || user?.kakao_account?.profile?.nickname || '관리자';
            const avatarUrl = user?.properties?.thumbnail_image || user?.kakao_account?.profile?.thumbnail_image_url || '';
            
            const nickEl = document.getElementById('user-nickname');
            const avatarEl = document.getElementById('user-avatar');
            if(nickEl) nickEl.innerText = nickname;
            if(avatarEl) avatarEl.src = avatarUrl;
            
        } else {
            // 로그아웃 시 클래스 제거하여 편집 버튼 일괄 숨김
            document.body.classList.remove('logged-in');
            
            if (loggedOutView) loggedOutView.style.display = 'block';
            if (loggedInView) loggedInView.style.display = 'none';
            
            isEditMode = false;
            document.body.classList.remove('body-editing');
        }
    }


    // 프로필 메뉴 토글 (삼각형 클릭)
    window.toggleProfileMenu = function() {
        const menu = document.getElementById('profile-side-menu');
        const triangle = document.getElementById('profile-triangle-btn');
        if (menu) menu.classList.toggle('show');
        if (triangle) triangle.classList.toggle('active');
    };

    // 메뉴 바깥 클릭 시 닫기
    document.addEventListener('click', (e) => {
        const container = document.querySelector('.profile-dropdown-container');
        const menu = document.getElementById('profile-side-menu');
        const triangle = document.getElementById('profile-triangle-btn');
        if (container && !container.contains(e.target)) {
            if (menu) menu.classList.remove('show');
            if (triangle) triangle.classList.remove('active');
        }
    });

    // 5분마다 자동 저장 (300,000ms)
    setInterval(() => {
        if (isLoggedIn) {
            saveToLocal();
            console.log('5-Minute Auto-Backup Complete');
        }
    }, 300000);

    // --- 3. 렌더링 (사용자 맞춤형 정교한 로직) ---
    function renderAll() {
        renderAbout();
        renderProjects();
        updateEditButtonStates();
        // 포커스 재계산은 렌더링 직후 수행
        setTimeout(updateSliderFocus, 100);
    }

    function renderAbout() {
        aboutSlot.innerHTML = '';
        if (aboutFile) {
            // [데이터가 있을 때] + 버튼을 숨기고 내용만 보여줌
            const container = document.createElement('div');
            container.className = 'thumbnail-wrapper';
            container.style.height = '100%';
            if (aboutFile.type === 'pdf') {
                container.innerHTML = `<div class="pdf-thumbnail"><div class="pdf-icon-visual">PDF</div><p class="pdf-name">${aboutFile.name}</p></div>`;
            } else {
                container.innerHTML = `<img src="${aboutFile.url}" class="thumbnail-img">`;
            }

            // [편집 모드일 때만] 삭제 버튼 노출
            if (isEditMode && isLoggedIn) {
                const del = document.createElement('button');
                del.className = 'delete-btn';
                del.innerHTML = '&times;';
                del.onclick = (e) => { 
                    e.stopPropagation(); 
                    if(confirm('삭제하시겠습니까?')) { aboutFile = null; saveToLocal(); renderAbout(); }
                };
                aboutSlot.appendChild(del);
            } else {
                container.onclick = () => { window.open(aboutFile.url, '_blank'); };
            }
            aboutSlot.appendChild(container);
        } else {
            // [데이터가 없을 때] 로그인 상태라면 + 버튼 노출
            if (isLoggedIn) {
                const addBtn = document.createElement('div');
                addBtn.className = 'add-cta-main';
                addBtn.innerHTML = '+';
                addBtn.onclick = (e) => { e.stopPropagation(); aboutInput.click(); };
                aboutSlot.appendChild(addBtn);
            } else {
                aboutSlot.innerHTML = `<p style="opacity: 0.15; font-size: 0.8rem; letter-spacing: 3px;">PRIVATE SPACE</p>`;
            }
        }
    }

    function renderProjects() {
        projectContainer.innerHTML = '';
        projects.forEach((proj, i) => {
            const item = document.createElement('div');
            item.className = 'project-item';
            const box = document.createElement('div');
            box.className = 'square-box glass-card';
            
            if (proj) {
                // [데이터가 있을 때] 내용만 노출
                if (proj.type === 'pdf') {
                    box.innerHTML = `<div class="pdf-thumbnail"><div class="pdf-icon-visual" style="width: 80px; height: 110px;">PDF</div><p class="pdf-name">${proj.name}</p></div>`;
                } else {
                    box.innerHTML = `<img src="${proj.url}" class="thumbnail-img">`;
                }
                
                // [편집 모드일 때만] 삭제 버튼 노출
                if (isEditMode && isLoggedIn) {
                    const del = document.createElement('button');
                    del.className = 'delete-btn';
                    del.innerHTML = '&times;';
                    del.onclick = (e) => { 
                        e.stopPropagation(); 
                        if(confirm(`프로젝트 ${i+1} 삭제?`)) { projects[i] = null; saveToLocal(); renderProjects(); }
                    };
                    item.appendChild(del);
                } else {
                    box.onclick = () => { window.open(proj.url, '_blank'); };
                }
            } else {
                // [데이터가 없을 때] 로그인 상태인 관리자에게만 + 버튼 노출
                if (isLoggedIn) {
                    const addBtn = document.createElement('div');
                    addBtn.className = 'add-cta-main';
                    addBtn.innerHTML = '+';
                    addBtn.style.transform = 'scale(0.8)';
                    addBtn.onclick = (e) => { e.stopPropagation(); currentProjectIndex = i; projectInput.click(); };
                    box.style.display = 'flex'; box.style.justifyContent = 'center'; box.style.alignItems = 'center';
                    box.appendChild(addBtn);
                } else {
                    box.innerHTML = `<p style="opacity: 0.05; letter-spacing: 5px; font-size: 0.6rem;">PRIVATE SLOT</p>`;
                    box.style.display = 'flex'; box.style.justifyContent = 'center'; box.style.alignItems = 'center';
                }
            }
            item.appendChild(box);
            projectContainer.appendChild(item);
        });
    }

    function saveToLocal() {
        localStorage.setItem('portfolio_projects', JSON.stringify(projects));
        localStorage.setItem('about_file', JSON.stringify(aboutFile));
        console.log('Progress Saved Successfully');
    }

    // --- 5. 슬라이더 포커스/드래그/화살표 ---
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    if (nextBtn) nextBtn.onclick = () => { projectContainer.scrollLeft += 650; };
    if (prevBtn) prevBtn.onclick = () => { projectContainer.scrollLeft -= 650; };

    function updateSliderFocus() {
        const items = document.querySelectorAll('.project-item');
        const containerCenter = projectContainer.scrollLeft + (projectContainer.offsetWidth / 2);
        items.forEach(item => {
            const itemCenter = item.offsetLeft + (item.offsetWidth / 2);
            const dist = Math.abs(containerCenter - itemCenter);
            if (dist < 300) item.classList.add('active');
            else item.classList.remove('active');
        });
    }
    projectContainer.addEventListener('scroll', updateSliderFocus);

    // 드래그 기능 제거됨 (화살표 전용 탐색)

    // --- 6. 기타 보조 ---
    function updateEditButtonStates() {
        editModeTriggers.forEach(btn => {
            if (isEditMode) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    editModeTriggers.forEach(trigger => {
        trigger.onclick = () => {
            if (!isLoggedIn) { alert('로그인이 필요합니다.'); return; }
            isEditMode = !isEditMode;
            document.body.classList.toggle('body-editing', isEditMode);
            renderAll();
        };
    });

    if (aboutInput) aboutInput.onchange = (e) => handleFileUpload(e.target.files[0], 'about');
    if (projectInput) projectInput.onchange = (e) => handleFileUpload(e.target.files[0], 'project');

    function handleFileUpload(file, target) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = { name: file.name, type: file.type.includes('pdf') ? 'pdf' : 'image', url: e.target.result };
            if (target === 'about') aboutFile = data;
            else projects[currentProjectIndex] = data;
            saveToLocal();
            renderAll();
        };
        reader.readAsDataURL(file);
    }

    if (clearBtn) clearBtn.onclick = () => { if(confirm('영구 삭제하시겠습니까?')) { localStorage.clear(); location.reload(); } };

    // [최종 철저본] 기존의 모든 자동 로그인 방지 및 리셋
    if (window.Kakao && Kakao.Auth) {
        Kakao.Auth.setAccessToken(null); // 토큰 완전 제거로 자동 로그인 원천 차단
    }

    // 접속 시 무조건 비로그인 상태로 화면 렌더링 (편집, + 버튼 없음)
    isLoggedIn = false;
    updateAuthUI(null);
    renderAll();
});
