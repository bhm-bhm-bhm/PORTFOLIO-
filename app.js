document.addEventListener('DOMContentLoaded', () => {
    const projectsContainer = document.getElementById('projects-container');
    const aboutFileInput = document.getElementById('about-file-input');
    const directProjectFileInput = document.getElementById('direct-project-file-input');
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
                    <!-- PDF Icon via CSS -->
                </div>
                <div class="about-info-text">
                    <p class="success-text">나의 소개 PDF</p>
                    <button class="glass-btn" style="padding: 0.5rem 1.5rem; margin-top: 10px;" onclick="window.open('${aboutPdf}', '_blank')">열기</button>
                    <button class="reset-link" style="margin-left: 10px;" onclick="removeAboutPdf()">삭제</button>
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
            if (base64.length > 3 * 1024 * 1024) {
                alert('파일 용량이 너무 큽니다. (최대 3MB 권장)');
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
            label.textContent = `PROJECT ${String(index + 1).padStart(2, '0')}`;
            
            const box = document.createElement('div');
            box.className = 'square-box glass-card';
            
            if (project) {
                // If PDF, show glass thumbnail
                if (project.type === 'pdf') {
                    box.innerHTML = `
                        <div class="pdf-thumbnail">
                            <div class="pdf-icon">PDF DOCUMENT</div>
                            <div class="pdf-name">${project.title}</div>
                        </div>
                    `;
                } else if (project.type === 'image') {
                    box.innerHTML = `<img src="${project.url}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;" />`;
                }
                box.onclick = () => window.open(project.url, '_blank');
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
            if(confirm('모든 데이터를 초기화하시겠습니까?')) {
                localStorage.clear();
                projects = new Array(6).fill(null);
                aboutPdf = null;
                renderProjects();
                renderAbout();
            }
        };
    }
});
