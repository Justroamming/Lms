class StudentScores {
    constructor() {
        const currentUser = sessionStorage.getItem('currentUser');
        // Store the entire user object
        this.student = JSON.parse(currentUser);
        this.allScores = []; // Lưu trữ tất cả điểm để tiện lọc
        this.init();
    }

    async init() {
        await this.loadScores();
        this.initializeFilters();
    }

    initializeFilters() {
        try {
            // Lấy các phần tử filter
            const subjectFilter = document.getElementById('subjectFilter');
            const scoreFilter = document.getElementById('scoreFilter');
         

            if (subjectFilter && this.allScores.length > 0) {
                // Tạo danh sách môn học unique từ score.subjectName
                const subjects = [...new Set(this.allScores.map(score => score.subjectName))];
                subjectFilter.innerHTML = `
                    <option value="">Tất cả môn</option>
                    ${subjects.map(subject => `<option value="${subject}">${subject}</option>`).join('')}
                `;
            }

            // Thêm event listeners
            subjectFilter?.addEventListener('change', () => this.applyFilters());
            scoreFilter?.addEventListener('change', () => this.applyFilters());
            
        } catch (error) {
            console.error('Lỗi khi khởi tạo bộ lọc:', error);
        }
    }

    applyFilters() {
        try {
            const subjectFilter = document.getElementById('subjectFilter').value;
            const scoreFilter = document.getElementById('scoreFilter').value;
        

            let filteredScores = [...this.allScores];

            // Lọc theo môn học (using subjectName for consistency)
            if (subjectFilter) {
                filteredScores = filteredScores.filter(score => score.subjectName === subjectFilter);
            }

          

            // Lọc theo điểm số
            if (scoreFilter) {
                switch (scoreFilter) {
                    case 'high':
                        filteredScores = filteredScores.filter(score => score.score >= 8.0);
                        break;
                    case 'medium':
                        filteredScores = filteredScores.filter(score => score.score >= 4.0 && score.score < 8.0);
                        break;
                    case 'low':
                        filteredScores = filteredScores.filter(score => score.score < 4.0);
                        break;
                }
            }

            this.renderScoresTable(filteredScores);
            this.updateStatistics(filteredScores);
            this.updateAcademicSummary(filteredScores);
        } catch (error) {
            console.error('Lỗi khi áp dụng bộ lọc:', error);
        }
    }

    async loadScores() {
        try {
            // Note: Adjust the URL if needed based on your API endpoint.
            const response = await fetch(`https://localhost:7231/ScoreStudentss/GetAllGradesOfAStudent?id=${this.student.studentId}`);
            const scores = await response.json();
            this.allScores = scores;

            this.renderScoresTable(this.allScores);
            this.updateStatistics(this.allScores);
            this.updateAcademicSummary(this.allScores);
            this.initializeFilters(); // Khởi tạo lại bộ lọc sau khi có dữ liệu
        } catch (error) {
            console.error('Lỗi khi tải điểm:', error);
        }
    }

    renderScoresTable(scores) {
        const tableBody = document.getElementById('scoresTableBody');
        if (!tableBody) return;

        if (scores.length > 0) {
            tableBody.innerHTML = scores.map(score => `
                <tr>
                    <td>${score.subjectName}</td>
                    <td>${score.testType}</td>
                    <td>${score.score}</td>
                    <td>${score.gradeDate}</td>
                </tr>
            `).join('');
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">Chưa có điểm</td>
                </tr>
            `;
        }
    }

    updateStatistics(scores) {
        try {
            const stats = {
                totalScores: scores.length,
                averageScore: 0,
                highestScore: 0,
                lowestScore: 10,
                passRate: 0
            };
    
            if (scores.length > 0) {
                const sum = scores.reduce((acc, score) => acc + score.score, 0);
                stats.averageScore = (sum / scores.length) ; // Chia cho 10
    
                stats.highestScore = Math.max(...scores.map(score => score.score));
                stats.lowestScore = Math.min(...scores.map(score => score.score));
    
                const passedScores = scores.filter(score => score.score >= 4.0);
                stats.passRate = (passedScores.length / scores.length) * 100;
            }
    
            const elements = {
                totalScores: document.getElementById('totalScores'),
                highestScore: document.getElementById('highestScore'),
                lowestScore: document.getElementById('lowestScore'),
                passRate: document.getElementById('passRate')
            };
    
            if (elements.totalScores) elements.totalScores.textContent = stats.totalScores;
            if (elements.highestScore) elements.highestScore.textContent = stats.highestScore.toFixed(1);
            if (elements.lowestScore) elements.lowestScore.textContent = stats.lowestScore.toFixed(1);
            if (elements.passRate) elements.passRate.textContent = `${stats.passRate.toFixed(1)}%`;
    
        } catch (error) {
            console.error('Lỗi khi cập nhật thống kê:', error);
        }
    }
    
    updateAcademicSummary(scores) {
        try {
            const summary = {
                averageGrade: 0,
                academicRanking: '-',
                passedSubjects: 0
            };
    
            if (scores.length > 0) {
                const sum = scores.reduce((acc, score) => acc + score.score, 0);
                summary.averageGrade = (sum / scores.length) ; // Chia cho 10
    
                summary.academicRanking = this.getAcademicRanking(summary.averageGrade);
    
                const uniqueSubjects = [...new Set(scores.map(score => score.subjectName))];
                const passedSubjects = uniqueSubjects.filter(subject => {
                    const subjectScores = scores.filter(score => score.subjectName === subject);
                    const subjectAverage = subjectScores.reduce((sum, score) => sum + score.score, 0) / subjectScores.length;
                    return subjectAverage >= 4.0;
                });
                summary.passedSubjects = passedSubjects.length;
            }
    
            const elements = {
                averageGrade: document.getElementById('averageGrade'),
                academicRanking: document.getElementById('academicRanking'),
                passedSubjects: document.getElementById('passedSubjects')
            };
    
            if (elements.averageGrade) {
                elements.averageGrade.textContent = summary.averageGrade.toFixed(1);
            }
            if (elements.academicRanking) {
                elements.academicRanking.textContent = summary.academicRanking;
            }
            if (elements.passedSubjects) {
                elements.passedSubjects.textContent = summary.passedSubjects.toString();
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật tổng kết học tập:', error);
        }
    }

    getAcademicRanking(average) {
        if (average >= 9.0) return 'Xuất sắc';
        if (average >= 8.0) return 'Giỏi';
        if (average >= 7.0) return 'Khá';
        if (average >= 5.0) return 'Trung bình';
        return 'Yếu';
    }
}


// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', () => {
    window.studentScores = new StudentScores();
});