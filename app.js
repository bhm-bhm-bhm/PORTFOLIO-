// app.js - 정밀 복구 버전 (JS Crash 방지 및 모든 기능 상시 활성화)

document.addEventListener('DOMContentLoaded', () => {
    // 0. 필수 요소 확인 및 초기화
    const aboutSlot = document.getElementById('about-display-area');
    const aboutInput = document.getElementById('about-file-input');
    const projectContainer = document.getElementById('projects-container');
    const projectInput = document.getElementById('direct-project-file-input');
    const editModeTriggers = document.querySelectorAll('.edit-mode-trigger');
    const clearBtn = document.getElementById('clear-storage');

    let isEditMode = false;
    let isLoggedIn = false;
    let currentProjectIndex = null;
    let projects = JSON.parse(localStorage.getItem('portfolio_projects')) || new Array(6).fill(null);
    let aboutFile = JSON.parse(localStorage.getItem('about_file')) || null;

    // 1. 카카오 SDK 안전 초기화
    const KAKAO_KEY = '84bc6e0cb6d58fc4fca663bb14964778';
    try {
        if (window.Kakao && !Kakao.isInitialized()) {
            Kakao.init(KAKAO_KEY);
            console.log('Kakao SDK Initialized');
        }
    } catch (e) {
        console.warn('Kakao SDK Initialization Skipped:', e);
    }

    // 2. 카카오 로그인/로그아웃 함수 (안전 모드)
    window.loginWithKakao = function() {
        if (!window.Kakao || !Kakao.Auth) {
            alert('카카오 SDK 로딩 중입니다. 잠시만 기다려주세요.');
            return;
        }
        Kakao.Auth.login({
            success: fetchUserInfo,
            fail: (err) => { console.error(err); alert('로그인 실패'); }
        });
    };

    window.logoutWithKakao = function() {
        try {
            if (Kakao.Auth.getAccessToken()) {
                Kakao.Auth.logout(() => {
                    isLoggedIn = false;
                    updateAuthUI(null);
                    renderAll();
                });
            }
        } catch (e) { console.error(e); }
    };

    function fetchUserInfo() {
        try {
            Kakao.API.request({
                url: '/v2/user/me',
                success: (res) => {
                    isLoggedIn = true;
                    updateAuthUI(res);
                    renderAll();
                },
                fail: (err) => console.error(err)
            });
        } catch (e) { console.error(e); }
    }

    function updateAuthUI(user) {
        const loggedOutView = document.getElementById('logged-out-view');
        const loggedInView = document.getElementById('logged-in-view');
        if (user && loggedOutView && loggedInView) {
            loggedOutView.style.display = 'none';
            loggedInView.style.display = 'flex';
            document.getElementById('user-nickname').innerText = user.properties.nickname;
            document.getElementById('user-avatar').src = user.properties.thumbnail_image || '';
        } else if (loggedOutView && loggedInView) {
            loggedOutView.style.display = 'block';
            loggedInView.style.display = 'none';
        }
    }

    // 3. 렌더링 함수 (상시 노출)
    function renderAll() {
        if (aboutSlot) renderAbout();
        if (projectContainer) renderProjects();
        updateEditButtonStates();
    }

    function renderAbout() {
        aboutSlot.innerHTML = '';
        if (aboutFile) {
            const container = document.createElement('div');
            container.className = 'thumbnail-wrapper';
            container.style.height = '100%';
            
            if (aboutFile.type === 'pdf') {
                container.innerHTML = `<div class="pdf-thumbnail"><div class="pdf-icon-visual">PDF</div><p class="pdf-name">${aboutFile.name}</p></div>`;
            } else {
                container.innerHTML = `<img src="${aboutFile.url}" class="thumbnail-img">`;
            }

            if (isEditMode) {
                const del = document.createElement('button');
                del.className = 'delete-btn';
                del.innerHTML = '&times;';
                del.onclick = (e) => { 
                    e.stopPropagation(); 
                    if(confirm('파일을 삭제하시겠습니까?')) {
                        aboutFile = null; localStorage.removeItem('about_file'); renderAbout(); 
                    }
                };
                aboutSlot.appendChild(del);
            } else {
                container.onclick = () => { if (!isMoved) window.open(aboutFile.url, '_blank'); };
            }
            aboutSlot.appendChild(container);
        } else {
            const addBtn = document.createElement('div');
            addBtn.className = 'add-cta-main';
            addBtn.innerHTML = '+';
            addBtn.onclick = (e) => { e.stopPropagation(); aboutInput.click(); };
            aboutSlot.appendChild(addBtn);
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
                if (proj.type === 'pdf') {
                    box.innerHTML = `<div class="pdf-thumbnail"><div class="pdf-icon-visual" style="width: 80px; height: 110px;">PDF</div><p class="pdf-name">${proj.name}</p></div>`;
                } else {
                    box.innerHTML = `<img src="${proj.url}" class="thumbnail-img">`;
                }
                
                if (isEditMode) {
                    const del = document.createElement('button');
                    del.className = 'delete-btn';
                    del.innerHTML = '&times;';
                    del.onclick = (e) => { 
                        e.stopPropagation(); 
                        if(confirm(`프로젝트 ${i+1} 삭제?`)) {
                            projects[i] = null; saveProjects(); renderProjects(); 
                        }
                    };
                    item.appendChild(del);
                } else {
                    box.onclick = () => { if (!isMoved) window.open(proj.url, '_blank'); };
                }
            } else {
                const addBtn = document.createElement('div');
                addBtn.className = 'add-cta-main';
                addBtn.innerHTML = '+';
                addBtn.style.transform = 'scale(0.8)';
                addBtn.onclick = (e) => { e.stopPropagation(); currentProjectIndex = i; projectInput.click(); };
                box.style.display = 'flex'; box.style.justifyContent = 'center'; box.style.alignItems = 'center';
                box.appendChild(addBtn);
            }
            item.appendChild(box);
            projectContainer.appendChild(item);
        });
    }

    function updateEditButtonStates() {
        editModeTriggers.forEach(btn => {
            if (isEditMode) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    editModeTriggers.forEach(trigger => {
        trigger.onclick = () => {
            isEditMode = !isEditMode;
            document.body.classList.toggle('body-editing', isEditMode);
            renderAll();
        };
    });

    // 4. 슬라이더 포커스 및 드래그 로직
    function updateSliderFocus() {
        const items = document.querySelectorAll('.project-item');
        const containerCenter = projectContainer.scrollLeft + (projectContainer.offsetWidth / 2);

        items.forEach(item => {
            const itemCenter = item.offsetLeft + (item.offsetWidth / 2);
            const dist = Math.abs(containerCenter - itemCenter);
            
            // 중앙에서 300px 이내면 활성화
            if (dist < 300) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    projectContainer.addEventListener('scroll', updateSliderFocus);

    let isDown = false, startX, scrollLeft, isMoved = false;
    projectContainer.addEventListener('mousedown', (e) => {
        isDown = true; isMoved = false;
        startX = e.pageX - projectContainer.offsetLeft;
        scrollLeft = projectContainer.scrollLeft;
        projectContainer.style.scrollBehavior = 'auto';
    });
    projectContainer.addEventListener('mouseleave', () => { isDown = false; });
    projectContainer.addEventListener('mouseup', () => { isDown = false; projectContainer.style.scrollBehavior = 'smooth'; });
    projectContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const x = e.pageX - projectContainer.offsetLeft;
        const dist = Math.abs(x - startX);
        if (dist > 5) {
            isMoved = true;
            e.preventDefault();
            projectContainer.scrollLeft = scrollLeft - (x - startX) * 2;
        }
    });

    // 5. 파일 핸들링
    if (aboutInput) aboutInput.onchange = (e) => handleFileUpload(e.target.files[0], 'about');
    if (projectInput) projectInput.onchange = (e) => handleFileUpload(e.target.files[0], 'project');

    function handleFileUpload(file, target) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = { name: file.name, type: file.type.includes('pdf') ? 'pdf' : 'image', url: e.target.result };
            if (target === 'about') { aboutFile = data; localStorage.setItem('about_file', JSON.stringify(data)); }
            else { projects[currentProjectIndex] = data; saveProjects(); }
            renderAll();
            // 렌더링 후 포커스 재계산
            setTimeout(updateSliderFocus, 100);
        };
        reader.readAsDataURL(file);
    }

    function saveProjects() { localStorage.setItem('portfolio_projects', JSON.stringify(projects)); }

    if (clearBtn) {
        clearBtn.onclick = () => { if(confirm('모든 데이터를 초기화?')) { localStorage.clear(); location.reload(); } };
    }

    // 6. 안전 실행 (초기 렌더링 먼저 수행)
    renderAll();
    setTimeout(updateSliderFocus, 300); // 초기 포커스 설정
    
    // 카카오 상태 체크는 나중에 따로 (충돌 방지)
    setTimeout(() => {
        try {
            if (window.Kakao && Kakao.Auth && Kakao.Auth.getAccessToken()) {
                fetchUserInfo();
            }
        } catch (e) {
            console.log('Kakao status check failed (normal if not logged in)');
        }
    }, 1000);
});
