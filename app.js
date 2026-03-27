document.addEventListener('DOMContentLoaded', () => {
    const projectsContainer = document.getElementById('projects-container');
    const modal = document.getElementById('project-modal');
    const closeModal = document.querySelector('.close-btn');
    const addProjectForm = document.getElementById('add-project-form');
    const aboutFileInput = document.getElementById('about-file-input');
    const projectFileInput = document.getElementById('project-file-input');
    const projectUrlInput = document.getElementById('project-url');
    const aboutContent = document.getElementById('about-content');
    
    let currentSlotIndex = null;

    // Load state from localStorage
    let projects = JSON.parse(localStorage.getItem('portfolio_projects')) || new Array(6).fill(null);
    let aboutPdf = localStorage.getItem('about_pdf') || null;

    // Initial render
    renderProjects();
    renderAbout();

    // --- About Me Logic ---
    function renderAbout() {
        if (aboutPdf) {
            aboutContent.innerHTML = `
                <div class="uploaded-status">
                    <p class="success-text">나의 소개 PDF가 업로드되었습니다.</p>
                    <button class="view-btn" onclick="window.open('${aboutPdf}', '_blank')">PDF 열기</button>
                    <button class="remove-btn" onclick="removeAboutPdf()">삭제</button>
                </div>
            `;
        } else {
            aboutContent.innerHTML = `<p class="placeholder-text">이곳에 소개 내용을 입력하거나 PDF 파일을 업로드하세요.</p>`;
        }
    }

    window.removeAboutPdf = () => {
        localStorage.removeItem('about_pdf');
        aboutPdf = null;
        renderAbout();
    };

    aboutFileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            if (base64.length > 2 * 1024 * 1024) { // 2MB limit check
                alert('파일 용량이 너무 큽니다. (최대 2MB 권장)');
                return;
            }
            localStorage.setItem('about_pdf', base64);
            aboutPdf = base64;
            renderAbout();
        };
        reader.readAsDataURL(file);
    };

    // --- Projects Logic ---
    function renderProjects() {
        projectsContainer.innerHTML = '';
        projects.forEach((project, index) => {
            const projectItem = document.createElement('div');
            projectItem.className = 'project-item';
            
            const label = document.createElement('div');
            label.className = 'project-label';
            label.textContent = `프로젝트 ${index + 1}`;
            
            const box = document.createElement('div');
            box.className = 'square-box content-box';
            
            if (project) {
                box.innerHTML = `<h3>${project.title}</h3>`;
                box.onclick = () => window.open(project.url, '_blank');
            } else {
                box.classList.add('add-project-cta');
                box.innerHTML = '<span class="add-icon">+</span>';
                box.onclick = () => openModal(index);
            }
            
            projectItem.appendChild(label);
            projectItem.appendChild(box);
            projectsContainer.appendChild(projectItem);
        });
    }

    function openModal(index) {
        currentSlotIndex = index;
        modal.style.display = 'block';
        addProjectForm.reset();
        projectUrlInput.value = '';
        document.getElementById('project-title').focus();
    }

    closeModal.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };

    projectFileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            if (base64.length > 2 * 1024 * 1024) {
                alert('파일 용량이 너무 큽니다. (2MB 이하 권장)');
                return;
            }
            projectUrlInput.value = base64; // Temporarily show base64 in the input
            projectUrlInput.placeholder = "파일이 선택되었습니다.";
        };
        reader.readAsDataURL(file);
    };

    addProjectForm.onsubmit = (e) => {
        e.preventDefault();
        const title = document.getElementById('project-title').value;
        const type = document.querySelector('input[name="project-type"]:checked').value;
        const url = projectUrlInput.value;
        
        projects[currentSlotIndex] = { title, type, url };
        localStorage.setItem('portfolio_projects', JSON.stringify(projects));
        modal.style.display = 'none';
        renderProjects();
    };

    const clearBtn = document.getElementById('clear-storage');
    if (clearBtn) {
        clearBtn.onclick = () => {
            if(confirm('모든 데이터가 초기화됩니다. 계속하시겠습니까?')) {
                localStorage.clear();
                projects = new Array(6).fill(null);
                aboutPdf = null;
                renderProjects();
                renderAbout();
                modal.style.display = 'none';
            }
        };
    }
});
