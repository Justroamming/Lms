class TeacherNavigation {
    constructor() {
        this.currentPage = 'dashboard';
        this.dataService = new DataService('https://localhost:7231');
        
        // Đảm bảo DOM đã tải xong trước khi gọi các phương thức hiển thị
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeTeacherNavigation();
                this.displayTeacherName();
            });
        } else {
            this.initializeTeacherNavigation();
            this.displayTeacherName();
        }
    }

    initializeTeacherNavigation() {
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
            const response = await fetch(`components/teacher-${page}-content.html`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const content = await response.text();
            const mainContent = document.querySelector('#pageContent');
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
                new TeacherDashboard();
                // Đảm bảo môn học được hiển thị khi vào dashboard
                setTimeout(() => this.displayTeacherName(), 500);
                break;
            case 'scores':
                new TeacherScores();
                break;
            case 'schedule':
                new TeacherSchedule();
                break;
            case 'profile':
                new TeacherProfile();
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

    // Phương thức để làm mới tất cả các trang
    refreshAllPages() {
        // Tải lại trang hiện tại
        this.loadPage(this.currentPage);
    }

    // Hiển thị tên giáo viên trong header
    async displayTeacherName() {
        const teacher = JSON.parse(sessionStorage.getItem('currentUser'));
        const teacherNameElement = document.getElementById('teacherName');
        
        console.log('Teacher data from sessionStorage:', teacher);
        
        if (teacher && teacherNameElement) {
            // Xóa tất cả nội dung hiện tại trong teacherName để tránh bị lặp
            teacherNameElement.innerHTML = '';
            
            // Tạo phần tử mới cho fullname
            const fullnameElement = document.createElement('span');
            fullnameElement.className = 'teacher-fullname';
            teacherNameElement.appendChild(fullnameElement);
            
            // Tạo phần tử mới cho role
            const roleElement = document.createElement('span');
            roleElement.className = 'teacher-role';
            teacherNameElement.appendChild(roleElement);
            
            // Cập nhật tên giáo viên
            fullnameElement.textContent = `${teacher.lastName} ${teacher.firstName}`;
            
            // Xác định môn học mặc định từ dữ liệu hiện có
            let subjectName = teacher.subjectName || "Unknow";
            
            // Kiểm tra xem có ID giáo viên không
            if (teacher.teacherId) {
                try {
                    console.log('Bắt đầu gọi API lấy danh sách môn học...');
                    console.log('Teacher ID:', teacher.teacherId);
                    
                    // Sử dụng dataService đã được khởi tạo trong constructor
                    const subjectsData = await this.dataService.getTeacherSubjects(teacher.teacherId);
                    console.log('Dữ liệu môn học nhận được:', subjectsData);
                    
                    // Kiểm tra dữ liệu trả về và lấy tên môn học
                    if (subjectsData && Array.isArray(subjectsData) && subjectsData.length > 0) {
                        // Lấy môn học đầu tiên nếu có dữ liệu
                        const subject = subjectsData[0];
                        if (subject && subject.subjectName) {
                            subjectName = subject.subjectName;
                            console.log('Tìm thấy môn học:', subjectName);
                            
                            // Cập nhật thông tin giáo viên trong session storage
                            teacher.subjectName = subjectName;
                            sessionStorage.setItem('currentUser', JSON.stringify(teacher));
                        } else {
                            console.log('Không tìm thấy trường subjectName trong dữ liệu trả về');
                        }
                    } else {
                        console.log('Không có dữ liệu môn học hoặc dữ liệu không đúng định dạng');
                    }
                } catch (error) {
                    console.error('Lỗi khi lấy thông tin môn học:', error);
                }
            }
            
            // Hiển thị vai trò và môn học (dù có lỗi hay không)
            roleElement.textContent = `${subjectName} Teacher`;
        } else {
            console.error('Không tìm thấy thông tin giáo viên hoặc phần tử DOM');
        }
    }
}


