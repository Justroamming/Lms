class TeacherScores {
    constructor() {
        this.apiBaseUrl = 'https://scoreapi-1zqy.onrender.com'; // Replace with your API base URL
        this.setupEventListeners();
        this.loadStudentsForScoring();
        this.loadScores();
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

    async loadStudentsForScoring() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/students`);
            const students = await response.json();
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
        } catch (error) {
            console.error('Error loading students:', error);
        }
    }

    async loadScores() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/scores`);
            const scores = await response.json();
            const studentsResponse = await fetch(`${this.apiBaseUrl}/students`);
            const students = await studentsResponse.json();
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
            const studentsResponse = await fetch(`${this.apiBaseUrl}/students`);
            const students = await studentsResponse.json();
            const student = students.find(s => s.studentId === studentId);
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

            const method = scoreId ? 'PUT' : 'POST';
            const url = scoreId ? `${this.apiBaseUrl}/scores/${scoreId}` : `${this.apiBaseUrl}/scores`;

            await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(scoreData)
            });

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
            await fetch(`${this.apiBaseUrl}/scores/${scoreId}`, {
                method: 'DELETE'
            });

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

    editScore(scoreId) {
        // Implement edit score functionality
        console.log('Edit score:', scoreId);
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
