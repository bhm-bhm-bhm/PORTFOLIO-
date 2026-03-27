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
            // 파일이 있을 때: 썸네일 표시
            const container = document.createElement('div');
            container.className = 'thumbnail-wrapper';
            container.style.height = '100%';
            
            if (aboutFile.type === 'pdf') {
                container.innerHTML = `<div class="pdf-thumbnail"><div class="pdf-icon-visual">PDF</div><p>${aboutFile.name}</p></div>`;
            } else {
                container.innerHTML = `<img src="${aboutFile.url}" class="thumbnail-img">`;
            }

            // 편집 모드 삭제 버튼
            if (isEditMode) {
                const del = document.createElement('button');
                del.className = 'delete-btn';
                del.innerHTML = '&times;';
                del.onclick = () => { aboutFile = null; localStorage.removeItem('about_file'); renderAbout(); };
                aboutSlot.appendChild(del);
            } else {
                container.onclick = () => window.open(aboutFile.url, '_blank');
            }
            aboutSlot.appendChild(container);
        } else {
            // 파일이 없을 때: + 버튼
            aboutSlot.innerHTML = `<div class="add-cta-main" onclick="document.getElementById('about-file-input').click()">+</div>`;
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
                box.innerHTML = proj.type === 'pdf' ? 
                    `<div class="pdf-thumbnail"><div class="pdf-icon-visual">PDF</div><p>${proj.name}</p></div>` : 
                    `<img src="${proj.url}" class="thumbnail-img">`;
                
                if (isEditMode) {
                    const del = document.createElement('button');
                    del.className = 'delete-btn';
                    del.innerHTML = '&times;';
                    del.onclick = () => { projects[i] = null; saveProjects(); renderProjects(); };
                    item.appendChild(del);
                } else {
                    box.onclick = () => window.open(proj.url, '_blank');
                }
            } else {
                box.innerHTML = `<div class="add-cta-main">+</div>`;
                box.onclick = () => { currentProjectIndex = i; projectInput.click(); };
            }
            
            item.appendChild(box);
            projectContainer.appendChild(item);
        });
    }

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

    renderAll();
});
