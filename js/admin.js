class AdminDashboard {
    constructor() {
        this.currentPage = 'dashboard';
        this.pageContent = document.getElementById('pageContent');
        this.initializeNavigation();
        // Tự động tải trang tổng quan khi khởi tạo
        this.loadPage('dashboard');
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
            const cohortsResponse = await fetch('https://localhost:7231/RealAdmins/GetAllCohorts');
            const cohortsData = await cohortsResponse.json();
            const cohorts = cohortsData.data || [];

            // Lấy số lượng học sinh cho mỗi lớp
            const studentCounts = await Promise.all(cohorts.map(async (cohort) => {
                const response = await fetch(`https://localhost:7231/RealAdmins/GetNumOfStudentsInACohort?id=${cohort.cohortId}`);
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
            const studentsResponse = await fetch('https://localhost:7231/RealAdmins/GetAllStudents');
            const studentsData = await studentsResponse.json();
            const students = studentsData.data || [];

            // Tính tỷ lệ nam/nữ
            const maleStudents = students.filter(s => s.gender === 'Male').length;
            const femaleStudents = students.filter(s => s.gender === 'Female').length;
            const malePercent = Math.round((maleStudents / students.length) * 100);
            const femalePercent = Math.round((femaleStudents / students.length) * 100);
            document.getElementById('genderRatio').textContent = `${malePercent}% / ${femalePercent}%`;

            // Lấy thông tin về lớp học
            const cohortsResponse = await fetch('https://localhost:7231/RealAdmins/GetAllCohorts');
            const cohortsData = await cohortsResponse.json();
            const cohorts = cohortsData.data || [];

            // Lấy số lượng học sinh cho mỗi lớp
            const cohortStats = await Promise.all(cohorts.map(async (cohort) => {
                const response = await fetch(`https://localhost:7231/RealAdmins/GetNumOfStudentsInACohort?id=${cohort.cohortId}`);
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
        const response = await fetch('https://localhost:7231/RealAdmins/GetAllCohorts');
        const data = await response.json();
        const cohorts = data.data || [];
    
        const select = document.querySelector('select[name="cohortId"]');
        select.innerHTML = cohorts.map(co => 
            `<option value="${co.cohortId}">${co.cohortName} </option>`
        ).join('');
    }
    
    async loadStudents() {
        try {
            const response = await fetch('https://localhost:7231/RealAdmins/GetAllStudents');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
    
            console.log("API response:", data); 
    
            const students = data.data || []; 
    
            console.log("Parsed students:", students); 
    
            const cohortsResponse = await fetch('https://localhost:7231/RealAdmins/GetAllCohorts');
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

    async openStudentModal(studentId) {
        const modal = document.getElementById('studentModal');
        const form = document.getElementById('studentForm');
    
        if (studentId) {
            const response = await fetch(`https://localhost:7231/RealAdmins/GetStudentById?id=${studentId}`);
            const student = await response.json();
            
            Object.keys(student).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) input.value = student[key];
            });
            form.querySelector("#studentId").value = studentId;
        } else {
            form.reset();
        }
    
        this.openModal('studentModal');
    }
    

    async saveStudent() {
        const form = document.getElementById('studentForm');
        const formData = new FormData(form);
        const studentData = Object.fromEntries(formData.entries());
    
      
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
            ? `https://localhost:7231/RealAdmins/UpdateStudent?${params}`
            : `https://localhost:7231/RealAdmins/InsertStudent?${params}`;
    
        const method = isUpdating ? "PUT" : "POST";
    
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' }
            });
    
            if (!response.ok) throw new Error(`Failed to ${isUpdating ? "update" : "create"} student`);
    
            this.closeModal('studentModal');
            await this.loadStudents();
        } catch (error) {
            console.error(error);
        }
    }
    
    
    async deleteStudent(studentId) {
        if (!confirm('Bạn có chắc chắn muốn xóa học sinh này?')) return;

    try {
        const response = await fetch(`https://localhost:7231/RealAdmins/DeleteStudent?id=${studentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Lỗi xóa học sinh: ${response.status}`);
        }

        alert('Xóa học sinh thành công!');
        await this.loadStudents();
    } catch (error) {
        console.error("Lỗi khi xóa học sinh:", error);
        alert("Không thể xóa học sinh. Vui lòng thử lại.");
    }
    }



    async initializeTeacherManagement() {
        await this.loadTeachers();
        this.setupTeacherEventListeners();
    }

    

    async loadTeachers() {
        try {
            const response = await fetch('https://localhost:7231/RealAdmins/GetAllTeacher');
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

    async openTeacherModal(teacherId) {
        const modal = document.getElementById('teacherModal');
        const form = document.getElementById('teacherForm');
        
        form.reset(); 
    
        if (teacherId) {
            const response = await fetch(`https://localhost:7231/RealAdmins/GetTeacherById?id=${teacherId}`);
            const teacher = await response.json();
            
            Object.keys(teacher).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) input.value = teacher[key];
            });
            form.querySelector("#teacherId").value = teacherId;
        }
    
        this.openModal('teacherModal');
    }
    

    async saveTeacher() {
        const form = document.getElementById('teacherForm');
        const formData = new FormData(form);
        const teacherData = Object.fromEntries(formData.entries());
    

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
            ? `https://localhost:7231/RealAdmins/UpdateTeacher?${params}`
            : `https://localhost:7231/RealAdmins/InsertTeacher?${params}`;
    
        const method = isUpdating ? "PUT" : "POST";
    
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' }
            });
    
            if (!response.ok) throw new Error(`Failed to ${isUpdating ? "update" : "create"} teacher`);
    
            this.closeModal('teacherModal');
            await this.loadTeachers();
        } catch (error) {
            console.error(error);
        }
    }
    
    
    async deleteTeacher(teacherId) {
        if (!confirm('Bạn có chắc chắn muốn xóa giáo viên này?')) return;

    try {
        const response = await fetch(`https://localhost:7231/RealAdmins/DeleteTeacher?id=${teacherId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Lỗi xóa giáo viên: ${response.status}`);
        }

        alert('Xóa giáo viên thành công!');
        await this.loadTeachers();
    } catch (error) {
        console.error("Lỗi khi xóa giáo viên:", error);
        alert("Không thể xóa giáo viên. Vui lòng thử lại.");
    }
    }



    async initializeCohortManagement() {
        await this.loadCohorts();
        this.setupCohortEventListeners();
        
    }


    async  loadCohorts() {
        try {
            const response = await fetch('https://localhost:7231/RealAdmins/GetAllCohorts');
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
                    const res = await fetch(`https://localhost:7231/RealAdmins/GetNumOfStudentsInACohort?id=${co.cohortId}`);
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
                        </td>
                    </tr>
                `;
            }).join('');
    
        } catch (error) {
            console.error("Lỗi khi load danh sách lớp:", error);
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

    async openCohortModal(cohortId) {
        const modal = document.getElementById('cohortModal');
        const form = document.getElementById('cohortForm');
        
        if (cohortId) {
            const response = await fetch(`https://localhost:7231/RealAdmins/GetCohortById?id=${cohortId}`);
            const cohortData = await response.json();
            Object.keys(cohortData).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) input.value = cohortData[key];
            });
            form.querySelector('[name="cohortId"]').value = cohortId;
        } else {
            form.reset();
        }
        
        this.openModal('cohortModal');
    }
    
    async saveCohort() {
        const form = document.getElementById('cohortForm');
        const formData = new FormData(form);
        const cohortData = Object.fromEntries(formData.entries());
        
        const params = new URLSearchParams({
            id: cohortData.cohortId || "",
            CName: cohortData.cohortName,
            Description: cohortData.description,
            
        })

        const isUpdating = Boolean(cohortData.cohortId);
        const url = isUpdating
            ? `https://localhost:7231/RealAdmins/UpdateCohort?${params}`
            : `https://localhost:7231/RealAdmins/InsertCohort?${params}`;

        const method = isUpdating ? "PUT" : "POST";
        try{
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error(`Failed to ${isUpdating ? "update" : "create"} cohort`);
            this.closeModal('cohortModal');
            await this.loadCohorts();
        }
        catch (error) {
            console.error(error);
        }
    }

    async deleteCohort(cohortId) {
        if (!confirm('Bạn có chắc chắn muốn xóa lớp học này?')) return;
        
        await fetch(`https://localhost:7231/RealAdmins/DeleteCohort?id=${cohortId}`, { method: 'DELETE' });
        await this.loadCohorts();
    }

    



    async initializeAssignmentManagement() {
        await this.loadAssignments();
        this.setupAssignmentEventListeners();
        await this.loadAssignmentFormData();
    }

    async loadAssignments() {
        try {
            const response = await fetch('https://localhost:7231/RealAdmins/GetAllAssignments');
            const data = await response.json();
            const assignments = data.data || [];

            const tbody = document.querySelector('#assignmentTable tbody');
            tbody.innerHTML = assignments.map(assignment => `
                <tr>
                    <td>${assignment.teacherName}</td>
                    <td>${assignment.subjectName}</td>
                    <td>${assignment.cohortName}</td>
                    <td>${assignment.timeSlot}</td>
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
            `).join('');
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
            const teachersResponse = await fetch('https://localhost:7231/RealAdmins/GetAllTeacher');
            const teachersData = await teachersResponse.json();
            const teachers = teachersData.data || [];
            
            const teacherSelect = document.querySelector('select[name="teacherId"]');
            teacherSelect.innerHTML = teachers.map(teacher => 
                `<option value="${teacher.teacherId}">${teacher.firstName} ${teacher.lastName}</option>`
            ).join('');

            // Load danh sách môn học
            const subjectsResponse = await fetch('https://localhost:7231/RealAdmins/GetAllSubjects');
            const subjectsData = await subjectsResponse.json();
            const subjects = subjectsData.data || [];
            
            const subjectSelect = document.querySelector('select[name="subjectId"]');
            subjectSelect.innerHTML = subjects.map(subject => 
                `<option value="${subject.subjectId}">${subject.subjectName}</option>`
            ).join('');

            // Load danh sách lớp học
            const cohortsResponse = await fetch('https://localhost:7231/RealAdmins/GetAllCohorts');
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
        const modal = document.getElementById('assignmentModal');
        const form = document.getElementById('assignmentForm');
        
        if (assignmentId) {
            const response = await fetch(`https://localhost:7231/RealAdmins/GetAssignmentById?id=${assignmentId}`);
            const assignment = await response.json();
            
            Object.keys(assignment).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) input.value = assignment[key];
            });
        } else {
            form.reset();
        }
        
        this.openModal('assignmentModal');
    }

    async saveAssignment() {
        const form = document.getElementById('assignmentForm');
        const formData = new FormData(form);
        const assignmentData = Object.fromEntries(formData.entries());

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
            ? `https://localhost:7231/RealAdmins/UpdateAssignment?${params}`
            : `https://localhost:7231/RealAdmins/InsertAssignment?${params}`;

        const method = isUpdating ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error(`Failed to ${isUpdating ? "update" : "create"} assignment`);

            this.closeModal('assignmentModal');
            await this.loadAssignments();
        } catch (error) {
            console.error(error);
            alert("Có lỗi xảy ra khi lưu phân công. Vui lòng thử lại.");
        }
    }

    async deleteAssignment(assignmentId) {
        if (!confirm('Bạn có chắc chắn muốn xóa phân công này?')) return;

        try {
            const response = await fetch(`https://localhost:7231/RealAdmins/DeleteAssignment?id=${assignmentId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete assignment');

            await this.loadAssignments();
        } catch (error) {
            console.error("Lỗi khi xóa phân công:", error);
            alert("Không thể xóa phân công. Vui lòng thử lại.");
        }
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
            const studentsResponse = await fetch('https://localhost:7231/RealAdmins/GetAllStudents');
            const studentsData = await studentsResponse.json();
            const students = studentsData.data || [];
            
            const teachersResponse = await fetch('https://localhost:7231/RealAdmins/GetAllTeacher');
            const teachersData = await teachersResponse.json();
            const teachers = teachersData.data || [];

            const cohortsResponse = await fetch('https://localhost:7231/RealAdmins/GetAllCohorts');
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
}

// Initialize dashboard
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
    window.adminDashboard = adminDashboard;
});