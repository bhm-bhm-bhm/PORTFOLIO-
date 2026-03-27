document.addEventListener('DOMContentLoaded', () => {
    const projectsContainer = document.getElementById('projects-container');
    const aboutFileInput = document.getElementById('about-file-input');
    const directProjectFileInput = document.getElementById('direct-project-file-input');
    const aboutContent = document.getElementById('about-content');
    const editModeToggle = document.getElementById('edit-mode-toggle');
    const aboutUploadBtn = document.getElementById('about-upload-btn');
    
    let currentSlotIndex = null;
    let isEditMode = false;

    // Load state from localStorage
    let projects = JSON.parse(localStorage.getItem('portfolio_projects')) || new Array(6).fill(null);
    let aboutPdf = localStorage.getItem('about_pdf') || null;

    // Initial render
    renderProjects();
    renderAbout();

    // --- Edit Mode Toggle Logic ---
    editModeToggle.onclick = () => {
        isEditMode = !isEditMode;
        document.body.classList.toggle('body-editing', isEditMode);
        editModeToggle.classList.toggle('active', isEditMode);
        
        // Hide/Show upload button for about based on state or keep it for empty
        renderAbout();
        renderProjects();
    };

    // --- About Me Logic ---
    function renderAbout() {
        if (aboutPdf) {
            aboutContent.innerHTML = `
                <div class="is-editing-indicator">EDIT MODE ACTIVE</div>
                <div class="uploaded-status glass-card" onclick="${!isEditMode ? `window.open('${aboutPdf}', '_blank')` : ''}">
                    <!-- PDF Visual (Styled via CSS) -->
                </div>
                <div class="about-info-text">
                    <p class="success-text">나의 소개 PDF</p>
                    <button class="view-btn" onclick="window.open('${aboutPdf}', '_blank')">열기</button>
                    ${isEditMode ? `<button class="remove-btn" onclick="removeAboutPdf()">삭제</button>` : ''}
                </div>
            `;
            aboutUploadBtn.style.display = isEditMode ? 'block' : 'none';
            aboutUploadBtn.textContent = '소개 PDF 교체';
        } else {
            aboutContent.innerHTML = `<p class="placeholder-text">이곳에 소개 내용을 입력하거나 PDF 파일을 업로드하세요.</p>`;
            aboutUploadBtn.style.display = 'block';
            aboutUploadBtn.textContent = '소개 PDF 업로드';
        }
    }

    window.removeAboutPdf = () => {
        if(confirm('업로드된 소개 PDF를 삭제하시겠습니까?')) {
            localStorage.removeItem('about_pdf');
            aboutPdf = null;
            renderAbout();
        }
    };

    aboutFileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            if (base64.length > 3 * 1024 * 1024) {
                alert('파일 용량이 너무 큽니다. (최대 3MB)');
                return;
            }
            localStorage.setItem('about_pdf', base64);
            aboutPdf = base64;
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
                // Delete button for editing mode
                const delBtn = document.createElement('button');
                delBtn.className = 'delete-overlay-btn';
                delBtn.innerHTML = '&times;';
                delBtn.title = '프로젝트 삭제';
                delBtn.onclick = (e) => {
                    e.stopPropagation();
                    removeProject(index);
                };
                projectItem.appendChild(delBtn);

                if (project.type === 'pdf') {
                    box.innerHTML = `
                        <div class="pdf-thumbnail">
                            <div class="pdf-icon-visual">PDF</div>
                            <div class="pdf-name">${project.title}</div>
                        </div>
                    `;
                } else if (project.type === 'image') {
                    box.innerHTML = `<img src="${project.url}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;" />`;
                }
                
                if (!isEditMode) {
                    box.onclick = () => window.open(project.url, '_blank');
                } else {
                    box.title = "편집 모드에서는 삭제 버튼을 사용해 주세요.";
                }

            } else {
                // Empty -> Direct File Picker
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
            if (base64.length > 3 * 1024 * 1024) {
                alert('용량이 너무 큽니다. (3MB 이하 권장)');
                return;
            }
            
            const type = file.type.includes('pdf') ? 'pdf' : 'image';
            const title = file.name;

            // Save automatically
            projects[currentSlotIndex] = { title, type, url: base64 };
            localStorage.setItem('portfolio_projects', JSON.stringify(projects));
            renderProjects();
        };
        reader.readAsDataURL(file);
    };

    const clearBtn = document.getElementById('clear-storage');
    if (clearBtn) {
        clearBtn.onclick = () => {
            if(confirm('모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                localStorage.clear();
                projects = new Array(6).fill(null);
                aboutPdf = null;
                renderProjects();
                renderAbout();
            }
        };
    }
});
