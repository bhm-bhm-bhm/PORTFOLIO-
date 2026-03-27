document.addEventListener('DOMContentLoaded', () => {
    const aboutSlot = document.getElementById('about-display-area');
    const aboutInput = document.getElementById('about-file-input');
    const projectContainer = document.getElementById('projects-container');
    const projectInput = document.getElementById('direct-project-file-input');
    const editBtn = document.getElementById('edit-mode-toggle');

    let isEditMode = false;
    let currentProjectIndex = null;
    let projects = JSON.parse(localStorage.getItem('portfolio_projects')) || new Array(6).fill(null);
    let aboutFile = JSON.parse(localStorage.getItem('about_file')) || null;

    // --- 렌더링 함수 ---
    function renderAll() {
        renderAbout();
        renderProjects();
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

            if (isEditMode) {
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
                    // 드래그 중엔 클릭 무시
                    if (isMoved) return;
                    window.open(aboutFile.url, '_blank');
                };
            }
            aboutSlot.appendChild(container);
        } else {
            // + 아이콘 전용 클릭 버튼 생성
            const addBtn = document.createElement('div');
            addBtn.className = 'add-cta-main';
            addBtn.innerHTML = '+';
            addBtn.onclick = (e) => {
                e.stopPropagation();
                aboutInput.click();
            };
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
                    box.innerHTML = `<div class="pdf-thumbnail"><div class="pdf-icon-visual" style="width: 80px; height: 110px; font-size: 1.5rem;">PDF</div><p class="pdf-name" style="font-size: 1.2rem;">${proj.name}</p></div>`;
                } else {
                    box.innerHTML = `<img src="${proj.url}" class="thumbnail-img">`;
                }
                
                if (isEditMode) {
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
                    // 드래그 충돌 방지 처리
                    box.addEventListener('click', (e) => {
                        if (isMoved) return;
                        window.open(proj.url, '_blank');
                    });
                }
            } else {
                // + 아이콘 클릭 시에만 프로젝트 추가 발동 (범위 축소)
                const addBtn = document.createElement('div');
                addBtn.className = 'add-cta-main';
                addBtn.innerHTML = '+';
                addBtn.style.width = '100px'; // 클릭 범위 제한
                addBtn.style.height = '100px';
                addBtn.style.borderRadius = '50%';
                addBtn.style.display = 'flex';
                addBtn.style.justifyContent = 'center';
                addBtn.style.alignItems = 'center';

                addBtn.onclick = (e) => {
                    e.stopPropagation();
                    currentProjectIndex = i;
                    projectInput.click();
                };
                
                box.style.display = 'flex';
                box.style.justifyContent = 'center';
                box.style.alignItems = 'center';
                box.appendChild(addBtn);
            }
            
            item.appendChild(box);
            projectContainer.appendChild(item);
        });
    }

    // --- 마우스 드래그 스크롤 기능 (자연스러운 필터 추가) ---
    let isDown = false;
    let startX;
    let scrollLeft;
    let isMoved = false; // 드래그 여부 확인 플래그

    projectContainer.addEventListener('mousedown', (e) => {
        isDown = true;
        isMoved = false;
        projectContainer.classList.add('active');
        startX = e.pageX - projectContainer.offsetLeft;
        scrollLeft = projectContainer.scrollLeft;
        projectContainer.style.scrollBehavior = 'auto';
    });

    projectContainer.addEventListener('mouseleave', () => {
        isDown = false;
    });

    projectContainer.addEventListener('mouseup', (e) => {
        isDown = false;
        projectContainer.style.scrollBehavior = 'smooth';
        // 클릭 이벤트를 위해 약간의 지연 후 플래그 해제 (선택 사항)
        setTimeout(() => {
            // 마우스 업 시점에 드래그 상태를 마무리함
        }, 10);
    });

    projectContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const x = e.pageX - projectContainer.offsetLeft;
        const dist = Math.abs(x - startX);
        
        // 미세한 움직임이 아닌 일정 거리 이상 움직이면 '드래그'로 간주
        if (dist > 5) {
            isMoved = true;
            e.preventDefault();
            const walk = (x - startX) * 2;
            projectContainer.scrollLeft = scrollLeft - walk;
        }
    });

    // --- 이벤트 리스너 ---
    editBtn.onclick = () => {
        isEditMode = !isEditMode;
        document.body.classList.toggle('body-editing', isEditMode);
        editBtn.classList.toggle('active', isEditMode);
        renderAll();
    };

    aboutInput.onchange = (e) => handleFileUpload(e.target.files[0], 'about');
    projectInput.onchange = (e) => handleFileUpload(e.target.files[0], 'project');

    function handleFileUpload(file, target) {
        if (!file) return;
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
            if(confirm('모든 데이터를 초기화하시겠습니까?')) {
                localStorage.clear();
                projects = new Array(6).fill(null);
                aboutFile = null;
                renderAll();
                location.reload();
            }
        };
    }

    renderAll();
});
