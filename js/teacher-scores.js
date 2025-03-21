class TeacherScores {
    constructor() {
        this.apiBaseUrl = 'https://scoreapi-1zqy.onrender.com/ScoreTeachers'; // URL cơ sở API
        
        try {
            console.log('Khởi tạo TeacherScores...');
            
            // Lấy thông tin giáo viên từ session storage
            const teacherData = sessionStorage.getItem('currentUser');
            if (!teacherData) {
                throw new Error('Không tìm thấy thông tin người dùng');
            }
            
            this.teacher = JSON.parse(teacherData);
            console.log('Thông tin giáo viên:', this.teacher.teacherId);
            
            if (!this.teacher.teacherId) {
                throw new Error('Không tìm thấy ID giáo viên');
            }
            
            // Đảm bảo các popup tồn tại
            this.ensurePopupsExist();
            
            // Thiết lập phần lọc và giao diện
            this.setupFilterSection();
            
            // Thiết lập các sự kiện
            this.setupEventListeners();
            this.setupPopupHandlers();
            
            // Tải dữ liệu ban đầu
            this.loadCohorts();
            
            console.log('TeacherScores đã khởi tạo thành công');
        } catch (error) {
            console.error('Lỗi khởi tạo TeacherScores:', error);
            alert('Có lỗi khi khởi tạo trang điểm số: ' + error.message);
        }
    }

    setupEventListeners() {
        console.log('Thiết lập các sự kiện cho trang điểm số giáo viên');
        
        // Lắng nghe sự kiện submit cho form điểm số
        const scoreForm = document.getElementById('scoreForm');
        if (scoreForm) {
            scoreForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveScore();
            });
        } else {
            console.warn('Không tìm thấy scoreForm');
        }
        
        // Lắng nghe sự kiện đóng modal
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        // Lắng nghe sự kiện cho nút thêm điểm mới
        const addScoreBtn = document.getElementById('addScoreBtn');
        if (addScoreBtn) {
            addScoreBtn.addEventListener('click', () => this.openAddScoreModal());
        }
        
        // Lắng nghe sự kiện cho bộ lọc lớp học
        const classFilter = document.getElementById('classFilter');
        if (classFilter) {
            classFilter.addEventListener('change', () => {
                const cohortId = classFilter.value;
                this.filterStudentsByCohort(cohortId);
            });
        }
        
        // Thiết lập sự kiện cho các popup
        this.setupPopupHandlers();
    }

    async loadCohorts() {
        try {
            console.log('Đang tải danh sách lớp học...');
            
            // Tải danh sách lớp học
            const response = await fetch(`${this.apiBaseUrl}/GetAllCohortteachbyateacher?id=${this.teacher.teacherId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const cohorts = await this.safeParseJson(response);
            console.log('Tải được', cohorts.length, 'lớp học');
            
            // Hiển thị danh sách lớp học trong dropdown
            const classFilter = document.getElementById('classFilter');
            if (classFilter) {
                classFilter.innerHTML = `
                    <option value="">Tất cả lớp</option>
                    ${cohorts.map(cohort => `
                        <option value="${cohort.cohortID}">
                            ${cohort.cohortName}
                        </option>
                    `).join('')}
                `;
            } else {
                console.error('Không tìm thấy phần tử lọc lớp học');
            }
            
            // Tải danh sách môn học
            console.log('Đang tải danh sách môn học...');
            const subjectResponse = await fetch(`${this.apiBaseUrl}/GetTeacherAllSubjectsTeach?id=${this.teacher.teacherId}`);
            if (!subjectResponse.ok) {
                throw new Error(`HTTP error! Status: ${subjectResponse.status}`);
            }
            
            const subjects = await this.safeParseJson(subjectResponse);
            console.log('Tải được', subjects.length, 'môn học');
            
            // Hiển thị danh sách môn học trong dropdown lọc và trong form
            const subjectFilter = document.getElementById('subjectFilter');
            if (subjectFilter) {
                subjectFilter.innerHTML = `
                    <option value="">Tất cả môn</option>
                    ${subjects.map(subject => `
                        <option value="${subject.subjectID}">
                            ${subject.subjectName}
                        </option>
                    `).join('')}
                `;
            }
            
            const subjectSelect = document.getElementById('subjectID');
            if (subjectSelect) {
                subjectSelect.innerHTML = `
                    <option value="">Chọn môn học</option>
                    ${subjects.map(subject => `
                        <option value="${subject.subjectID}">
                            ${subject.subjectName}
                        </option>
                    `).join('')}
                `;
            } else {
                console.error('Không tìm thấy phần tử chọn môn học');
            }
            
            // Tải danh sách điểm mặc định (tất cả)
            this.filterStudentsByCohort('');
            
        } catch (error) {
            console.error('Lỗi khi tải danh sách lớp học và môn học:', error);
            this.showNotification('error', 'Lỗi', 'Không thể tải danh sách lớp học: ' + error.message);
        }
    }

    async filterStudentsByCohort(cohortId) {
        try {
            console.log('Lọc học sinh theo lớp ID:', cohortId);
            
            // Hiển thị thông báo đang tải
            const tbody = document.querySelector('#scoreTable tbody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="text-center">
                            <i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...
                        </td>
                    </tr>
                `;
            }
            
            // Tải danh sách điểm
            console.log('Tải điểm số cho giáo viên ID:', this.teacher.teacherId);
            const response = await fetch(`${this.apiBaseUrl}/GetTeacherAllStudentGrades?id=${this.teacher.teacherId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const scores = await this.safeParseJson(response);
            console.log('Số lượng điểm tải được:', scores.length);
            
            // Tải danh sách học sinh
            console.log('Tải danh sách học sinh cho giáo viên ID:', this.teacher.teacherId);
            const studentsResponse = await fetch(`${this.apiBaseUrl}/GetTeacherAllTeachStudentsByCohort?id=${this.teacher.teacherId}`);
            if (!studentsResponse.ok) {
                throw new Error(`HTTP error! Status: ${studentsResponse.status}`);
            }
            
            const students = await this.safeParseJson(studentsResponse);
            console.log('Số lượng học sinh tải được:', students.length);
            
            // Cập nhật dropdown học sinh dựa trên lớp được chọn
            const studentSelect = document.getElementById('studentID');
            if (studentSelect) {
                studentSelect.innerHTML = `
                    <option value="">Tất cả học sinh</option>
                    ${students
                        .filter(s => !cohortId || s.cohortID === cohortId)
                        .map(student => `
                            <option value="${student.studentID}">
                                ${student.studentName}
                            </option>
                        `)
                        .join('')
                    }
                `;
            }
            
            // Kiểm tra và lọc kết quả
            if (!tbody) {
                console.error('Không tìm thấy bảng điểm');
                return;
            }
            
            // Lọc và hiển thị điểm dựa trên lớp học
            const filteredScores = scores.filter(score => {
                const student = students.find(s => s.studentID === score.studentID);
                return student && (!cohortId || student.cohortID === cohortId);
            });
            
            console.log('Số lượng điểm sau khi lọc:', filteredScores.length);
            
            if (filteredScores.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="text-center">
                            Chưa có dữ liệu điểm cho lớp này
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Hiển thị kết quả
            tbody.innerHTML = filteredScores.map(score => {
                const student = students.find(s => s.studentID === score.studentID);
                if (!student) return '';
                
                return `
                    <tr>
                        <td>${student.studentName || 'N/A'}</td>
                        <td>${student.cohortName || 'N/A'}</td>
                        <td>${score.subjectName || 'N/A'}</td>
                        <td>${score.testType || 'N/A'}</td>
                        <td>${score.score || 'N/A'}</td>
                        <td>${score.weight || '0'}%</td>
                        <td>${score.testDate ? new Date(score.testDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                        <td>${score.gradeDate ? new Date(score.gradeDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-edit" data-id="${score.gradeID}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-delete" data-id="${score.gradeID}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
            
            // Thiết lập sự kiện cho các nút
            this.setupTableEventListeners();
            
        } catch (error) {
            console.error('Lỗi khi lọc học sinh theo lớp:', error);
            
            // Hiển thị lỗi trong bảng
            const tbody = document.querySelector('#scoreTable tbody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="text-center">
                            <div class="alert alert-danger">
                                <i class="fas fa-exclamation-triangle"></i> Lỗi khi tải dữ liệu: ${error.message}
                            </div>
                        </td>
                    </tr>
                `;
            }
            
            // Hiển thị thông báo lỗi
            this.showNotification('error', 'Lỗi', 'Không thể tải danh sách học sinh: ' + error.message);
        }
    }

    // Thiết lập sự kiện cho các nút trong bảng
    setupTableEventListeners() {
        // Sử dụng event delegation để xử lý các nút trong bảng
        const scoreTable = document.getElementById('scoreTable');
        if (!scoreTable) return;
        
        // Xóa event listeners cũ (nếu có)
        const newTable = scoreTable.cloneNode(true);
        scoreTable.parentNode.replaceChild(newTable, scoreTable);
        
        // Thêm event listener mới
        newTable.addEventListener('click', (event) => {
            const target = event.target.closest('.btn-edit, .btn-delete');
            if (!target) return;
            
            const gradeId = target.dataset.id;
            if (!gradeId) {
                console.error('Không tìm thấy ID điểm');
                return;
            }
            
            if (target.classList.contains('btn-edit')) {
                console.log('Click vào nút sửa cho điểm ID:', gradeId);
                this.openeditModal(gradeId);
            } else if (target.classList.contains('btn-delete')) {
                console.log('Click vào nút xóa cho điểm ID:', gradeId);
                this.deleteScore(gradeId);
            }
        });
    }

    openAddScoreModal() {
        console.log('Mở modal thêm điểm mới');
        
        const modal = document.getElementById('scoreModal');
        if (!modal) {
            console.error('Không tìm thấy modal điểm số');
            return;
        }
        
        // Đặt tiêu đề
        document.getElementById('modalTitle').textContent = 'Thêm Điểm Mới';
        
        // Reset form
        const form = document.getElementById('scoreForm');
        if (form) {
            form.reset();
            document.getElementById('gradeID').value = '';
            
            // Đặt ngày mặc định là hôm nay
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0];
            
            const testDateInput = document.getElementById('testDate');
            const gradeDateInput = document.getElementById('gradeDate');
            
            if (testDateInput) testDateInput.value = formattedDate;
            if (gradeDateInput) gradeDateInput.value = formattedDate;
        }
        
        // Tải danh sách học sinh
        this.loadAllStudents();
        
        // Hiển thị modal với hiệu ứng
        modal.style.display = 'block';
        
        // Focus vào trường đầu tiên
        setTimeout(() => {
            const firstInput = document.querySelector('#scoreForm select, #scoreForm input');
            if (firstInput) firstInput.focus();
        }, 300);
    }

    async openeditModal(gradeID) {
        try {
            console.log('Đang mở modal chỉnh sửa cho điểm ID:', gradeID);
            const modal = document.getElementById('scoreModal');
            const form = document.getElementById('scoreForm');
            
            if (!modal || !form) {
                console.error('Không tìm thấy modal hoặc form');
                return;
            }

            if (gradeID) {
                document.getElementById('modalTitle').textContent = 'Chỉnh Sửa Điểm';
                
                // Kiểm tra một số đường dẫn API khác nhau
                const apiPaths = [
                    `/GetAOneStudentGradeByTeacher?gradeID=${gradeID}`,
                    `/GetTeacherStudentGrade?gradeID=${gradeID}`,
                    `/GetStudentGradeByID?gradeID=${gradeID}`
                ];
                
                let scoreData = null;
                let successResponse = false;
                
                // Thử từng đường dẫn cho đến khi thành công
                for (const path of apiPaths) {
                    try {
                        const url = `${this.apiBaseUrl}${path}`;
                        console.log('Thử gửi yêu cầu tới API:', url);
                        
                        const response = await fetch(url);
                        if (response.ok) {
                            console.log('Nhận phản hồi thành công từ API:', url);
                            scoreData = await this.safeParseJson(response);
                            successResponse = true;
                            break;
                        }
                    } catch (err) {
                        console.warn(`Không thể tải dữ liệu từ ${path}:`, err);
                    }
                }
                
                if (!successResponse) {
                    // Nếu không tìm thấy dữ liệu từ API, hiển thị modal với thông báo lỗi
                    this.showNotification('error', 'Lỗi', 'Không thể tải thông tin điểm. Vui lòng thử lại sau.');
                    return;
                }
                
                console.log('Dữ liệu điểm:', scoreData);
                
                // Kiểm tra dữ liệu trước khi điền vào form
                if (!scoreData || Object.keys(scoreData).length === 0) {
                    this.showNotification('error', 'Lỗi', 'Không thể tải thông tin điểm. Dữ liệu không hợp lệ.');
                    return;
                }
                
                // Điền dữ liệu vào form
                // Sử dụng || '' để tránh giá trị null/undefined
                document.getElementById('gradeID').value = scoreData.gradeID || '';
                document.getElementById('studentID').value = scoreData.studentID || '';
                document.getElementById('subjectID').value = scoreData.subjectID || '';
                document.getElementById('testType').value = scoreData.testType || '';
                document.getElementById('score').value = scoreData.score || '';
                document.getElementById('weight').value = scoreData.weight || '';
                
                // Format dates if they exist
                if (scoreData.testDate) {
                    try {
                        const testDate = new Date(scoreData.testDate);
                        document.getElementById('testDate').value = testDate.toISOString().split('T')[0];
                    } catch (err) {
                        console.warn('Lỗi khi định dạng ngày kiểm tra:', err);
                        document.getElementById('testDate').value = '';
                    }
                }
                
                if (scoreData.gradeDate) {
                    try {
                        const gradeDate = new Date(scoreData.gradeDate);
                        document.getElementById('gradeDate').value = gradeDate.toISOString().split('T')[0];
                    } catch (err) {
                        console.warn('Lỗi khi định dạng ngày chấm điểm:', err);
                        document.getElementById('gradeDate').value = '';
                    }
                }
            } else {
                document.getElementById('modalTitle').textContent = 'Thêm Điểm Mới';
                form.reset();
            }
            
            modal.style.display = 'block';
        } catch (error) {
            console.error('Lỗi khi mở modal chỉnh sửa:', error);
            this.showNotification('error', 'Lỗi', 'Không thể mở form chỉnh sửa: ' + error.message);
        }
    }

    async saveScore() {
        try {
            console.log('Bắt đầu lưu điểm...');
            const modal = document.getElementById('scoreModal');
            const form = document.getElementById('scoreForm');
            
            if (!modal || !form) {
                console.error('Không tìm thấy modal hoặc form');
                return;
            }
            
            // Lấy dữ liệu từ form
            const formData = new FormData(form);
            const isNewGrade = !formData.get('gradeID');
            
            // Chuyển FormData thành JSON
            const scoreData = {};
            formData.forEach((value, key) => {
                scoreData[key] = value;
            });
            
            console.log('Dữ liệu điểm cần lưu:', scoreData);
            
            // Thực hiện gửi API request
            const url = isNewGrade
                ? `${this.apiBaseUrl}/PostAStudentGradeByTeacher`
                : `${this.apiBaseUrl}/UpdateAStudentGradeByTeacher`;
            
            console.log('Gửi yêu cầu tới API:', url);
            
            const response = await fetch(url, {
                method: isNewGrade ? 'POST' : 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(scoreData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            console.log('Nhận phản hồi từ API');
            const result = await this.safeParseJson(response);
            console.log('Kết quả lưu điểm:', result);
            
            // Đóng modal và hiện thông báo
            modal.style.display = 'none';
            
            // Hiển thị thông báo thành công
            this.showNotification(
                'success',
                isNewGrade ? 'Thêm điểm thành công' : 'Cập nhật điểm thành công',
                isNewGrade ? 'Đã thêm mới điểm thành công.' : 'Đã cập nhật điểm thành công.',
                () => {
                    // Tải lại danh sách điểm
                    const cohortId = document.getElementById('classFilter').value;
                    this.filterStudentsByCohort(cohortId);
                }
            );
        } catch (error) {
            console.error('Lỗi khi lưu điểm:', error);
            this.showNotification(
                'error',
                'Lỗi xảy ra',
                'Không thể lưu điểm: ' + error.message,
                null
            );
        }
    }
    

    async deleteScore(gradeID) {
        try {
            console.log('Yêu cầu xóa điểm ID:', gradeID);
            
            // Hiển thị xác nhận trước khi xóa
            this.showConfirmation(
                'Xác nhận xóa',
                'Bạn có chắc chắn muốn xóa điểm này? Hành động này không thể hoàn tác.',
                async () => {
                    try {
                        console.log('Xác nhận xóa điểm ID:', gradeID);
                        const url = `${this.apiBaseUrl}/DeleteTeacherStudentGrade?gradeID=${gradeID}`;
                        console.log('Gửi yêu cầu tới API:', url);
                        
                        const response = await fetch(url, {
                            method: 'DELETE'
                        });
                        
                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }
                        
                        console.log('Nhận phản hồi từ API');
                        const result = await this.safeParseJson(response);
                        console.log('Kết quả xóa điểm:', result);
                        
                        // Hiển thị thông báo thành công
                        this.showNotification(
                            'success',
                            'Xóa điểm thành công',
                            'Đã xóa điểm thành công.',
                            () => {
                                // Tải lại danh sách điểm
                                const cohortId = document.getElementById('classFilter').value;
                                this.filterStudentsByCohort(cohortId);
                            }
                        );
                    } catch (error) {
                        console.error('Lỗi khi xóa điểm:', error);
                        this.showNotification(
                            'error',
                            'Lỗi xảy ra',
                            'Không thể xóa điểm: ' + error.message,
                            null
                        );
                    }
                }
            );
        } catch (error) {
            console.error('Lỗi khi hiển thị xác nhận xóa:', error);
            if (window.confirm('Bạn có chắc chắn muốn xóa điểm này? Hành động này không thể hoàn tác.')) {
                try {
                    const response = await fetch(`${this.apiBaseUrl}/DeleteAStudentGradeByTeacher?gradeID=${gradeID}`, {
                        method: 'DELETE'
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    
                    alert('Xóa điểm thành công');
                    const cohortId = document.getElementById('classFilter').value;
                    this.filterStudentsByCohort(cohortId);
                } catch (error) {
                    console.error('Lỗi khi xóa điểm:', error);
                    alert('Không thể xóa điểm: ' + error.message);
                }
            }
        }
    }

    closeModal() {
        document.getElementById('scoreModal').style.display = 'none';
    }

    validateScore(score) {
        return score >= 0 && score <= 10;
    }

    // Phương thức mới để tải tất cả học sinh
    async loadAllStudents() {
        try {
            console.log('Đang tải danh sách tất cả học sinh...');
            
            // Hiển thị thông báo đang tải trong dropdown
            const studentSelect = document.getElementById('studentID');
            if (studentSelect) {
                studentSelect.innerHTML = '<option value="">Đang tải...</option>';
                studentSelect.disabled = true;
            }
            
            // Gọi API để lấy danh sách học sinh
            const response = await fetch(`${this.apiBaseUrl}/GetTeacherAllTeachStudentsByCohort?id=${this.teacher.teacherId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const students = await this.safeParseJson(response);
            console.log(`Đã tải được ${students.length} học sinh`);
            
            // Cập nhật dropdown học sinh
            if (studentSelect) {
                studentSelect.innerHTML = `
                    <option value="">Chọn học sinh</option>
                    ${students.map(student => `
                        <option value="${student.studentID}" data-cohort="${student.cohortID}">
                            ${student.studentName} - ${student.cohortName || 'Không có lớp'}
                        </option>
                    `).join('')}
                `;
                studentSelect.disabled = false;
            } else {
                console.error('Không tìm thấy phần tử select học sinh');
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách học sinh:', error);
            
            // Cập nhật dropdown với thông báo lỗi
            const studentSelect = document.getElementById('studentID');
            if (studentSelect) {
                studentSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
                studentSelect.disabled = false;
            }
            
            // Hiển thị thông báo lỗi
            this.showNotification('error', 'Lỗi', 'Không thể tải danh sách học sinh: ' + error.message);
        }
    }

    // Xử lý an toàn khi parse JSON
    async safeParseJson(response) {
        try {
            const text = await response.text();
            if (!text || text.trim() === '') {
                console.warn('API trả về chuỗi rỗng');
                return {};
            }
            return JSON.parse(text);
        } catch (error) {
            console.error('Lỗi khi parse JSON:', error);
            throw new Error('Dữ liệu không hợp lệ từ máy chủ');
        }
    }

    // Hiển thị popup xác nhận
    showConfirmation(title, message, onConfirm) {
        console.log('showConfirmation called:', title, message);
        
        const confirmationPopup = document.getElementById('confirmationPopup');
        const confirmTitle = document.getElementById('confirmTitle');
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmButton = document.getElementById('confirmButton');
        const cancelButton = document.getElementById('cancelButton');
        
        // Kiểm tra xem các phần tử có tồn tại
        if (!confirmationPopup || !confirmTitle || !confirmMessage || !confirmButton) {
            console.error('Không tìm thấy các phần tử popup xác nhận');
            
            // Nếu không tìm thấy popup, dùng confirm thông thường
            if (window.confirm(message)) {
                if (typeof onConfirm === 'function') {
                    onConfirm();
                }
            }
            return;
        }
        
        // Cập nhật nội dung
        confirmTitle.textContent = title || 'Xác nhận thao tác';
        confirmMessage.textContent = message || 'Bạn có chắc chắn muốn thực hiện thao tác này?';
        
        // Xóa sự kiện click cũ
        const newConfirmButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
        
        // Thêm sự kiện click mới
        newConfirmButton.addEventListener('click', () => {
            console.log('Confirm button clicked');
            this.hideConfirmation();
            if (typeof onConfirm === 'function') {
                onConfirm();
            }
        });
        
        // Xử lý sự kiện hủy
        if (cancelButton) {
            const newCancelButton = cancelButton.cloneNode(true);
            cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
            
            newCancelButton.addEventListener('click', () => {
                console.log('Cancel button clicked');
                this.hideConfirmation();
            });
        }
        
        // Hiển thị popup
        confirmationPopup.classList.add('active');
    }

    // Ẩn popup xác nhận
    hideConfirmation() {
        console.log('hideConfirmation called');
        const confirmationPopup = document.getElementById('confirmationPopup');
        if (confirmationPopup) {
            confirmationPopup.classList.remove('active');
        } else {
            console.error('Không tìm thấy phần tử confirmationPopup');
        }
    }

    // Hiển thị popup thông báo
    showNotification(type, title, message, callback) {
        console.log('showNotification called:', type, title, message);
        
        const notificationPopup = document.getElementById('notificationPopup');
        const notificationTitle = document.getElementById('notificationTitle');
        const notificationMessage = document.getElementById('notificationMessage');
        const notificationIcon = document.getElementById('notificationIcon');
        const okButton = document.getElementById('okButton');
        
        // Kiểm tra xem các phần tử có tồn tại
        if (!notificationPopup || !notificationTitle || !notificationMessage || !notificationIcon || !okButton) {
            console.error('Không tìm thấy các phần tử popup thông báo');
            alert(message);
            if (typeof callback === 'function') {
                callback();
            }
            return;
        }
        
        // Cập nhật nội dung
        notificationTitle.textContent = title || 'Thông báo';
        notificationMessage.textContent = message || 'Thao tác đã hoàn tất.';
        
        // Cập nhật icon dựa vào loại thông báo
        notificationIcon.className = 'popup-icon';
        if (type === 'success') {
            notificationIcon.classList.add('success');
            notificationIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
        } else if (type === 'error') {
            notificationIcon.classList.add('danger');
            notificationIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
        } else if (type === 'warning') {
            notificationIcon.classList.add('warning');
            notificationIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        } else {
            notificationIcon.classList.add('info');
            notificationIcon.innerHTML = '<i class="fas fa-info-circle"></i>';
        }
        
        // Xóa sự kiện click cũ
        const newOkButton = okButton.cloneNode(true);
        okButton.parentNode.replaceChild(newOkButton, okButton);
        
        // Thêm sự kiện click mới
        newOkButton.addEventListener('click', () => {
            console.log('OK button clicked');
            this.hideNotification();
            if (typeof callback === 'function') {
                callback();
            }
        });
        
        // Hiển thị popup
        notificationPopup.classList.add('active');
    }

    // Ẩn popup thông báo
    hideNotification() {
        console.log('hideNotification called');
        const notificationPopup = document.getElementById('notificationPopup');
        if (notificationPopup) {
            notificationPopup.classList.remove('active');
        } else {
            console.error('Không tìm thấy phần tử notificationPopup');
        }
    }

    // Thiết lập sự kiện cho popups
    setupPopupHandlers() {
        // Sự kiện cho nút OK trên popup thông báo
        const okButton = document.getElementById('okButton');
        if (okButton) {
            okButton.addEventListener('click', () => {
                this.hideNotification();
            });
        }
        
        // Sự kiện cho nút Hủy trên popup xác nhận
        const cancelButton = document.getElementById('cancelButton');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                this.hideConfirmation();
            });
        }
        
        // Sự kiện cho nút đóng trên popup
        document.querySelectorAll('.popup-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.hideConfirmation();
                this.hideNotification();
            });
        });
    }

    // Đảm bảo popups tồn tại trong DOM
    ensurePopupsExist() {
        console.log('Checking if popups exist...');
        
        // Kiểm tra popup xác nhận
        if (!document.getElementById('confirmationPopup')) {
            console.log('Adding confirmation popup to the DOM');
            const confirmationHTML = `
                <div id="confirmationPopup" class="popup-overlay">
                    <div class="popup-container">
                        <div class="popup-header">
                            <h3 id="confirmTitle" class="popup-title">Xác nhận thao tác</h3>
                            <button class="popup-close">&times;</button>
                        </div>
                        <div class="popup-content">
                            <div class="popup-icon warning">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <p id="confirmMessage" class="popup-message">Bạn có chắc chắn muốn thực hiện thao tác này?</p>
                            <div class="popup-actions">
                                <button id="cancelButton" class="popup-btn popup-btn-secondary">Hủy bỏ</button>
                                <button id="confirmButton" class="popup-btn popup-btn-danger">Xác nhận</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', confirmationHTML);
            
            // Thêm sự kiện cho nút đóng popup
            const closeBtn = document.querySelector('#confirmationPopup .popup-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.hideConfirmation();
                });
            }
        }
        
        // Kiểm tra popup thông báo
        if (!document.getElementById('notificationPopup')) {
            console.log('Adding notification popup to the DOM');
            const notificationHTML = `
                <div id="notificationPopup" class="popup-overlay">
                    <div class="popup-container">
                        <div class="popup-header">
                            <h3 id="notificationTitle" class="popup-title">Thông báo</h3>
                            <button class="popup-close">&times;</button>
                        </div>
                        <div class="popup-content">
                            <div class="popup-icon success" id="notificationIcon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <p id="notificationMessage" class="popup-message">Thao tác đã hoàn tất.</p>
                            <div class="popup-actions">
                                <button id="okButton" class="popup-btn popup-btn-primary">OK</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', notificationHTML);
            
            // Thêm sự kiện cho nút đóng popup
            const closeBtn = document.querySelector('#notificationPopup .popup-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.hideNotification();
                });
            }
        }
        
        // Kiểm tra và tạo modal điểm số nếu chưa tồn tại
        if (!document.getElementById('scoreModal')) {
            console.log('Adding score modal to the DOM');
            const modalHTML = `
                <div id="scoreModal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="modalTitle">Thêm Điểm Mới</h3>
                            <button class="close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <form id="scoreForm">
                                <input type="hidden" id="gradeID" name="gradeID">
                                
                                <div class="form-group">
                                    <label for="studentID">Học sinh</label>
                                    <select id="studentID" name="studentID" required>
                                        <option value="">Chọn học sinh</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="subjectID">Môn học</label>
                                    <select id="subjectID" name="subjectID" required>
                                        <option value="">Chọn môn học</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="testType">Loại điểm</label>
                                    <select id="testType" name="testType" required>
                                        <option value="">Chọn loại điểm</option>
                                        <option value="Miệng">Miệng</option>
                                        <option value="15 phút">15 phút</option>
                                        <option value="1 tiết">1 tiết</option>
                                        <option value="Giữa kỳ">Giữa kỳ</option>
                                        <option value="Cuối kỳ">Cuối kỳ</option>
                                    </select>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="score">Điểm số</label>
                                        <input type="number" id="score" name="score" min="0" max="10" step="0.1" required>
                                        <div class="input-hint">Nhập điểm từ 0-10</div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="weight">Trọng số (%)</label>
                                        <input type="number" id="weight" name="weight" min="0" max="100" required>
                                        <div class="input-hint">Nhập trọng số từ 0-100</div>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="testDate">Ngày kiểm tra</label>
                                        <input type="date" id="testDate" name="testDate" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="gradeDate">Ngày chấm điểm</label>
                                        <input type="date" id="gradeDate" name="gradeDate" required>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary close-btn">Hủy</button>
                            <button type="submit" form="scoreForm" class="btn btn-primary">Lưu điểm</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Thêm sự kiện cho nút đóng modal
            const closeBtn = document.querySelector('#scoreModal .close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeModal();
                });
            }
            
            // Thêm sự kiện cho nút hủy
            const cancelBtn = document.querySelector('#scoreModal .close-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.closeModal();
                });
            }
        }
    }

    // Thiết lập HTML cho phần lọc
    setupFilterSection() {
        console.log('Thiết lập phần lọc');
        
        // Kiểm tra xem phần tử container đã tồn tại chưa
        const actionsContainer = document.querySelector('.score-actions');
        if (!actionsContainer) {
            console.error('Không tìm thấy phần tử .score-actions');
            return;
        }
        
        // Cập nhật HTML cho phần lọc
        actionsContainer.innerHTML = `
            <div class="filter-section">
                <div class="filter-item">
                    <label for="classFilter">Lớp học</label>
                    <select id="classFilter" class="filter-select">
                        <option value="">Tất cả lớp</option>
                    </select>
                </div>
                
                <div class="filter-item">
                    <label for="subjectFilter">Môn học</label>
                    <select id="subjectFilter" class="filter-select">
                        <option value="">Tất cả môn</option>
                    </select>
                </div>
                
                <div class="filter-item">
                    <label>&nbsp;</label>
                    <button id="addScoreBtn" class="btn-add">
                        <i class="fas fa-plus"></i> Thêm điểm mới
                    </button>
                </div>
            </div>
        `;
        
        // Gắn lại sự kiện
        const addScoreBtn = document.getElementById('addScoreBtn');
        if (addScoreBtn) {
            addScoreBtn.addEventListener('click', () => this.openAddScoreModal());
        }
        
        const classFilter = document.getElementById('classFilter');
        if (classFilter) {
            classFilter.addEventListener('change', () => {
                const cohortId = classFilter.value;
                this.filterStudentsByCohort(cohortId);
            });
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const teacherScoresInstance = new TeacherScores();
    window.TeacherScores = teacherScoresInstance;
});
