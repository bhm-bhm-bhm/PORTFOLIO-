document.addEventListener('DOMContentLoaded', () => {
    const projectsContainer = document.getElementById('projects-container');
    const aboutFileInput = document.getElementById('about-file-input');
    const directProjectFileInput = document.getElementById('direct-project-file-input');
    const aboutSlotContainer = document.getElementById('about-slot-container');
    const aboutDisplayArea = document.getElementById('about-display-area');
    const editModeToggle = document.getElementById('edit-mode-toggle');
    
    let currentSlotIndex = null;
    let isEditMode = false;

    // Load state from localStorage
    let projects = JSON.parse(localStorage.getItem('portfolio_projects')) || new Array(6).fill(null);
    let aboutFile = JSON.parse(localStorage.getItem('about_file')) || null;

    // Initial render
    renderProjects();
    renderAbout();

    // --- Edit Mode Toggle Logic ---
    editModeToggle.onclick = () => {
        isEditMode = !isEditMode;
        document.body.classList.toggle('body-editing', isEditMode);
        editModeToggle.classList.toggle('active', isEditMode);
        renderAbout();
        renderProjects();
    };

    // --- About Me Logic ---
    function renderAbout() {
        aboutDisplayArea.innerHTML = '';
        
        if (aboutFile) {
            if (aboutFile.type.includes('pdf')) {
                aboutDisplayArea.innerHTML = `
                    <div class="pdf-thumbnail" style="height: 100%;">
                        <div class="pdf-icon-visual">PDF</div>
                        <div class="pdf-name">${aboutFile.name || '나의 소개 PDF'}</div>
                    </div>
                `;
            } else {
                aboutDisplayArea.innerHTML = `<img src="${aboutFile.url}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;" />`;
            }
            
            if (!isEditMode) {
                aboutSlotContainer.onclick = () => window.open(aboutFile.url, '_blank');
                aboutSlotContainer.classList.remove('add-project-cta');
            } else {
                aboutSlotContainer.onclick = () => aboutFileInput.click();
                aboutSlotContainer.classList.add('add-project-cta');
            }
        } else {
            aboutDisplayArea.innerHTML = '<span class="add-icon">+</span><p class="placeholder-text" style="color: rgba(255,255,255,0.2); margin-top: 10px;">나의 소개 추가 (PDF/이미지)</p>';
            aboutSlotContainer.classList.add('add-project-cta');
            aboutSlotContainer.onclick = () => aboutFileInput.click();
        }
    }

    aboutFileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            if (base64.length > 4 * 1024 * 1024) {
                alert('파일 용량이 너무 큽니다. (최대 4MB)');
                return;
            }
            const fileData = { url: base64, type: file.type, name: file.name };
            localStorage.setItem('about_file', JSON.stringify(fileData));
            aboutFile = fileData;
            renderAbout();
        };
        reader.readAsDataURL(file);
    };

    // --- Projects Logic (Direct Interaction) ---
    function renderProjects() {
        projectsContainer.innerHTML = '';
        projects.forEach((project, index) => {
            const projectItem = document.createElement('div');
            projectItem.className = 'project-item';
            
            const label = document.createElement('div');
            label.className = 'project-label';
            label.textContent = `PROJECT ${index + 1}`;
            
            const box = document.createElement('div');
            box.className = 'square-box glass-card';
            
            if (project) {
                if (isEditMode) {
                    const delBtn = document.createElement('button');
                    delBtn.className = 'delete-overlay-btn';
                    delBtn.innerHTML = '&times;';
                    delBtn.title = '프로젝트 삭제';
                    delBtn.onclick = (e) => { e.stopPropagation(); removeProject(index); };
                    projectItem.appendChild(delBtn);
                }

                if (project.type === 'pdf') {
                    box.innerHTML = `
                        <div class="pdf-thumbnail">
                            <div class="pdf-icon-visual">PDF</div>
                            <div class="pdf-name">${project.title}</div>
                        </div>
                    `;
                } else {
                    box.innerHTML = `<img src="${project.url}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;" />`;
                }
                
                if (!isEditMode) {
                    box.onclick = () => window.open(project.url, '_blank');
                    box.classList.remove('add-project-cta');
                } else {
                    box.onclick = () => { currentSlotIndex = index; directProjectFileInput.click(); };
                    box.classList.add('add-project-cta');
                }

            } else {
                box.classList.add('add-project-cta');
                box.innerHTML = '<span class="add-icon">+</span>';
                box.onclick = () => {
                    currentSlotIndex = index;
                    directProjectFileInput.click();
                };
            }
            
            projectItem.appendChild(label);
            projectItem.appendChild(box);
            projectsContainer.appendChild(projectItem);
        });
    }

    function removeProject(index) {
        if (confirm(`프로젝트 ${index + 1}을(를) 삭제하시겠습니까?`)) {
            projects[index] = null;
            localStorage.setItem('portfolio_projects', JSON.stringify(projects));
            renderProjects();
        }
    }

    directProjectFileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            if (base64.length > 4 * 1024 * 1024) {
                alert('용량이 너무 큽니다. (4MB 이하 권장)');
                return;
            }
            const type = file.type.includes('pdf') ? 'pdf' : 'image';
            const title = file.name;
            projects[currentSlotIndex] = { title, type, url: base64 };
            localStorage.setItem('portfolio_projects', JSON.stringify(projects));
            renderProjects();
        };
        reader.readAsDataURL(file);
    };

    const clearBtn = document.getElementById('clear-storage');
    if (clearBtn) {
        clearBtn.onclick = () => {
            if(confirm('모든 데이터를 초기화하시겠습니까?')) {
                localStorage.clear();
                projects = new Array(6).fill(null);
                aboutFile = null;
                renderProjects();
                renderAbout();
                location.reload();
            }
        };
    }
});
