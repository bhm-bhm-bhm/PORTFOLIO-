document.addEventListener('DOMContentLoaded', () => {
    const projectsContainer = document.getElementById('projects-container');
    const modal = document.getElementById('project-modal');
    const closeModal = document.querySelector('.close-btn');
    const addProjectForm = document.getElementById('add-project-form');
    let currentSlotIndex = null;

    // Load projects from localStorage
    let projects = JSON.parse(localStorage.getItem('portfolio_projects')) || new Array(6).fill(null);

    // Initial render
    renderProjects();

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
                // Filled project
                box.innerHTML = `<h3>${project.title}</h3>`;
                box.title = `${project.type.toUpperCase()} 열람하기`;
                box.onclick = () => {
                    window.open(project.url, '_blank');
                };
                
                // Add a small "delete" or "edit" button could be useful, 
                // but let's stick to the requested "save/never reset" requirement.
                // We can add a long-press or a small corner 'x' later if needed.
            } else {
                // Empty project -> CTA
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
        document.getElementById('project-title').focus();
    }

    closeModal.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    addProjectForm.onsubmit = (e) => {
        e.preventDefault();
        
        const title = document.getElementById('project-title').value;
        const type = document.querySelector('input[name="project-type"]:checked').value;
        const url = document.getElementById('project-url').value;
        
        projects[currentSlotIndex] = { title, type, url };
        
        // Save to localStorage
        localStorage.setItem('portfolio_projects', JSON.stringify(projects));
        
        modal.style.display = 'none';
        renderProjects();
    };

    // For development: Reset functionality
    const clearBtn = document.getElementById('clear-storage');
    if (clearBtn) {
        clearBtn.onclick = () => {
            localStorage.removeItem('portfolio_projects');
            projects = new Array(6).fill(null);
            renderProjects();
            modal.style.display = 'none';
        };
    }
});
