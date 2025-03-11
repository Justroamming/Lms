class Navigation {
    constructor() {
        this.currentPage = 'dashboard';
        this.initializeNavigation();
    }

    initializeNavigation() {
        document.querySelectorAll('.sidebar a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.getAttribute('href').substring(1);
                this.loadPage(page);
            });
        });

        // Load trang mặc định
        this.loadPage('dashboard');
    }

    async loadPage(page) {
        try {
            console.log('Loading page:', page); // Debug log
            const response = await fetch(`components/student-${page}-content.html`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const content = await response.text();
            const mainContent = document.getElementById('mainContent');
            if (mainContent) {
                mainContent.innerHTML = content;
                this.initializeComponent(page);
                this.updateActiveLink(page);
                this.currentPage = page;
            } else {
                console.error('Main content container not found');
            }
        } catch (error) {
            console.error('Error loading page:', error);
        }
    }

    initializeComponent(page) {
        // Khởi tạo component tương ứng
        switch(page) {
            case 'dashboard':
                new StudentDashboard();
                break;
            case 'scores':
                new StudentScores();
                break;
            case 'schedule':
                new StudentSchedule();
                break;
            case 'profile':
                new StudentProfile();
                break;
        }
    }

    updateActiveLink(page) {
        // Cập nhật trạng thái active cho menu
        document.querySelectorAll('.sidebar li').forEach(li => {
            li.classList.remove('active');
        });
        const activeLink = document.querySelector(`.sidebar a[href="#${page}"]`);
        if (activeLink) {
            activeLink.parentElement.classList.add('active');
        }
    }
}




    
 