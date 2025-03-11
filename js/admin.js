class AdminDashboard {
    constructor() {
        this.currentPage = 'dashboard';
        this.pageContent = document.getElementById('pageContent');
        this.initializeNavigation();
        // Tự động tải trang tổng quan khi khởi tạo
        this.loadPage('dashboard');
        
        // Thêm xử lý cho mobile
        this.isMobile = window.innerWidth <= 768;
        this.setupMobileHandlers();
        
        // Theo dõi thay đổi kích thước màn hình
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
            this.handleResponsiveLayout();
        });

        // Khởi tạo xử lý popup
        this.setupPopupHandlers();
    }

    initializeNavigation() {
        document.querySelectorAll('.sidebar li').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.loadPage(page);
            });
        });
    }

    async loadPage(page) {
        try {
            // Update active state
            document.querySelectorAll('.sidebar li').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.page === page) {
                    item.classList.add('active');
                }
            });

            // Load page content
            const response = await fetch(`components/admin-${page}-content.html`);
            const content = await response.text();
            this.pageContent.innerHTML = content;

            // Initialize page functions
            this.initializePageFunctions(page);
            this.currentPage = page;
            
            // Sau khi tải trang, đóng sidebar nếu đang ở chế độ mobile
            if (this.isMobile) {
                this.closeSidebar();
            }
            
            // Tối ưu hóa bảng cho mobile
            this.optimizeTablesForMobile();
        } catch (error) {
            console.error('Error loading page:', error);
        }
    }

    initializePageFunctions(page) {
        switch(page) {
            case 'dashboard':
                this.initializeDashboard();
                break;
            case 'students':
                this.initializeStudentManagement();
                break;
            case 'teachers':
                this.initializeTeacherManagement();
                break;
            case 'cohorts':
                this.initializeCohortManagement();
                break;
            case 'assignments':
                this.initializeAssignmentManagement();
                break;
        }
    }

    async initializeDashboard() {
        // Hiển thị thống kê hệ thống
        const stats = await this.getSystemStats();
        document.getElementById('totalStudents').textContent = stats.students;
        document.getElementById('totalTeachers').textContent = stats.teachers;
        document.getElementById('totalCohorts').textContent = stats.cohorts;

        // Khởi tạo biểu đồ phân bố học sinh
        await this.initializeStudentDistributionChart();

        // Cập nhật hoạt động gần đây
        await this.updateRecentActivities();

        // Cập nhật thống kê nhanh
        await this.updateQuickStats();
    }

    async initializeStudentDistributionChart() {
        try {
            // Lấy dữ liệu lớp học và số lượng học sinh
            const cohortsResponse = await fetch('https://scoreapi-1zqy.onrender.com/RealAdmins/GetAllCohorts');
            const cohortsData = await cohortsResponse.json();
            const cohorts = cohortsData.data || [];

            // Lấy số lượng học sinh cho mỗi lớp
            const studentCounts = await Promise.all(cohorts.map(async (cohort) => {
                const response = await fetch(`https://scoreapi-1zqy.onrender.com/RealAdmins/GetNumOfStudentsInACohort?id=${cohort.cohortId}`);
                const data = await response.json();
                return data[0]?.numOfStudents || 0;
            }));

            // Chuẩn bị dữ liệu cho biểu đồ
            const ctx = document.getElementById('studentDistributionChart').getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: cohorts.map(cohort => cohort.cohortName),
                    datasets: [{
                        data: studentCounts,
                        backgroundColor: [
                            '#4B91F1',
                            '#FF6B6B',
                            '#4ECDC4',
                            '#45B7D1',
                            '#96CEB4',
                            '#FFEEAD'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
        } catch (error) {
            console.error("Lỗi khi tạo biểu đồ:", error);
        }
    }

    async updateRecentActivities() {
        const activitiesList = document.getElementById('recentActivities');
        if (!activitiesList) return;

        // Mô phỏng các hoạt động gần đây (trong thực tế sẽ lấy từ API)
        const activities = [
            {
                type: 'add',
                icon: 'fas fa-plus',
                text: 'Thêm học sinh mới vào lớp 12A1',
                time: '5 phút trước'
            },
            {
                type: 'edit',
                icon: 'fas fa-edit',
                text: 'Cập nhật thông tin giáo viên Nguyễn Văn A',
                time: '15 phút trước'
            },
            {
                type: 'delete',
                icon: 'fas fa-trash',
                text: 'Xóa lớp học 11B2',
                time: '1 giờ trước'
            }
        ];

        activitiesList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${activity.text}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }

    async updateQuickStats() {
        try {
            // Lấy tất cả học sinh
            const studentsResponse = await fetch('https://scoreapi-1zqy.onrender.com/RealAdmins/GetAllStudents');
            const studentsData = await studentsResponse.json();
            const students = studentsData.data || [];

            // Tính tỷ lệ nam/nữ
            const maleStudents = students.filter(s => s.gender === 'Male').length;
            const femaleStudents = students.filter(s => s.gender === 'Female').length;
            const malePercent = Math.round((maleStudents / students.length) * 100);
            const femalePercent = Math.round((femaleStudents / students.length) * 100);
            document.getElementById('genderRatio').textContent = `${malePercent}% / ${femalePercent}%`;

            // Lấy thông tin về lớp học
            const cohortsResponse = await fetch('https://scoreapi-1zqy.onrender.com/RealAdmins/GetAllCohorts');
            const cohortsData = await cohortsResponse.json();
            const cohorts = cohortsData.data || [];

            // Lấy số lượng học sinh cho mỗi lớp
            const cohortStats = await Promise.all(cohorts.map(async (cohort) => {
                const response = await fetch(`https://scoreapi-1zqy.onrender.com/RealAdmins/GetNumOfStudentsInACohort?id=${cohort.cohortId}`);
                const data = await response.json();
                return {
                    name: cohort.cohortName,
                    count: data[0]?.numOfStudents || 0
                };
            }));

            // Tìm lớp đông nhất và ít nhất
            const sortedCohorts = cohortStats.sort((a, b) => b.count - a.count);
            const largest = sortedCohorts[0];
            const smallest = sortedCohorts[sortedCohorts.length - 1];

            document.getElementById('largestClass').textContent = `${largest.name} (${largest.count} học sinh)`;
            document.getElementById('smallestClass').textContent = `${smallest.name} (${smallest.count} học sinh)`;

        } catch (error) {
            console.error("Lỗi khi cập nhật thống kê nhanh:", error);
        }
    }

    async initializeStudentManagement() {
        await this.loadStudents();
        this.setupStudentEventListeners();
        await this.loadCohortsForSelect();
    }

    async loadCohortsForSelect() {
        const response = await fetch('https://scoreapi-1zqy.onrender.com/RealAdmins/GetAllCohorts');
        const data = await response.json();
        const cohorts = data.data || [];
    
        const select = document.querySelector('select[name="cohortId"]');
        select.innerHTML = cohorts.map(co => 
            `<option value="${co.cohortId}">${co.cohortName} </option>`
        ).join('');
    }
    
    async loadStudents() {
        try {
            const response = await fetch('https://scoreapi-1zqy.onrender.com/RealAdmins/GetAllStudents');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
    
            console.log("API response:", data); 
    
            const students = data.data || []; 
    
            console.log("Parsed students:", students); 
    
            const cohortsResponse = await fetch('https://scoreapi-1zqy.onrender.com/RealAdmins/GetAllCohorts');
            const cohortsData = await cohortsResponse.json();
            const cohorts = cohortsData.data; 
            console.log("API Cohorts Response:", cohorts); 

            if (!Array.isArray(cohorts)) {
               console.error("Lỗi: API không trả về một mảng lớp!");
               return;
            }

            const tbody = document.querySelector('#studentTable tbody');
            tbody.innerHTML = students.map(student => {
                const cohort = cohorts.find(co => co.cohortId === student.cohortId);
                const cohortName = cohort ? cohort.cohortName : 'N/A';
                return`
                <tr>
                
                    <td>${student.firstName}</td>
                    <td>${student.lastName}</td>     
                    <td>${student.email}</td>
                    <td>${student.gender}</td>
                    <td>${student.address}</td>
                    <td>${student.dateOfBirth}</td>
                    <td>${student.phoneNumber}</td>
                    <td>${student.password}</td>
                    <td>${cohort ? cohortName: 'N/A'}</td>
                    <td>
                        <button onclick="adminDashboard.openStudentModal('${student.studentId}')" class="btn-edit" data-id="${student.studentId}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="adminDashboard.deleteStudent('${student.studentId}')" class="btn-delete" data-id="${student.studentId}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `}).join('');
        } catch (error) {
            console.error("Error loading students:", error);
        }
    }
    

    setupStudentEventListeners() {
        document.getElementById('addStudentBtn')?.addEventListener('click', () => {
            this.openStudentModal();
        });

        document.getElementById('studentForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveStudent();
        });
    }

    async openStudentModal(studentId = null) {
        // Đặt tiêu đề modal tùy theo thêm mới hay chỉnh sửa
        const modalTitle = document.querySelector('#studentModal .modal-header h3');
        if (modalTitle) {
            modalTitle.textContent = studentId ? 'Chỉnh sửa học sinh' : 'Thêm học sinh mới';
        }
        
        // Reset form
        const form = document.getElementById('studentForm');
        if (form) {
            form.reset();
            
            // Đặt ID học sinh cho form
            const studentIdField = form.querySelector('[name="studentId"]');
            if (studentIdField) {
                studentIdField.value = studentId || '';
            }
            
            // Đảm bảo tải danh sách lớp học cho select
            await this.loadCohortsForSelect();
            
            // Nếu có ID học sinh, tải thông tin học sinh từ API
            if (studentId) {
                try {
                    // Hiển thị thông báo đang tải
                    this.showNotification('info', 'Đang tải dữ liệu', 'Vui lòng đợi trong giây lát...', null);
                    
                    // Gọi API để lấy thông tin học sinh
                    const response = await fetch(`https://scoreapi-1zqy.onrender.com/RealAdmins/GetStudentById?id=${studentId}`);
                    
                    // Ẩn thông báo đang tải
                    this.hideNotification();
                    
                    if (!response.ok) {
                        throw new Error('Không thể tải thông tin học sinh');
                    }
                    
                    const student = await response.json();
                    console.log('Student data from API:', student);
                    
                    // Điền thông tin học sinh vào form
                    if (student) {
                        // Xử lý các trường hợp khác nhau của API
                        const studentData = student.data || student;
                        
                        // Log dữ liệu để kiểm tra
                        console.log('Student data to fill form:', studentData);
                        
                        try {
                            // Form fields
                            const lastNameField = form.querySelector('[name="lastName"]');
                            const firstNameField = form.querySelector('[name="firstName"]');
                            const emailField = form.querySelector('[name="email"]');
                            const genderField = form.querySelector('[name="gender"]');
                            const addressField = form.querySelector('[name="address"]');
                            const dobField = form.querySelector('[name="dob"]');
                            const phoneField = form.querySelector('[name="phone"]');
                            const passwordField = form.querySelector('[name="password"]');
                            const cohortIdField = form.querySelector('[name="cohortId"]');
                            
                            // Điền dữ liệu vào từng trường nếu trường tồn tại và có dữ liệu
                            if (lastNameField) lastNameField.value = studentData.lastName || studentData.LName || '';
                            if (firstNameField) firstNameField.value = studentData.firstName || studentData.FName || '';
                            if (emailField) emailField.value = studentData.email || '';
                            if (genderField) genderField.value = studentData.gender || 'Male';
                            if (addressField) addressField.value = studentData.address || '';
                            
                            // Xử lý ngày sinh
                            if (dobField && studentData.dob) {
                                let dobValue = studentData.dob;
                                // Cắt thời gian nếu cần thiết
                                if (dobValue.includes('T')) {
                                    dobValue = dobValue.split('T')[0];
                                }
                                dobField.value = dobValue;
                            }
                            
                            if (phoneField) phoneField.value = studentData.phone || '';
                            if (passwordField) passwordField.value = studentData.password || '';
                            
                            // Đặt giá trị cho lớp học
                            if (cohortIdField) {
                                const cohortId = studentData.cohortId || '';
                                cohortIdField.value = cohortId;
                                
                                // Nếu không có option với giá trị này, thêm log để kiểm tra
                                if (cohortId && !Array.from(cohortIdField.options).some(opt => opt.value === cohortId)) {
                                    console.warn(`Lớp học với ID ${cohortId} không tồn tại trong danh sách dropdown`);
                                }
                            }
                            
                            // Log các trường đã điền
                            console.log('Form filled with the following values:', {
                                lastName: lastNameField?.value,
                                firstName: firstNameField?.value,
                                email: emailField?.value,
                                gender: genderField?.value,
                                address: addressField?.value,
                                dob: dobField?.value,
                                phone: phoneField?.value,
                                password: passwordField?.value,
                                cohortId: cohortIdField?.value
                            });
                        } catch (formError) {
                            console.error('Error filling form fields:', formError);
                        }
                    } else {
                        console.warn('API returned empty or null student data');
                        this.showNotification('warning', 'Dữ liệu không đầy đủ', 'API trả về dữ liệu rỗng hoặc không đầy đủ.');
                    }
                } catch (error) {
                    console.error('Error loading student data:', error);
                    this.showNotification('error', 'Lỗi tải dữ liệu', 'Không thể tải thông tin học sinh. Vui lòng thử lại sau.');
                }
            }
        }
        
        // Mở modal
        this.openModal('studentModal');
    }
    

    async saveStudent() {
        try {
            const form = document.getElementById('studentForm');
            const formData = new FormData(form);
            const studentData = {};
            
            formData.forEach((value, key) => {
                studentData[key] = value;
            });
            
            studentData.studentId = studentData.studentId || null;
            
            // Mở popup xác nhận
            this.showConfirmation(
                'Xác nhận lưu học sinh',
                'Bạn có chắc chắn muốn lưu thông tin học sinh này?',
                async () => {
                    try {
                        const isUpdate = studentData.studentId ? true : false;
                        
                        // Gửi yêu cầu lưu
                        await this.saveStudentRequest(studentData);
                        
                        // Đóng modal
                        this.closeModal('studentModal');
                        
                        // Cập nhật danh sách học sinh
                        await this.loadStudents();
                        
                        // Hiển thị thông báo thành công
                        this.showNotification(
                            'success',
                            isUpdate ? 'Cập nhật thành công' : 'Thêm mới thành công',
                            isUpdate ? 'Thông tin học sinh đã được cập nhật.' : 'Học sinh mới đã được thêm vào hệ thống.'
                        );
                    } catch (error) {
                        console.error('Error saving student:', error);
                        this.showNotification(
                            'error',
                            'Lỗi lưu thông tin',
                            'Đã xảy ra lỗi khi lưu thông tin học sinh. Vui lòng thử lại sau.'
                        );
                    }
                }
            );
        } catch (error) {
            console.error('Error in saveStudent:', error);
        }
    }
    
    
    async deleteStudent(studentId) {
        try {
            this.showConfirmation(
                'Xác nhận xóa học sinh',
                'Bạn có chắc chắn muốn xóa học sinh này không? Dữ liệu không thể khôi phục sau khi xóa.',
                async () => {
                    try {
                        await this.deleteStudentRequest(studentId);
                        await this.loadStudents();
                        this.showNotification(
                            'success',
                            'Xóa học sinh thành công',
                            'Học sinh đã được xóa khỏi hệ thống.'
                        );
                    } catch (error) {
                        console.error('Error deleting student:', error);
                        this.showNotification(
                            'error',
                            'Lỗi xóa học sinh',
                            'Đã xảy ra lỗi khi xóa học sinh. Vui lòng thử lại sau.'
                        );
                    }
                }
            );
        } catch (error) {
            console.error('Error in deleteStudent:', error);
        }
    }



    async initializeTeacherManagement() {
        await this.loadTeachers();
        this.setupTeacherEventListeners();
    }

    

    async loadTeachers() {
        try {
            const response = await fetch('https://scoreapi-1zqy.onrender.com/RealAdmins/GetAllTeacher');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
    
            console.log("API response:", data);
    
            const teachers = data.data || []; 
    
            console.log("Parsed students:", teachers); 
    
            const tbody = document.querySelector('#teacherTable tbody');
            tbody.innerHTML = teachers.map(teacher => `
                <tr>
                
                    
                    <td>${teacher.lastName}</td>
                    <td>${teacher.firstName}</td>
                    <td>${teacher.email}</td>
                    <td>${teacher.gender}
                    <td>${teacher.phoneNumber}</td>
                    <td>${teacher.address}</td>
                    <td>${teacher.dateOfBirth}</td>
                    <td>${teacher.password}</td>
                   
                    <td>
                        <button onclick="adminDashboard.openTeacherModal('${teacher.teacherId}')" class="btn-edit" data-id="${teacher.teacherId}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="adminDashboard.deleteTeacher('${teacher.teacherId}')" class="btn-delete" data-id="${teacher.teacherId}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error("Error loading teachers:", error);
        }
    }
    

    setupTeacherEventListeners() {
        document.getElementById('addTeacherBtn')?.addEventListener('click', () => {
            this.openTeacherModal();
        });

        document.getElementById('teacherForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveTeacher();
        });
    }

    async openTeacherModal(teacherId = null) {
        // Đặt tiêu đề modal tùy theo thêm mới hay chỉnh sửa
        const modalTitle = document.querySelector('#teacherModal .modal-header h3');
        if (modalTitle) {
            modalTitle.textContent = teacherId ? 'Chỉnh sửa giáo viên' : 'Thêm giáo viên mới';
        }
        
        // Reset form
        const form = document.getElementById('teacherForm');
        if (form) {
            form.reset();
            
            // Đặt ID giáo viên cho form
            const teacherIdField = form.querySelector('[name="teacherId"]');
            if (teacherIdField) {
                teacherIdField.value = teacherId || '';
            }
            
            // Nếu có ID giáo viên, tải thông tin giáo viên từ API
            if (teacherId) {
                try {
                    // Hiển thị thông báo đang tải
                    this.showNotification('info', 'Đang tải dữ liệu', 'Vui lòng đợi trong giây lát...', null);
                    
                    // Gọi API để lấy thông tin giáo viên
                    const response = await fetch(`https://scoreapi-1zqy.onrender.com/RealAdmins/GetTeacherById?id=${teacherId}`);
                    
                    // Ẩn thông báo đang tải
                    this.hideNotification();
                    
                    if (!response.ok) {
                        throw new Error('Không thể tải thông tin giáo viên');
                    }
                    
                    const teacher = await response.json();
                    console.log('Teacher data from API:', teacher);
                    
                    // Điền thông tin giáo viên vào form
                    if (teacher) {
                        // Xử lý các trường hợp khác nhau của API
                        const teacherData = teacher.data || teacher;
                        
                        // Log dữ liệu để kiểm tra
                        console.log('Teacher data to fill form:', teacherData);
                        
                        try {
                            // Form fields
                            const lastNameField = form.querySelector('[name="lastName"]');
                            const firstNameField = form.querySelector('[name="firstName"]');
                            const emailField = form.querySelector('[name="email"]');
                            const genderField = form.querySelector('[name="gender"]');
                            const addressField = form.querySelector('[name="address"]');
                            const dobField = form.querySelector('[name="dob"]');
                            const phoneField = form.querySelector('[name="phone"]');
                            const passwordField = form.querySelector('[name="password"]');
                            
                            // Điền dữ liệu vào từng trường nếu trường tồn tại và có dữ liệu
                            if (lastNameField) lastNameField.value = teacherData.lastName || teacherData.LName || '';
                            if (firstNameField) firstNameField.value = teacherData.firstName || teacherData.FName || '';
                            if (emailField) emailField.value = teacherData.email || '';
                            if (genderField) genderField.value = teacherData.gender || 'Male';
                            if (addressField) addressField.value = teacherData.address || '';
                            
                            // Xử lý ngày sinh
                            if (dobField && teacherData.dob) {
                                let dobValue = teacherData.dob;
                                // Cắt thời gian nếu cần thiết
                                if (dobValue.includes('T')) {
                                    dobValue = dobValue.split('T')[0];
                                }
                                dobField.value = dobValue;
                            }
                            
                            if (phoneField) phoneField.value = teacherData.phone || '';
                            if (passwordField) passwordField.value = teacherData.password || '';
                            
                            // Log các trường đã điền
                            console.log('Form filled with the following values:', {
                                lastName: lastNameField?.value,
                                firstName: firstNameField?.value,
                                email: emailField?.value,
                                gender: genderField?.value,
                                address: addressField?.value,
                                dob: dobField?.value,
                                phone: phoneField?.value,
                                password: passwordField?.value
                            });
                        } catch (formError) {
                            console.error('Error filling form fields:', formError);
                        }
                    } else {
                        console.warn('API returned empty or null teacher data');
                        this.showNotification('warning', 'Dữ liệu không đầy đủ', 'API trả về dữ liệu rỗng hoặc không đầy đủ.');
                    }
                } catch (error) {
                    console.error('Error loading teacher data:', error);
                    this.showNotification('error', 'Lỗi tải dữ liệu', 'Không thể tải thông tin giáo viên. Vui lòng thử lại sau.');
                }
            }
        }
        
        // Mở modal
        this.openModal('teacherModal');
    }
    

    async saveTeacher() {
        try {
            const form = document.getElementById('teacherForm');
            const formData = new FormData(form);
            const teacherData = {};
            
            formData.forEach((value, key) => {
                teacherData[key] = value;
            });
            
            teacherData.teacherId = teacherData.teacherId || null;
            
            // Mở popup xác nhận
            this.showConfirmation(
                'Xác nhận lưu giáo viên',
                'Bạn có chắc chắn muốn lưu thông tin giáo viên này?',
                async () => {
                    try {
                        const isUpdate = teacherData.teacherId ? true : false;
                        
                        // Gửi yêu cầu lưu
                        await this.saveTeacherRequest(teacherData);
                        
                        // Đóng modal
                        this.closeModal('teacherModal');
                        
                        // Cập nhật danh sách giáo viên
                        await this.loadTeachers();
                        
                        // Hiển thị thông báo thành công
                        this.showNotification(
                            'success',
                            isUpdate ? 'Cập nhật thành công' : 'Thêm mới thành công',
                            isUpdate ? 'Thông tin giáo viên đã được cập nhật.' : 'Giáo viên mới đã được thêm vào hệ thống.'
                        );
                    } catch (error) {
                        console.error('Error saving teacher:', error);
                        this.showNotification(
                            'error',
                            'Lỗi lưu thông tin',
                            'Đã xảy ra lỗi khi lưu thông tin giáo viên. Vui lòng thử lại sau.'
                        );
                    }
                }
            );
        } catch (error) {
            console.error('Error in saveTeacher:', error);
        }
    }
    
    
    async deleteTeacher(teacherId) {
        try {
            this.showConfirmation(
                'Xác nhận xóa giáo viên',
                'Bạn có chắc chắn muốn xóa giáo viên này không? Dữ liệu không thể khôi phục sau khi xóa.',
                async () => {
                    try {
                        await this.deleteTeacherRequest(teacherId);
                        await this.loadTeachers();
                        this.showNotification(
                            'success',
                            'Xóa giáo viên thành công',
                            'Giáo viên đã được xóa khỏi hệ thống.'
                        );
                    } catch (error) {
                        console.error('Error deleting teacher:', error);
                        this.showNotification(
                            'error',
                            'Lỗi xóa giáo viên',
                            'Đã xảy ra lỗi khi xóa giáo viên. Vui lòng thử lại sau.'
                        );
                    }
                }
            );
        } catch (error) {
            console.error('Error in deleteTeacher:', error);
        }
    }



    async initializeCohortManagement() {
        await this.loadCohorts();
        this.setupCohortEventListeners();
        
    }


    async  loadCohorts() {
        try {
            const response = await fetch('https://scoreapi-1zqy.onrender.com/RealAdmins/GetAllCohorts');
            const data = await response.json();
            console.log("API Cohorts Response:", data);
    
            const cohorts = data.data; 
    
            if (!Array.isArray(cohorts)) {
                console.error("Lỗi: API không trả về một mảng lớp học!");
                return;
            }
    
            // Get student counts for each cohort
            const studentCounts = await Promise.all(cohorts.map(async (co) => {
                try {
                    const res = await fetch(`https://scoreapi-1zqy.onrender.com/RealAdmins/GetNumOfStudentsInACohort?id=${co.cohortId}`);
                    const countData = await res.json();
                    
                    if (Array.isArray(countData) && countData.length > 0) {
                        return countData[0].numOfStudents || 0; // Extract first object from array
                    }
    
                    return 0; // Default to 0 if no valid data
                } catch (error) {
                    console.error(`Lỗi khi lấy số lượng sinh viên cho lớp ${co.cohortId}:`, error);
                    return 0;
                }
            }));
    
            // Update the table
            const tbody = document.querySelector('#cohortTable tbody');
            tbody.innerHTML = cohorts.map((co, index) => {
                return `
                    <tr>
                        <td>${co.cohortName}</td>
                        <td>${co.description}</td>
                        <td>${studentCounts[index]}</td>
                        <td>
                            <button onclick="adminDashboard.openCohortModal('${co.cohortId}')" class="btn-edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="adminDashboard.deleteCohort('${co.cohortId}')" class="btn-delete">
                                <i class="fas fa-trash"></i>
                            </button>
                             <button onclick="adminDashboard.printStudentInfo('${co.cohortId}')" class="btn-print">
                            <i class="fas fa-print"></i> Print
                        </button>
                        </td>
                    </tr>
                `;
            }).join('');
    
        } catch (error) {
            console.error("Lỗi khi load danh sách lớp:", error);
        }
    }

    async printStudentInfo(cohortId) {
        try {
            const res = await fetch(`https://scoreapi-1zqy.onrender.com/RealAdmins/GetStudentsInCohort?id=${cohortId}`);
            const students = await res.json();
    
            if (!Array.isArray(students) || students.length === 0) {
                alert("Không có sinh viên nào trong lớp này!");
                return;
            }
    
            // Open a new tab
            let newTab = window.open();
    
            // Define styles for better readability
            let styles = `
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f4f4f4; }
                </style>
            `;
    
            // Generate HTML table with column headers
            let tableContent = `
                <h2>Danh sách sinh viên trong lớp</h2>
                <table>
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Họ và Tên</th>
                            <th>Giới tính</th>
                            <th>Ngày sinh</th>
                            <th>Email</th>
                            <th>Số điện thoại</th>
                            <th>Địa chỉ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map((student, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${student.studentFullName}</td>
                                <td>${student.studentGender}</td>
                                <td>${student.studentDOB}</td>
                                <td>${student.studentEmail}</td>
                                <td>${student.studentPhone}</td>
                                <td>${student.studentAddress}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            `;
    
            // Write content to new tab and trigger printing
            newTab.document.write(`<html><head>${styles}</head><body>${tableContent}</body></html>`);
            newTab.document.close(); // Ensure document is fully loaded
    
        } catch (error) {
            console.error("Lỗi khi tải danh sách sinh viên:", error);
            alert("Không thể tải danh sách sinh viên!");
        }
    }
    
    
    
    
    


    setupCohortEventListeners() {
        document.getElementById('addCohortBtn')?.addEventListener('click', () => {
            this.openCohortModal();
        });

        document.getElementById('cohortForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveCohort();
        });
    }

    async openCohortModal(cohortId = null) {
        // Đặt tiêu đề modal tùy theo thêm mới hay chỉnh sửa
        const modalTitle = document.querySelector('#cohortModal .modal-header h3');
        if (modalTitle) {
            modalTitle.textContent = cohortId ? 'Chỉnh sửa lớp học' : 'Thêm lớp học mới';
        }
        
        // Reset form
        const form = document.getElementById('cohortForm');
        if (form) {
            form.reset();
            
            // Đặt ID lớp học cho form
            const cohortIdField = form.querySelector('[name="cohortId"]');
            if (cohortIdField) {
                cohortIdField.value = cohortId || '';
            }
            
            // Nếu có ID lớp học, tải thông tin lớp học từ API
            if (cohortId) {
                try {
                    // Hiển thị thông báo đang tải
                    this.showNotification('info', 'Đang tải dữ liệu', 'Vui lòng đợi trong giây lát...', null);
                    
                    // Gọi API để lấy thông tin lớp học
                    const response = await fetch(`https://scoreapi-1zqy.onrender.com/RealAdmins/GetCohortById?id=${cohortId}`);
                    
                    // Ẩn thông báo đang tải
                    this.hideNotification();
                    
                    if (!response.ok) {
                        throw new Error('Không thể tải thông tin lớp học');
                    }
                    
                    const cohort = await response.json();
                    console.log('Cohort data from API:', cohort);
                    
                    // Điền thông tin lớp học vào form
                    if (cohort) {
                        // Xử lý các trường hợp khác nhau của API
                        const cohortData = cohort.data || cohort;
                        
                        // Log dữ liệu để kiểm tra
                        console.log('Cohort data to fill form:', cohortData);
                        
                        try {
                            // Form fields
                            const nameField = form.querySelector('[name="cohortName"]');
                            const descriptionField = form.querySelector('[name="description"]');
                            
                            // Điền dữ liệu vào từng trường nếu trường tồn tại và có dữ liệu
                            if (nameField) nameField.value = cohortData.name || cohortData.CName || '';
                            if (descriptionField) descriptionField.value = cohortData.description || cohortData.Description || '';
                            
                            // Log các trường đã điền
                            console.log('Form filled with the following values:', {
                                name: nameField?.value,
                                description: descriptionField?.value
                            });
                        } catch (formError) {
                            console.error('Error filling form fields:', formError);
                        }
                    } else {
                        console.warn('API returned empty or null cohort data');
                        this.showNotification('warning', 'Dữ liệu không đầy đủ', 'API trả về dữ liệu rỗng hoặc không đầy đủ.');
                    }
                } catch (error) {
                    console.error('Error loading cohort data:', error);
                    this.showNotification('error', 'Lỗi tải dữ liệu', 'Không thể tải thông tin lớp học. Vui lòng thử lại sau.');
                }
            }
        }
        
        // Mở modal
        this.openModal('cohortModal');
    }
    
    async saveCohort() {
        try {
            const form = document.getElementById('cohortForm');
            const formData = new FormData(form);
            const cohortData = {};
            
            formData.forEach((value, key) => {
                cohortData[key] = value;
            });
            
            cohortData.cohortId = cohortData.cohortId || null;
            
            // Mở popup xác nhận
            this.showConfirmation(
                'Xác nhận lưu lớp học',
                'Bạn có chắc chắn muốn lưu thông tin lớp học này?',
                async () => {
                    try {
                        const isUpdate = cohortData.cohortId ? true : false;
                        
                        // Gửi yêu cầu lưu
                        await this.saveCohortRequest(cohortData);
                        
                        // Đóng modal
                        this.closeModal('cohortModal');
                        
                        // Cập nhật danh sách lớp học
                        await this.loadCohorts();
                        
                        // Hiển thị thông báo thành công
                        this.showNotification(
                            'success',
                            isUpdate ? 'Cập nhật thành công' : 'Thêm mới thành công',
                            isUpdate ? 'Thông tin lớp học đã được cập nhật.' : 'Lớp học mới đã được thêm vào hệ thống.'
                        );
                    } catch (error) {
                        console.error('Error saving cohort:', error);
                        this.showNotification(
                            'error',
                            'Lỗi lưu thông tin',
                            'Đã xảy ra lỗi khi lưu thông tin lớp học. Vui lòng thử lại sau.'
                        );
                    }
                }
            );
        } catch (error) {
            console.error('Error in saveCohort:', error);
        }
    }

    async saveCohortRequest(cohortData) {
        const params = new URLSearchParams({
            id: cohortData.cohortId || "",
            name: cohortData.cohortName,
            description: cohortData.description
        });

        const isUpdating = Boolean(cohortData.cohortId);
        const url = isUpdating
            ? `https://scoreapi-1zqy.onrender.com/RealAdmins/UpdateCohort?${params}`
            : `https://scoreapi-1zqy.onrender.com/RealAdmins/InsertCohort?${params}`;

        const method = isUpdating ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error(`Failed to ${isUpdating ? "update" : "create"} cohort`);
        
        return response.json();
    }

    async deleteCohort(cohortId) {
        try {
            this.showConfirmation(
                'Xác nhận xóa lớp học',
                'Bạn có chắc chắn muốn xóa lớp học này không? Dữ liệu không thể khôi phục sau khi xóa.',
                async () => {
                    try {
                        await this.deleteCohortRequest(cohortId);
                        await this.loadCohorts();
                        this.showNotification(
                            'success',
                            'Xóa lớp học thành công',
                            'Lớp học đã được xóa khỏi hệ thống.'
                        );
                    } catch (error) {
                        console.error('Error deleting cohort:', error);
                        this.showNotification(
                            'error',
                            'Lỗi xóa lớp học',
                            'Đã xảy ra lỗi khi xóa lớp học. Vui lòng thử lại sau.'
                        );
                    }
                }
            );
        } catch (error) {
            console.error('Error in deleteCohort:', error);
        }
    }

    async deleteCohortRequest(cohortId) {
        const response = await fetch(`https://scoreapi-1zqy.onrender.com/RealAdmins/DeleteCohort?id=${cohortId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Lỗi xóa lớp học: ${response.status}`);
        }
        
        return true;
    }

    



    async initializeAssignmentManagement() {
        await this.loadAssignments();
        this.setupAssignmentEventListeners();
        await this.loadAssignmentFormData();
    }

    async loadAssignments() {
        try {
            const response = await fetch('https://scoreapi-1zqy.onrender.com/RealAdmins/GetAllAssignments');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            const assignments = data.data || [];

            // Lấy thông tin giáo viên
            const teachersResponse = await fetch('https://scoreapi-1zqy.onrender.com/RealAdmins/GetAllTeacher');
            const teachersData = await teachersResponse.json();
            const teachers = teachersData.data || [];

            // Lấy thông tin môn học
            const subjectsResponse = await fetch('https://scoreapi-1zqy.onrender.com/RealAdmins/GetAllSubjects');
            const subjectsData = await subjectsResponse.json();
            const subjects = subjectsData.data || [];

            // Lấy thông tin lớp học
            const cohortsResponse = await fetch('https://scoreapi-1zqy.onrender.com/RealAdmins/GetAllCohorts');
            const cohortsData = await cohortsResponse.json();
            const cohorts = cohortsData.data || [];

            const tbody = document.querySelector('#assignmentTable tbody');
            if (!tbody) {
                console.error('Không tìm thấy bảng phân công!');
                return;
            }

            tbody.innerHTML = assignments.map(assignment => {
                const teacher = teachers.find(t => t.teacherId === assignment.teacherId);
                const subject = subjects.find(s => s.subjectId === assignment.subjectId);
                const cohort = cohorts.find(c => c.cohortId === assignment.cohortId);

                return `
                    <tr>
                        <td>${teacher ? `${teacher.firstName} ${teacher.lastName}` : 'N/A'}</td>
                        <td>${subject ? subject.subjectName : 'N/A'}</td>
                        <td>${cohort ? cohort.cohortName : 'N/A'}</td>
                        <td>${assignment.timeSlot || 'N/A'}</td>
                        <td>
                            <span class="status-badge ${assignment.status.toLowerCase()}">
                                ${this.getStatusText(assignment.status)}
                            </span>
                        </td>
                        <td>
                            <button onclick="adminDashboard.openAssignmentModal('${assignment.assignmentId}')" class="btn-edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="adminDashboard.deleteAssignment('${assignment.assignmentId}')" class="btn-delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error("Lỗi khi tải danh sách phân công:", error);
        }
    }

    getStatusText(status) {
        const statusMap = {
            'active': 'Đang hoạt động',
            'pending': 'Chờ xử lý',
            'completed': 'Đã hoàn thành'
        };
        return statusMap[status] || status;
    }

    async loadAssignmentFormData() {
        try {
            // Load danh sách giáo viên
            const teachersResponse = await fetch('https://scoreapi-1zqy.onrender.com/RealAdmins/GetAllTeacher');
            const teachersData = await teachersResponse.json();
            const teachers = teachersData.data || [];
            
            const teacherSelect = document.querySelector('select[name="teacherId"]');
            teacherSelect.innerHTML = teachers.map(teacher => 
                `<option value="${teacher.teacherId}">${teacher.firstName} ${teacher.lastName}</option>`
            ).join('');

            // Load danh sách môn học
            const subjectsResponse = await fetch('https://scoreapi-1zqy.onrender.com/RealAdmins/GetAllSubjects');
            const subjectsData = await subjectsResponse.json();
            const subjects = subjectsData.data || [];
            
            const subjectSelect = document.querySelector('select[name="subjectId"]');
            subjectSelect.innerHTML = subjects.map(subject => 
                `<option value="${subject.subjectId}">${subject.subjectName}</option>`
            ).join('');

            // Load danh sách lớp học
            const cohortsResponse = await fetch('https://scoreapi-1zqy.onrender.com/RealAdmins/GetAllCohorts');
            const cohortsData = await cohortsResponse.json();
            const cohorts = cohortsData.data || [];
            
            const cohortSelect = document.querySelector('select[name="cohortId"]');
            cohortSelect.innerHTML = cohorts.map(cohort => 
                `<option value="${cohort.cohortId}">${cohort.cohortName}</option>`
            ).join('');
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu form:", error);
        }
    }

    setupAssignmentEventListeners() {
        document.getElementById('addAssignmentBtn')?.addEventListener('click', () => {
            this.openAssignmentModal();
        });

        document.getElementById('assignmentForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveAssignment();
        });

        // Thêm tìm kiếm
        document.getElementById('searchAssignment')?.addEventListener('input', (e) => {
            this.searchAssignments(e.target.value);
        });
    }

    async openAssignmentModal(assignmentId = null) {
        // Đặt tiêu đề modal tùy theo thêm mới hay chỉnh sửa
        const modalTitle = document.querySelector('#assignmentModal .modal-header h3');
        if (modalTitle) {
            modalTitle.textContent = assignmentId ? 'Chỉnh sửa phân công' : 'Thêm phân công mới';
        }
        
        // Reset form
        const form = document.getElementById('assignmentForm');
        if (form) {
            form.reset();
            
            // Đặt ID phân công cho form
            const assignmentIdField = form.querySelector('[name="assignmentId"]');
            if (assignmentIdField) {
                assignmentIdField.value = assignmentId || '';
            }
            
            // Tải dữ liệu cho các dropdown trước
            await this.loadAssignmentFormData();
            
            // Nếu có ID phân công, tải thông tin phân công từ API
            if (assignmentId) {
                try {
                    // Hiển thị thông báo đang tải
                    this.showNotification('info', 'Đang tải dữ liệu', 'Vui lòng đợi trong giây lát...', null);
                    
                    // Gọi API để lấy thông tin phân công
                    const response = await fetch(`https://scoreapi-1zqy.onrender.com/RealAdmins/GetAssignmentById?id=${assignmentId}`);
                    
                    // Ẩn thông báo đang tải
                    this.hideNotification();
                    
                    if (!response.ok) {
                        throw new Error('Không thể tải thông tin phân công');
                    }
                    
                    const assignment = await response.json();
                    console.log('Assignment data from API:', assignment);
                    
                    // Điền thông tin phân công vào form
                    if (assignment) {
                        // Xử lý các trường hợp khác nhau của API
                        const assignmentData = assignment.data || assignment;
                        
                        // Log dữ liệu để kiểm tra
                        console.log('Assignment data to fill form:', assignmentData);
                        
                        try {
                            // Form fields
                            const teacherIdField = form.querySelector('[name="teacherId"]');
                            const subjectIdField = form.querySelector('[name="subjectId"]');
                            const cohortIdField = form.querySelector('[name="cohortId"]');
                            const timeSlotField = form.querySelector('[name="timeSlot"]');
                            const statusField = form.querySelector('[name="status"]');
                            
                            // Điền dữ liệu vào từng trường nếu trường tồn tại và có dữ liệu
                            if (teacherIdField) {
                                const teacherId = assignmentData.teacherId || '';
                                teacherIdField.value = teacherId;
                            }
                            
                            if (subjectIdField) {
                                const subjectId = assignmentData.subjectId || '';
                                subjectIdField.value = subjectId;
                            }
                            
                            if (cohortIdField) {
                                const cohortId = assignmentData.cohortId || '';
                                cohortIdField.value = cohortId;
                            }
                            
                            if (timeSlotField) timeSlotField.value = assignmentData.timeSlot || '';
                            if (statusField) statusField.value = assignmentData.status || 'active';
                            
                            // Log các trường đã điền
                            console.log('Form filled with the following values:', {
                                teacherId: teacherIdField?.value,
                                subjectId: subjectIdField?.value,
                                cohortId: cohortIdField?.value,
                                timeSlot: timeSlotField?.value,
                                status: statusField?.value
                            });
                        } catch (formError) {
                            console.error('Error filling form fields:', formError);
                        }
                    } else {
                        console.warn('API returned empty or null assignment data');
                        this.showNotification('warning', 'Dữ liệu không đầy đủ', 'API trả về dữ liệu rỗng hoặc không đầy đủ.');
                    }
                } catch (error) {
                    console.error('Error loading assignment data:', error);
                    this.showNotification('error', 'Lỗi tải dữ liệu', 'Không thể tải thông tin phân công. Vui lòng thử lại sau.');
                }
            }
        }
        
        // Mở modal
        this.openModal('assignmentModal');
    }

    async saveAssignment() {
        try {
            const form = document.getElementById('assignmentForm');
            const formData = new FormData(form);
            const assignmentData = {};
            
            formData.forEach((value, key) => {
                assignmentData[key] = value;
            });
            
            assignmentData.assignmentId = assignmentData.assignmentId || null;
            
            // Mở popup xác nhận
            this.showConfirmation(
                'Xác nhận lưu phân công',
                'Bạn có chắc chắn muốn lưu thông tin phân công này?',
                async () => {
                    try {
                        const isUpdate = assignmentData.assignmentId ? true : false;
                        
                        // Gửi yêu cầu lưu
                        await this.saveAssignmentRequest(assignmentData);
                        
                        // Đóng modal
                        this.closeModal('assignmentModal');
                        
                        // Cập nhật danh sách phân công
                        await this.loadAssignments();
                        
                        // Hiển thị thông báo thành công
                        this.showNotification(
                            'success',
                            isUpdate ? 'Cập nhật thành công' : 'Thêm mới thành công',
                            isUpdate ? 'Thông tin phân công đã được cập nhật.' : 'Phân công mới đã được thêm vào hệ thống.'
                        );
                    } catch (error) {
                        console.error('Error saving assignment:', error);
                        this.showNotification(
                            'error',
                            'Lỗi lưu thông tin',
                            'Đã xảy ra lỗi khi lưu thông tin phân công. Vui lòng thử lại sau.'
                        );
                    }
                }
            );
        } catch (error) {
            console.error('Error in saveAssignment:', error);
        }
    }

    async saveAssignmentRequest(assignmentData) {
        const params = new URLSearchParams({
            id: assignmentData.assignmentId || "",
            teacherId: assignmentData.teacherId,
            subjectId: assignmentData.subjectId,
            cohortId: assignmentData.cohortId,
            timeSlot: assignmentData.timeSlot,
            status: assignmentData.status
        });

        const isUpdating = Boolean(assignmentData.assignmentId);
        const url = isUpdating
            ? `https://scoreapi-1zqy.onrender.com/RealAdmins/UpdateAssignment?${params}`
            : `https://scoreapi-1zqy.onrender.com/RealAdmins/InsertAssignment?${params}`;

        const method = isUpdating ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error(`Failed to ${isUpdating ? "update" : "create"} assignment`);
        
        return response.json();
    }

    async deleteAssignment(assignmentId) {
        try {
            this.showConfirmation(
                'Xác nhận xóa phân công',
                'Bạn có chắc chắn muốn xóa phân công này không? Dữ liệu không thể khôi phục sau khi xóa.',
                async () => {
                    try {
                        await this.deleteAssignmentRequest(assignmentId);
                        await this.loadAssignments();
                        this.showNotification(
                            'success',
                            'Xóa phân công thành công',
                            'Phân công đã được xóa khỏi hệ thống.'
                        );
                    } catch (error) {
                        console.error('Error deleting assignment:', error);
                        this.showNotification(
                            'error',
                            'Lỗi xóa phân công',
                            'Đã xảy ra lỗi khi xóa phân công. Vui lòng thử lại sau.'
                        );
                    }
                }
            );
        } catch (error) {
            console.error('Error in deleteAssignment:', error);
        }
    }

    async deleteAssignmentRequest(assignmentId) {
        const response = await fetch(`https://scoreapi-1zqy.onrender.com/RealAdmins/DeleteAssignment?id=${assignmentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Lỗi xóa phân công: ${response.status}`);
        }
        
        return true;
    }

    searchAssignments(query) {
        const rows = document.querySelectorAll('#assignmentTable tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }

    async initializeAccountManagement() {
        await this.loadAccounts();
        this.setupAccountEventListeners();
    }

    async loadAccounts() {
        const teachersResponse = await fetch('https://localhost:7112/Teacher/GetAllTeacher');
        const teachersData = await teachersResponse.json();
        const teachers = teachersData.data || [];
        const studentsResponse = await fetch('https://localhost:7112/Student/GetAllStudents');
        const studentsData = await studentsResponse.json();
        const students = studentsData.data || [];
        const adminsResponse = await fetch('https://localhost:7112/Admin/GetAllAdmins');
        const adminsData = await adminsResponse.json();
        const admins = adminsData.data || [];
        
        const accounts = [
            ...admins.map(a => ({...a, type: 'Admin'})),
            ...teachers.map(t => ({...t, type: 'Giáo viên'})),
            ...students.map(s => ({...s, type: 'Học sinh'}))
        ];
        
        const tbody = document.querySelector('#accountTable tbody');
        tbody.innerHTML = accounts.map(acc => `
            <tr>
                <td>${acc.email}</td>
                <td>${acc.type}</td>
                <td>${acc.lastName || ''} ${acc.firstName || ''}</td>
       
                <td>
                    <button onclick="adminDashboard.resetPassword('${acc.email}')" class="btn-edit">
                        <i class="fas fa-key"></i>
                    </button>
                    <button onclick="adminDashboard.toggleAccountStatus('${acc.email}')" class="btn-warning">
                        <i class="fas fa-ban"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    
    async  getSystemStats() {   
        try {
            const studentsResponse = await fetch('https://scoreapi-1zqy.onrender.com/RealAdmins/GetAllStudents');
            const studentsData = await studentsResponse.json();
            const students = studentsData.data || [];
            
            const teachersResponse = await fetch('https://scoreapi-1zqy.onrender.com/RealAdmins/GetAllTeacher');
            const teachersData = await teachersResponse.json();
            const teachers = teachersData.data || [];

            const cohortsResponse = await fetch('https://scoreapi-1zqy.onrender.com/RealAdmins/GetAllCohorts');
            const cohortsData = await cohortsResponse.json();
            const cohorts = cohortsData.data || [];
    
            return {
                students: students.length,
                teachers: teachers.length,
                cohorts: cohorts.length
            };
        } catch (error) {
            console.error("Error fetching system stats:", error);
            return { students: 0, teachers: 0, cohortss: 0 };
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'block';
        // Trigger reflow
        modal.offsetHeight;
        modal.classList.add('show');
    }

    // Thêm event listeners cho đóng modal khi click ra ngoài
    setupModalOutsideClick() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    // Thêm phương thức mới
    setupMobileHandlers() {
        // Xử lý toggle sidebar
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (menuToggle && sidebar && overlay) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                overlay.classList.toggle('active');
            });
            
            overlay.addEventListener('click', () => {
                this.closeSidebar();
            });
            
            // Đóng sidebar khi chọn menu item trên mobile
            const menuItems = document.querySelectorAll('.sidebar li');
            menuItems.forEach(item => {
                item.addEventListener('click', () => {
                    if (this.isMobile) {
                        this.closeSidebar();
                    }
                });
            });
        }
    }

    // Thêm phương thức mới
    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar && overlay) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }
    }

    // Thêm phương thức mới
    handleResponsiveLayout() {
        // Xử lý các thay đổi layout khi chuyển đổi giữa desktop và mobile
        if (!this.isMobile) {
            this.closeSidebar();
        }
        
        // Điều chỉnh bảng dữ liệu nếu cần
        this.optimizeTablesForMobile();
    }

    // Thêm phương thức mới
    optimizeTablesForMobile() {
        // Tối ưu hóa hiển thị bảng trên thiết bị di động
        if (this.isMobile) {
            // Thêm class mobile-view cho các bảng
            document.querySelectorAll('table').forEach(table => {
                table.classList.add('mobile-view');
            });
        } else {
            // Xóa class mobile-view
            document.querySelectorAll('table').forEach(table => {
                table.classList.remove('mobile-view');
            });
        }
    }

    // Thêm các phương thức xử lý popup xác nhận và thông báo

    // Thêm các phương thức mới
    setupPopupHandlers() {
        // Thiết lập sự kiện đóng popup thông báo
        const okButton = document.getElementById('okButton');
        if (okButton) {
            okButton.addEventListener('click', () => {
                this.hideNotification();
            });
        }
        
        // Thiết lập sự kiện đóng popup xác nhận
        const cancelButton = document.getElementById('cancelButton');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                this.hideConfirmation();
            });
        }
    }

    /**
     * Hiển thị popup xác nhận với callback
     * @param {string} title - Tiêu đề popup
     * @param {string} message - Nội dung xác nhận
     * @param {Function} onConfirm - Hàm callback khi người dùng xác nhận
     */
    showConfirmation(title, message, onConfirm) {
        const confirmTitle = document.getElementById('confirmTitle');
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmButton = document.getElementById('confirmButton');
        const confirmationPopup = document.getElementById('confirmationPopup');
        
        if (confirmTitle && confirmMessage && confirmButton && confirmationPopup) {
            // Cập nhật nội dung
            confirmTitle.textContent = title || 'Xác nhận thao tác';
            confirmMessage.textContent = message || 'Bạn có chắc chắn muốn thực hiện thao tác này?';
            
            // Xóa sự kiện click cũ
            const newConfirmButton = confirmButton.cloneNode(true);
            confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
            
            // Thêm sự kiện click mới
            newConfirmButton.addEventListener('click', () => {
                this.hideConfirmation();
                if (typeof onConfirm === 'function') {
                    onConfirm();
                }
            });
            
            // Hiển thị popup
            confirmationPopup.classList.add('show');
        }
    }

    /**
     * Ẩn popup xác nhận
     */
    hideConfirmation() {
        const confirmationPopup = document.getElementById('confirmationPopup');
        if (confirmationPopup) {
            confirmationPopup.classList.remove('show');
        }
    }

    /**
     * Hiển thị popup thông báo
     * @param {string} type - Loại thông báo: success, error, warning, info
     * @param {string} title - Tiêu đề thông báo
     * @param {string} message - Nội dung thông báo
     * @param {Function} callback - Hàm callback khi đóng thông báo (optional)
     */
    showNotification(type, title, message, callback) {
        const notificationIcon = document.getElementById('notificationIcon');
        const notificationTitle = document.getElementById('notificationTitle');
        const notificationMessage = document.getElementById('notificationMessage');
        const okButton = document.getElementById('okButton');
        const notificationPopup = document.getElementById('notificationPopup');
        
        if (notificationIcon && notificationTitle && notificationMessage && okButton && notificationPopup) {
            // Cập nhật icon theo loại thông báo
            notificationIcon.className = 'popup-icon ' + (type || 'success');
            
            // Cập nhật icon
            const iconElement = notificationIcon.querySelector('i');
            if (iconElement) {
                switch(type) {
                    case 'error':
                        iconElement.className = 'fas fa-times-circle';
                        break;
                    case 'warning':
                        iconElement.className = 'fas fa-exclamation-triangle';
                        break;
                    case 'info':
                        iconElement.className = 'fas fa-info-circle';
                        break;
                    default: // success
                        iconElement.className = 'fas fa-check-circle';
                }
            }
            
            // Cập nhật nội dung
            notificationTitle.textContent = title || 'Thông báo';
            notificationMessage.textContent = message || 'Thao tác đã hoàn tất.';
            
            // Xóa sự kiện click cũ
            const newOkButton = okButton.cloneNode(true);
            okButton.parentNode.replaceChild(newOkButton, okButton);
            
            // Thêm sự kiện click mới
            newOkButton.addEventListener('click', () => {
                this.hideNotification();
                if (typeof callback === 'function') {
                    callback();
                }
            });
            
            // Hiển thị popup
            notificationPopup.classList.add('show');
        }
    }

    /**
     * Ẩn popup thông báo
     */
    hideNotification() {
        const notificationPopup = document.getElementById('notificationPopup');
        if (notificationPopup) {
            notificationPopup.classList.remove('show');
        }
    }

    // Thêm phương thức saveStudentRequest
    async saveStudentRequest(studentData) {
        const params = new URLSearchParams({
            id: studentData.studentId || "",  
            FName: studentData.firstName,
            LName: studentData.lastName,
            email: studentData.email,
            gender: studentData.gender,
            address: studentData.address,
            dob: studentData.dob,
            phone: studentData.phone,
            password: studentData.password,
            cohortId: studentData.cohortId
        });

        const isUpdating = Boolean(studentData.studentId);
        const url = isUpdating
            ? `https://scoreapi-1zqy.onrender.com/RealAdmins/UpdateStudent?${params}`
            : `https://scoreapi-1zqy.onrender.com/RealAdmins/InsertStudent?${params}`;

        const method = isUpdating ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error(`Failed to ${isUpdating ? "update" : "create"} student`);
        
        return response.json();
    }

    // Thêm phương thức deleteStudentRequest 
    async deleteStudentRequest(studentId) {
        const response = await fetch(`https://scoreapi-1zqy.onrender.com/RealAdmins/DeleteStudent?id=${studentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Lỗi xóa học sinh: ${response.status}`);
        }
        
        return true;
    }

    // Thêm phương thức saveTeacherRequest
    async saveTeacherRequest(teacherData) {
        const params = new URLSearchParams({
            id: teacherData.teacherId || "",  
            FName: teacherData.firstName,
            LName: teacherData.lastName,
            email: teacherData.email,
            gender: teacherData.gender,
            phone: teacherData.phone,        
            address: teacherData.address,
            dob: teacherData.dob,
            password: teacherData.password,
        });

        const isUpdating = Boolean(teacherData.teacherId);
        const url = isUpdating
            ? `https://scoreapi-1zqy.onrender.com/RealAdmins/UpdateTeacher?${params}`
            : `https://scoreapi-1zqy.onrender.com/RealAdmins/InsertTeacher?${params}`;

        const method = isUpdating ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error(`Failed to ${isUpdating ? "update" : "create"} teacher`);
        
        return response.json();
    }

    // Thêm phương thức deleteTeacherRequest
    async deleteTeacherRequest(teacherId) {
        const response = await fetch(`https://scoreapi-1zqy.onrender.com/RealAdmins/DeleteTeacher?id=${teacherId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Lỗi xóa giáo viên: ${response.status}`);
        }
        
        return true;
    }
}

// Initialize dashboard
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
    window.adminDashboard = adminDashboard;
});