class Navigation {
    constructor() {
        this.currentPage = 'dashboard';
        this.initializeNavigation();
        this.initializeMobileMenu();
        this.displayStudentName();
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

    initializeMobileMenu() {
        // Thêm sidebar overlay nếu chưa có
        if (!document.getElementById('sidebarOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'sidebarOverlay';
            overlay.className = 'sidebar-overlay';
            document.querySelector('.dashboard-container').prepend(overlay);
        }

        // Xử lý menu trên thiết bị di động
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (menuToggle && sidebar && sidebarOverlay) {
            // Hàm mở/đóng sidebar
            const toggleSidebar = () => {
                sidebar.classList.toggle('active');
                sidebarOverlay.classList.toggle('active');
                
                // Không thay đổi layout khi hiển thị trên mobile
                // Giữ nguyên hiển thị dạng danh sách dọc
            };
            
            // Sự kiện click vào nút menu
            menuToggle.addEventListener('click', toggleSidebar);
            
            // Sự kiện click vào overlay để đóng sidebar
            sidebarOverlay.addEventListener('click', toggleSidebar);
            
            // Sự kiện click vào các mục menu trên thiết bị di động
            const menuItems = sidebar.querySelectorAll('li a');
            menuItems.forEach(item => {
                item.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        toggleSidebar();
                    }
                });
            });
            
            // Xử lý responsive khi thay đổi kích thước màn hình
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    sidebar.classList.remove('active');
                    sidebarOverlay.classList.remove('active');
                }
            });
        }
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

    // Hiển thị tên học sinh trong header
    displayStudentName() {
        const student = JSON.parse(sessionStorage.getItem('currentUser'));
        const studentNameElement = document.getElementById('studentName');
        
        if (student && studentNameElement) {
            const fullnameElement = studentNameElement.querySelector('.student-fullname');
            const roleElement = studentNameElement.querySelector('.student-role');
            
            if (fullnameElement) {
                fullnameElement.textContent = `${student.lastName} ${student.firstName}`;
            }
            
            if (roleElement) {
                // Hiển thị vai trò học sinh và lớp (nếu có)
                const className = student.className || "10A1";
                roleElement.textContent = `Học sinh ${className}`;
            }
        }
    }
}





