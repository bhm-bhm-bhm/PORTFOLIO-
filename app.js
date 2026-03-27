// Kakao SDK 초기화
const KAKAO_KEY = '84bc6e0cb6d58fc4fca663bb14964778';
if (window.Kakao && !Kakao.isInitialized()) {
    Kakao.init(KAKAO_KEY);
    console.log('Kakao initialized:', Kakao.isInitialized());
}

document.addEventListener('DOMContentLoaded', () => {
    const aboutSlot = document.getElementById('about-display-area');
    const aboutInput = document.getElementById('about-file-input');
    const projectContainer = document.getElementById('projects-container');
    const projectInput = document.getElementById('direct-project-file-input');
    const editModeTriggers = document.querySelectorAll('.edit-mode-trigger');

    let isEditMode = false;
    let isLoggedIn = false;
    let currentProjectIndex = null;
    let projects = JSON.parse(localStorage.getItem('portfolio_projects')) || new Array(6).fill(null);
    let aboutFile = JSON.parse(localStorage.getItem('about_file')) || null;

    // --- 카카오 로그인 기능 ---
    window.loginWithKakao = function() {
        Kakao.Auth.login({
            success: function(authObj) {
                console.log('Login success:', authObj);
                fetchUserInfo();
            },
            fail: function(err) {
                console.error('Login failed:', err);
                alert('로그인에 실패했습니다.');
            }
        });
    };

    window.logoutWithKakao = function() {
        if (!Kakao.Auth.getAccessToken()) return;
        Kakao.Auth.logout(() => {
            console.log('Logout success');
            isLoggedIn = false;
            isEditMode = false;
            document.body.classList.remove('body-editing');
            updateAuthUI(null);
            renderAll();
        });
    };

    function fetchUserInfo() {
        Kakao.API.request({
            url: '/v2/user/me',
            success: function(res) {
                console.log('User info:', res);
                isLoggedIn = true;
                updateAuthUI(res);
                renderAll();
            },
            fail: function(error) {
                console.error('API request failed:', error);
            }
        });
    }

    function checkLoginStatus() {
        if (Kakao.Auth.getAccessToken()) {
            fetchUserInfo();
        } else {
            updateAuthUI(null);
            renderAll();
        }
    }

    function updateAuthUI(user) {
        const loggedOutView = document.getElementById('logged-out-view');
        const loggedInView = document.getElementById('logged-in-view');
        const authOnlyItems = document.querySelectorAll('.auth-only-ui');

        if (user && isLoggedIn) {
            loggedOutView.style.display = 'none';
            loggedInView.style.display = 'flex';
            document.getElementById('user-nickname').innerText = user.properties.nickname;
            document.getElementById('user-avatar').src = user.properties.thumbnail_image || '';
            
            // 관리자 전용 UI 노출 (편집 버튼, 초기화 버튼 등)
            authOnlyItems.forEach(el => el.style.display = 'flex');
        } else {
            loggedOutView.style.display = 'block';
            loggedInView.style.display = 'none';
            authOnlyItems.forEach(el => el.style.display = 'none');
        }
    }

    // --- 렌더링 함수 ---
    function renderAll() {
        renderAbout();
        renderProjects();
        updateEditButtonStates();
    }

    function renderAbout() {
        aboutSlot.innerHTML = '';
        if (aboutFile) {
            const container = document.createElement('div');
            container.className = 'thumbnail-wrapper';
            container.style.height = '100%';
            
            if (aboutFile.type === 'pdf') {
                container.innerHTML = `<div class="pdf-thumbnail"><div class="pdf-icon-visual">PDF</div><p class="pdf-name" style="font-size: 1.5rem; margin-top: 10px;">${aboutFile.name}</p></div>`;
            } else {
                container.innerHTML = `<img src="${aboutFile.url}" class="thumbnail-img">`;
            }

            if (isEditMode && isLoggedIn) {
                const del = document.createElement('button');
                del.className = 'delete-btn';
                del.innerHTML = '&times;';
                del.onclick = (e) => { 
                    e.stopPropagation(); 
                    if(confirm('소개 파일을 삭제하시겠습니까?')) {
                        aboutFile = null; localStorage.removeItem('about_file'); renderAbout(); 
                    }
                };
                aboutSlot.appendChild(del);
            } else {
                container.onclick = (e) => {
                    if (isMoved) return;
                    window.open(aboutFile.url, '_blank');
                };
            }
            aboutSlot.appendChild(container);
        } else {
            // 로그인 상태에서만 + 버튼 노출
            if (isLoggedIn) {
                const addBtn = document.createElement('div');
                addBtn.className = 'add-cta-main';
                addBtn.innerHTML = '+';
                addBtn.onclick = (e) => { e.stopPropagation(); aboutInput.click(); };
                aboutSlot.appendChild(addBtn);
            } else {
                aboutSlot.innerHTML = `<p style="opacity: 0.3; font-size: 0.9rem; letter-spacing: 2px;">INTRODUCTION LOCKED</p>`;
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
                if (proj.type === 'pdf') {
                    box.innerHTML = `<div class="pdf-thumbnail"><div class="pdf-icon-visual" style="width: 80px; height: 110px; font-size: 1.5rem;">PDF</div><p class="pdf-name" style="font-size: 1.2rem;">${proj.name}</p></div>`;
                } else {
                    box.innerHTML = `<img src="${proj.url}" class="thumbnail-img">`;
                }
                
                if (isEditMode && isLoggedIn) {
                    const del = document.createElement('button');
                    del.className = 'delete-btn';
                    del.innerHTML = '&times;';
                    del.onclick = (e) => { 
                        e.stopPropagation(); 
                        if(confirm(`프로젝트 ${i+1}을(를) 삭제하시겠습니까?`)) {
                            projects[i] = null; saveProjects(); renderProjects(); 
                        }
                    };
                    item.appendChild(del);
                } else {
                    box.addEventListener('click', (e) => {
                        if (isMoved) return;
                        window.open(proj.url, '_blank');
                    });
                }
            } else {
                // 로그인 상태에서만 + 버튼 노출
                if (isLoggedIn) {
                    const addBtn = document.createElement('div');
                    addBtn.className = 'add-cta-main';
                    addBtn.innerHTML = '+';
                    addBtn.onclick = (e) => {
                        e.stopPropagation();
                        currentProjectIndex = i;
                        projectInput.click();
                    };
                    box.style.display = 'flex';
                    box.style.justifyContent = 'center';
                    box.style.alignItems = 'center';
                    box.appendChild(addBtn);
                } else {
                    box.innerHTML = `<p style="opacity: 0.1; font-size: 0.8rem; letter-spacing: 2px;">EMPTY SLOT</p>`;
                    box.style.display = 'flex';
                    box.style.justifyContent = 'center';
                    box.style.alignItems = 'center';
                }
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
            if (!isLoggedIn) return;
            isEditMode = !isEditMode;
            document.body.classList.toggle('body-editing', isEditMode);
            renderAll();
        };
    });

    // --- 마우스 드래그 스크롤 기능 ---
    let isDown = false;
    let startX;
    let scrollLeft;
    let isMoved = false;

    projectContainer.addEventListener('mousedown', (e) => {
        isDown = true;
        isMoved = false;
        projectContainer.classList.add('active');
        startX = e.pageX - projectContainer.offsetLeft;
        scrollLeft = projectContainer.scrollLeft;
        projectContainer.style.scrollBehavior = 'auto';
    });

    projectContainer.addEventListener('mouseleave', () => { isDown = false; });
    projectContainer.addEventListener('mouseup', () => {
        isDown = false;
        projectContainer.style.scrollBehavior = 'smooth';
    });

    projectContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const x = e.pageX - projectContainer.offsetLeft;
        const dist = Math.abs(x - startX);
        if (dist > 5) {
            isMoved = true;
            e.preventDefault();
            const walk = (x - startX) * 2;
            projectContainer.scrollLeft = scrollLeft - walk;
        }
    });

    aboutInput.onchange = (e) => handleFileUpload(e.target.files[0], 'about');
    projectInput.onchange = (e) => handleFileUpload(e.target.files[0], 'project');

    function handleFileUpload(file, target) {
        if (!file || !isLoggedIn) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = { name: file.name, type: file.type.includes('pdf') ? 'pdf' : 'image', url: e.target.result };
            if (target === 'about') {
                aboutFile = data;
                localStorage.setItem('about_file', JSON.stringify(data));
            } else {
                projects[currentProjectIndex] = data;
                saveProjects();
            }
            renderAll();
        };
        reader.readAsDataURL(file);
    }

    function saveProjects() { localStorage.setItem('portfolio_projects', JSON.stringify(projects)); }

    const clearBtn = document.getElementById('clear-storage');
    if (clearBtn) {
        clearBtn.onclick = () => {
            if(!isLoggedIn) return;
            if(confirm('모든 데이터를 초기화하시겠습니까?')) {
                localStorage.clear();
                projects = new Array(6).fill(null);
                aboutFile = null;
                renderAll();
                location.reload();
            }
        };
    }

    // 초기 실행
    checkLoginStatus();
});
