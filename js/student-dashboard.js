class StudentDashboard {
     constructor() {
        this.student = null; // Lưu thông tin học sinh
        this.fetchStudentData();
    }

    async fetchStudentData() {
        try {
            const currentUser = sessionStorage.getItem('currentUser');
            const studentId = currentUser ? JSON.parse(currentUser).studentId : null;
            if (!studentId) throw new Error('Không tìm thấy ID học sinh');

            const response = await fetch(`https://localhost:7231/DashboardStudents/GetStudentById?id=${studentId}`);
            if (!response.ok) throw new Error('Lỗi khi lấy dữ liệu học sinh');

            const result = await response.json();
            this.student = result.data; 

            if (!this.student) throw new Error('Dữ liệu học sinh rỗng');

            this.init();
        } catch (error) {
            console.error('Không tìm thấy thông tin học sinh:', error);
        }
    }

    async init() {
        this.loadStudentInfo();
        this.loadDashboardStats();
        this.loadRecentScores();
        this.loadUpcomingExams();
     //   this.loadSubjectProgress();
        this.updateDateTime();
    }

    async loadStudentInfo() {
        const welcomeName = document.getElementById('studentNameWelcome');
        if (welcomeName && this.student) {
            welcomeName.textContent = `${this.student.lastName} ${this.student.firstName}`;
        }
    }

    async updateDateTime() {
        const dateTimeElement = document.getElementById('currentDateTime');
        if (dateTimeElement) {
            const now = new Date();
            dateTimeElement.textContent = now.toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    async  loadDashboardStats() {
        if (!this.student) {
            console.error('Không có thông tin học sinh');
            return;
        }
    
        try {
            // Fetch overall stats
            const response = await fetch(`https://localhost:7231/DashboardStudents/GetStudentOverallAverageScore?id=${this.student.studentId}`);
            if (!response.ok) throw new Error('Lỗi khi tải thống kê');
    
            const statsArray = await response.json();
    
            if (!Array.isArray(statsArray) || statsArray.length === 0) {
                console.error('Dữ liệu thống kê không hợp lệ');
                return;
            }
    
            const stats = statsArray[0];
    
            document.getElementById('averageScore').textContent =
                stats.overallAverageScore ? parseFloat(stats.overallAverageScore).toFixed(2) : '0.00';
    
            // Fetch future test dates
            const testResponse = await fetch(`https://localhost:7231/DashboardStudents/GetFutureTestsOfAStudent?id=${this.student.studentId}`);
            if (!testResponse.ok) throw new Error('Lỗi khi tải ngày kiểm tra');
    
            const tests = await testResponse.json();
    
            console.log("Fetched test dates:", tests); // Debugging line
    
            let daysToExam = 'N/A';
            if (Array.isArray(tests) && tests.length > 0) {
                // Ensure testDate is correctly accessed
                tests.forEach(test => console.log("Raw test date:", test.testDate)); // Debugging line
    
                // Sort tests by date (nearest first)
                tests.sort((a, b) => new Date(a.testDate) - new Date(b.testDate));
    
                const nearestTestDate = new Date(tests[0].testDate);
                console.log("Nearest test date:", nearestTestDate.toISOString()); // Debugging line
    
                // Get today's date (UTC)
                const today = new Date();
                today.setUTCHours(0, 0, 0, 0);
                console.log("Today's date (UTC):", today.toISOString()); // Debugging line
    
                // Calculate remaining days
                const remainingDays = Math.ceil((nearestTestDate - today) / (1000 * 60 * 60 * 24));
                console.log("Remaining days:", remainingDays); // Debugging line
    
                // Only show if days are positive
                daysToExam = remainingDays >= 0 ? remainingDays : 'N/A';
            }
    
            document.getElementById('daysToExam').textContent = daysToExam;
    
        } catch (error) {
            console.error('Lỗi khi tải thống kê:', error);
        }
    }
    
    
    
    

    async loadRecentScores() {
        if (!this.student) {
            console.error('Không có thông tin học sinh');
            return;
        }

        try {
            const response = await fetch(`https://localhost:7231/DashboardStudents/GetAllGradesOfAStudent?id=${this.student.studentId}`);
            if (!response.ok) throw new Error('Lỗi khi tải điểm số');

            const scores = await response.json();
            const tableBody = document.getElementById('recentScoresTable');

            tableBody.innerHTML = scores
                .sort((a, b) => new Date(b.gradeDate) - new Date(a.gradeDate))
                .slice(0, 5)
                .map(score => `
                    <tr>
                        <td>${score.subjectName}</td>
                        <td>${score.testType}</td>
                        <td>${score.score}</td>
                        <td>${new Date(score.gradeDate).toLocaleDateString('vi-VN')}</td>
                         <td>${this.getScoreEvaluation(score.score)}</td>
                    </tr>
                `).join('');
        } catch (error) {
            console.error('Lỗi khi tải điểm số gần đây:', error);
        }
    }

    getScoreEvaluation(score) {
        if (score >= 8.0) return '<span class="badge success">Tốt</span>';
        if (score >= 4.0) return '<span class="badge warning">Đạt</span>';
        
        return '<span class="badge danger">Chưa đạt</span>';
    }

    async loadUpcomingExams() {
        try {
            const response = await fetch(`https://localhost:7231/DashboardStudents/GetFutureTestsOfAStudent?id=${this.student.studentId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch upcoming exams');
            }
            const exams = await response.json();
            const examsList = document.getElementById('upcomingExams');
            
            if (examsList) {
                examsList.innerHTML = exams.map(exam => {
                    const testDate = new Date(exam.testDate);
                    const today = new Date();
                    const remainingDays = Math.ceil((testDate - today) / (1000 * 60 * 60 * 24));

                    return `
                        <div class="event-item">
                            <div class="event-date">
                                <div class="day">${testDate.getDate()}</div>
                                <div class="month">${testDate.toLocaleDateString('vi-VN', { month: 'short' })}</div>
                            </div>
                            <div class="event-info">
                                <h4>${exam.subjectName}</h4>
                                <p>Còn ${remainingDays} ngày đến lúc kiểm tra </p>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        } catch (error) {
            console.error('Lỗi khi tải kỳ thi sắp tới:', error);
        }
    }

   /* async loadSubjectProgress() {
        try {
            const response = await fetch(`/api/student/${this.student.studentId}/progress`);
            if (!response.ok) {
                throw new Error('Failed to fetch subject progress');
            }
            const progress = await response.json();
            
            const progressGrid = document.getElementById('subjectProgress');
            if (!progressGrid) return;

            progressGrid.innerHTML = progress.map(subject => `
                <div class="progress-item">
                    <div class="subject-info">
                        <h4>${subject.subject}</h4>
                        <span class="progress-text">${subject.completed}/${subject.total} cột điểm</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${subject.percentage}%"></div>
                    </div>
                    <div class="subject-average">
                        TB: <span class="${subject.average >= 5 ? 'pass' : 'fail'}">${subject.average}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Lỗi khi tải tiến độ môn học:', error);
        }
    }*/

    getScoreRating(score) {
        if (score >= 8.5) return 'Giỏi';
        if (score >= 7.0) return 'Khá';
        if (score >= 4.0) return 'Trung bình';
        return 'Yếu';
    }
}

// Khởi tạo dashboard khi trang được load
document.addEventListener('DOMContentLoaded', function() {
    new StudentDashboard();
});