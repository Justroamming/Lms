// Service để quản lý dữ liệu tập trung
class DataService {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
        this.dashboardData = null;
    }

    async fetchDashboardData() {
        try {
            // Fetch teacher data from API
            const teacherResponse = await fetch(`https://localhost:7231/DashboardTeachers/GetTeacherById?id=${this.teacher.teacherId}`);
            const teacher = await teacherResponse.json();
            const teacherData = teacher.data;

            // Fetch students and scores data from API
            const studentsResponse = await fetch(`https://localhost:7231/DashboardTeachers/GetTeacherStudentsInfo?id=${this.teacher.teacherId}`);
            const students = await studentsResponse.json();

            const scoresResponse = await fetch(`https://localhost:7231/DashboardTeachers/GetTeacherGradesStudentsScore?id=${this.teacher.teacherId}`);
            const scores = await scoresResponse.json();

            // Tính toán thống kê
            const statistics = this.calculateStatistics(scores);
            
            this.dashboardData = {
                teacherData,
                students,
                scores,
                statistics,
                recentScores: this.getRecentScores(scores, students),
                schedule: this.getTeacherSchedule()
            };
            
            console.log('Dashboard Data:', this.dashboardData); // Debug
            return this.dashboardData;
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu:', error);
            return {
                teacher: { fullName: 'Giáo viên' },
                students: [],
                scores: [],
                statistics: { totalStudents: 0, averageScore: '0.0', passRate: '0.0' },
                recentScores: [],
                schedule: []
            };
        }
    }
    
    calculateStatistics(scores) {
        if (!scores.length) return {
            average: 0,
            ranking: 'Chưa có điểm',
            passedSubjects: '0/0'
        };

        const average = scores.reduce((sum, score) => sum + parseFloat(score.score), 0) / scores.length;
        const passedCount = scores.filter(score => parseFloat(score.score) >= 4).length;

        return {
            average: average.toFixed(1),
            ranking: this.getRanking(average),
            passedSubjects: `${passedCount}/${scores.length}`
        };
    };
    
    getRanking(average) {
        if (average >= 8.5) return 'Xuất sắc';
        if (average >= 7.0) return 'Giỏi';
        if (average >= 5.0) return 'Khá';
        if (average >= 4.0) return 'Trung bình';
        return 'Yếu';
    };
    
    getRecentScores(scores, students) {
        if (!Array.isArray(scores)) {
            console.error('scores không phải là mảng:', scores);
            return [];
        }

        try {
            return scores
                .map(score => {
                    const student = students.find(s => s.studentName === score.studentName || s.studentName === score.studentName);
                    return {
                        ...score,
                        studentName: student ? student.studentName || student.studentName : 'Học sinh'
                    };
                })
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);
        } catch (error) {
            console.error('Lỗi trong getRecentScores:', error);
            return [];
        }
    };
    
    getTeacherSchedule() {
       
    };
    
    getDashboardData() {
        return this.dashboardData;
    };
    
    // Cập nhật dữ liệu dashboard và thống kê
    updateData(newData) {
        this.dashboardData = newData;
        // Kích hoạt sự kiện cập nhật
        document.dispatchEvent(new CustomEvent('dashboard-data-updated', {
            detail: newData
        }));
    };

    async getStudentData(studentId) {
        try {
            const scoresResponse = await fetch(`https://localhost:7231/DashboardStudents/GetAllGradesOfAStudent?id=${studentId}`);
            const studentScores = await scoresResponse.json();
            
            return {
                scores: studentScores,
                statistics: this.calculateStatistics(studentScores),
                schedule: this.getStudentSchedule(studentId)
            };
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu học sinh:', error);
            throw error;
        }
    };

    getStudentSchedule(studentId) {
        // Giả lập dữ liệu lịch học
        
            // Thêm các ngày khác...
        
    }

    async getStudentStats(studentId) {
        try {
            const scoresResponse = await fetch(`https://localhost:7231/DashboardStudents/GetAllGradesOfAStudent?id=${studentId}`);
            const studentScores = await scoresResponse.json();
            
            // Tính điểm trung bình
            const averageScore = studentScores.length > 0 
                ? studentScores.reduce((sum, score) => sum + score.score, 0) / studentScores.length 
                : 0;

            // Tỷ lệ hoàn thành (giả định điểm >= 5 là đạt)
            const passedScores = studentScores.filter(score => score.score >= 5);
            const completionRate = studentScores.length > 0 
                ? (passedScores.length / studentScores.length) * 100 
                : 0;

            // Số ngày đến kỳ thi gần nhất (giả lập)
            const daysToExam = 30;

            return {
                averageScore,
                completionRate,
                daysToExam
            };
        } catch (error) {
            console.error('Lỗi khi lấy thống kê học sinh:', error);
            return {
                averageScore: 0,
                completionRate: 0,
                daysToExam: 0
            };
        }
    }

    async getUpcomingExams(studentId) {
        try {
            const examsResponse = await fetch(`${this.apiBaseUrl}/exams?studentId=${studentId}`);
            const exams = await examsResponse.json();
            return exams;
        } catch (error) {
            console.error('Lỗi khi lấy lịch thi:', error);
            return [];
        }
    }

    async getSubjectProgress(studentId) {
        try {
            const scoresResponse = await fetch(`${this.apiBaseUrl}/scores?studentId=${studentId}`);
            const studentScores = await scoresResponse.json();
            
            // Tạo map để theo dõi tiến độ của từng môn học
            const subjectProgress = new Map();
            
            // Giả định mỗi môn học cần 4 cột điểm
            const requiredScores = 4;
            
            studentScores.forEach(score => {
                if (!subjectProgress.has(score.subject)) {
                    subjectProgress.set(score.subject, {
                        completed: 1,
                        total: requiredScores,
                        average: score.score
                    });
                } else {
                    const current = subjectProgress.get(score.subject);
                    current.completed += 1;
                    current.average = (current.average * (current.completed - 1) + score.score) / current.completed;
                    subjectProgress.set(score.subject, current);
                }
            });
            
            // Chuyển Map thành mảng để dễ sử dụng
            return Array.from(subjectProgress).map(([subject, progress]) => ({
                subject,
                completed: progress.completed,
                total: progress.total,
                percentage: (progress.completed / progress.total) * 100,
                average: progress.average.toFixed(1)
            }));
        } catch (error) {
            console.error('Lỗi khi lấy tiến độ môn học:', error);
            return [];
        }
    }

    // Lấy thông tin về các môn học mà giáo viên dạy
    async getTeacherSubjects(teacherId) {
        try {
            console.log(`Gọi API lấy môn học với teacherId: ${teacherId}`);
            // Đảm bảo URL đúng - kiểm tra endpoint API
            const url = `https://localhost:7231/DashboardTeachers/GetSubjectByTeacherId?id=${teacherId}`;
            console.log('URL API:', url);
            
            const response = await fetch(url);
            console.log('API response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Dữ liệu trả về từ API:', data);
            return data;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin môn học của giáo viên:', error);
            return [];
        }
    }
}
