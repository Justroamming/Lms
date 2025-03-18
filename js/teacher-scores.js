class TeacherScores {
    constructor() {
        this.apiBaseUrl = 'https://localhost:7231'; // Replace with your API base URL
        this.setupEventListeners();
        this.loadStudentsForScoring();
        this.loadScores();
        this.initSubjects();
    }

    setupEventListeners() {
        document.getElementById('classFilter')?.addEventListener('change', () => {
            this.loadStudentsForScoring();
        });

        document.getElementById('scoreForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveScore();
        });

        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
    }

    // Danh sách môn học
    initSubjects() {
        const subjects = [
            'Toán học', 'Ngữ văn', 'Tiếng Anh', 'Vật lý', 'Hóa học', 
            'Sinh học', 'Lịch sử', 'Địa lý', 'GDCD', 'Tin học', 'Công nghệ'
        ];
        
        const subjectSelect = document.getElementById('subject');
        if (subjectSelect) {
            subjectSelect.innerHTML = `
                <option value="">Chọn môn học</option>
                ${subjects.map(subject => `<option value="${subject}">${subject}</option>`).join('')}
            `;
        }
    }


    async loadStudentsForScoring() {
        try {
            let students;
            try {
                const response = await fetch(`${this.apiBaseUrl}/students`);
                students = await response.json();
            } catch (error) {
                console.warn('Không thể kết nối đến API, sử dụng dữ liệu mẫu:', error);
                students = this.getMockStudents();
            }

            const classFilter = document.getElementById('classFilter')?.value;

            const filteredStudents = classFilter 
                ? students.filter(student => student.class === classFilter)
                : students;

            const studentSelect = document.getElementById('studentSelect');
            if (studentSelect) {
                studentSelect.innerHTML = `
                    <option value="">Chọn học sinh</option>
                    ${filteredStudents.map(student => `
                        <option value="${student.studentId}">
                            ${student.studentId} - ${student.fullName} - ${student.class}
                        </option>
                    `).join('')}
                `;
            }
            
            // Cập nhật danh sách lớp học cho bộ lọc
            const classFilter_el = document.getElementById('classFilter');
            if (classFilter_el) {
                const classes = [...new Set(students.map(student => student.class))];
                classFilter_el.innerHTML = `
                    <option value="">Tất cả lớp</option>
                    ${classes.map(cls => `<option value="${cls}">${cls}</option>`).join('')}
                `;
            }
        } catch (error) {
            console.error('Error loading students:', error);
        }
    }

    async loadScores() {
        try {
            let scores;
            let students;
            
            try {
                const response = await fetch(`${this.apiBaseUrl}/scores`);
                scores = await response.json();
                const studentsResponse = await fetch(`${this.apiBaseUrl}/students`);
                students = await studentsResponse.json();
            } catch (error) {
                console.warn('Không thể kết nối đến API, sử dụng dữ liệu mẫu:', error);
                scores = this.getMockScores();
                students = this.getMockStudents();
            }
            
            const tbody = document.querySelector('#scoreTable tbody');
            if (!tbody) return;

            const sortedScores = scores.sort((a, b) => new Date(b.date) - new Date(a.date));

            tbody.innerHTML = sortedScores.map(score => {
                const student = students.find(s => s.studentId === score.studentId);
                if (!student) return ''; 

                return `
                    <tr>
                        <td>${student.studentId}</td>
                        <td>${student.fullName}</td>
                        <td>${student.class}</td>
                        <td>${score.subject}</td>
                        <td>${score.type}</td>
                        <td>${score.score}</td>
                        <td>${new Date(score.date).toLocaleDateString('vi-VN')}</td>
                        <td>
                            <button class="btn btn-edit" onclick="scoreManager.editScore('${score.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-delete" onclick="scoreManager.deleteScore('${score.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading scores:', error);
        }
    }

    async saveScore() {
        const scoreId = document.getElementById('scoreId')?.value || Date.now().toString();
        const studentId = document.getElementById('studentSelect').value;
        const scoreValue = parseFloat(document.getElementById('scoreValue').value);

        try {
            let student;
            
            try {
                const studentsResponse = await fetch(`${this.apiBaseUrl}/students`);
                const students = await studentsResponse.json();
                student = students.find(s => s.studentId === studentId);
            } catch (error) {
                console.warn('Không thể kết nối đến API, sử dụng dữ liệu mẫu:', error);
                const mockStudents = this.getMockStudents();
                student = mockStudents.find(s => s.studentId === studentId);
            }
            
            if (!student) {
                alert('Học sinh không tồn tại!');
                return;
            }

            if (scoreValue < 0 || scoreValue > 10) {
                alert('Điểm số phải từ 0 đến 10!');
                return;
            }

            const scoreData = {
                id: scoreId,
                studentId: studentId,
                studentName: student.fullName,
                class: student.class,
                subject: document.getElementById('subject').value,
                type: document.getElementById('scoreType').value,
                score: scoreValue,
                date: document.getElementById('scoreDate').value
            };

            try {
                const method = scoreId ? 'PUT' : 'POST';
                const url = scoreId ? `${this.apiBaseUrl}/scores/${scoreId}` : `${this.apiBaseUrl}/scores`;

                await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(scoreData)
                });
            } catch (error) {
                console.warn('Không thể kết nối đến API để lưu điểm, chỉ cập nhật giao diện:', error);
                // Hiển thị thông báo cho người dùng
                alert('Không thể kết nối đến máy chủ. Dữ liệu sẽ được lưu tạm thời và sẽ mất khi làm mới trang.');
            }

            this.closeModal();
            this.loadScores();

            if (window.navigationInstance) {
                window.navigationInstance.refreshAllPages();
            }
        } catch (error) {
            console.error('Error saving score:', error);
        }
    }

    async deleteScore(scoreId) {
        if (!confirm('Bạn có chắc chắn muốn xóa điểm này?')) return;

        try {
            try {
                await fetch(`${this.apiBaseUrl}/scores/${scoreId}`, {
                    method: 'DELETE'
                });
            } catch (error) {
                console.warn('Không thể kết nối đến API để xóa điểm, chỉ cập nhật giao diện:', error);
                // Hiển thị thông báo cho người dùng
                alert('Không thể kết nối đến máy chủ. Dữ liệu sẽ được xóa tạm thời và sẽ xuất hiện lại khi làm mới trang.');
            }

            this.loadScores();
            
            if (window.navigationInstance) {
                window.navigationInstance.refreshAllPages();
            }
        } catch (error) {
            console.error('Error deleting score:', error);
        }
    }

    openAddScoreModal() {
        const modal = document.getElementById('scoreModal');
        if (modal) {
            document.getElementById('modalTitle').textContent = 'Thêm Điểm Mới';
            document.getElementById('scoreId').value = '';
            document.getElementById('scoreForm').reset();
            document.getElementById('scoreDate').valueAsDate = new Date();
            modal.style.display = 'block';
        }
    }

    async editScore(scoreId) {
        try {
            let scores;
            let students;
            
            try {
                const response = await fetch(`${this.apiBaseUrl}/scores`);
                scores = await response.json();
                const studentsResponse = await fetch(`${this.apiBaseUrl}/students`);
                students = await studentsResponse.json();
            } catch (error) {
                console.warn('Không thể kết nối đến API, sử dụng dữ liệu mẫu:', error);
                scores = this.getMockScores();
                students = this.getMockStudents();
            }
            
            const score = scores.find(s => s.id == scoreId);
            if (!score) {
                alert('Không tìm thấy điểm cần sửa!');
                return;
            }
            
            const modal = document.getElementById('scoreModal');
            if (!modal) return;
            
            // Cập nhật tiêu đề modal
            document.getElementById('modalTitle').textContent = 'Sửa Điểm';
            
            // Điền dữ liệu vào form
            document.getElementById('scoreId').value = score.id;
            
            // Đảm bảo danh sách học sinh đã được tải
            await this.loadStudentsForScoring();
            
            // Chọn học sinh
            const studentSelect = document.getElementById('studentSelect');
            if (studentSelect) {
                studentSelect.value = score.studentId;
            }
            
            // Chọn môn học
            const subjectSelect = document.getElementById('subject');
            if (subjectSelect) {
                subjectSelect.value = score.subject;
            }
            
            // Chọn loại điểm
            const scoreTypeSelect = document.getElementById('scoreType');
            if (scoreTypeSelect) {
                scoreTypeSelect.value = score.type;
            }
            
            // Điền điểm số
            document.getElementById('scoreValue').value = score.score;
            
            // Điền ngày
            document.getElementById('scoreDate').value = score.date;
            
            // Hiển thị modal
            modal.style.display = 'block';
        } catch (error) {
            console.error('Error editing score:', error);
        }
    }

    closeModal() {
        const modal = document.getElementById('scoreModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    validateScore(score) {
        return score >= 0 && score <= 10;
    }
}

// Khởi tạo đối tượng scoreManager toàn cục
let scoreManager;

document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo đúng cách
    scoreManager = new TeacherScores();
    window.scoreManager = scoreManager;
});
