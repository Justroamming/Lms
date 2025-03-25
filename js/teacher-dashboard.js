class TeacherDashboard {
    constructor() {
        const currentUser = sessionStorage.getItem('currentUser');
        this.teacher = JSON.parse(currentUser);
        this.initializeDashboard();
    }

    async initializeDashboard() {
        try {
            // Fetch teacher data from API
            const response = await fetch(`https://localhost:7231/DashboardTeachers/GetTeacherById?id=${this.teacher.teacherId}`);
            const teacher = await response.json();
            const teacherData = teacher.data;
            
            // If teacher is an array, take the first element
            const teacherDataInfo = Array.isArray(teacherData) ? teacherData[0] : teacherData;

            const welcomeElement = document.getElementById('teacherNameWelcome');
            const headerElement = document.getElementById('teacherName');
            
            const fullName = `${teacherData.lastName} ${teacherData.firstName}`;
            
            if (welcomeElement) {
                welcomeElement.textContent = fullName || 'Giáo viên';
            }
            if (headerElement) {
                headerElement.textContent = fullName || 'Giáo viên';
            }

            // Update time
            this.updateDateTime();
            setInterval(() => this.updateDateTime(), 60000);            
            this.updateDashboardView();
         
        } catch (error) {
            console.error('Error details:', error.message);
        }
    }

    async updateDashboardView() {
   
        try {
            const totalStudentsResponse = await fetch(`https://localhost:7231/DashboardTeachers/GetTotalStudentsByTeacher?id=${this.teacher.teacherId}`);
            const totalStudentsData = await totalStudentsResponse.json();
            
            const totalStudentsElement = document.getElementById('totalStudents');
            if (totalStudentsElement && Array.isArray(totalStudentsData) && totalStudentsData.length > 0) {
                totalStudentsElement.textContent = totalStudentsData[0].totalStudents || '0';
            } else {
                totalStudentsElement.textContent = '0';
            }
        } catch (error) {
            console.error('Error fetching total students:', error);
        }
        
        

        try {
            const AverageScoreResponse = await fetch(`https://localhost:7231/DashboardTeachers/GetAverageScoreByTeacher?id=${this.teacher.teacherId}`);
            const AverageScoreData = await AverageScoreResponse.json();
            const averageElement = document.getElementById('averageScore');
        
            if (averageElement && Array.isArray(AverageScoreData) && AverageScoreData.length > 0) {
                const averageScore = parseFloat(AverageScoreData[0].avgScore);
                averageElement.textContent = isNaN(averageScore) ? '0' : averageScore.toFixed(2);
            } else {
                averageElement.textContent = '0';
            }
        } catch (error) {
            console.error('Error fetching average score:', error);
            const averageElement = document.getElementById('averageScore');
            if (averageElement) {
                averageElement.textContent = '0';
            }
        }
        // Update schedule
        this.updateSchedule();
    }

    updateDateTime() {
        const dateElement = document.getElementById('currentDateTime');
        if (dateElement) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            dateElement.textContent = now.toLocaleDateString('vi-VN', options);
        }
    }

   

    async updateSchedule() {
        try {
            const response = await fetch(`https://localhost:7231/ScheduleTeachers/GetOneTeacherSchedule?id=${this.teacher.teacherId}`);
            const schedule = await response.json();

            const scheduleContainer = document.getElementById('todaySchedule');
            scheduleContainer.innerHTML = ""; // Clear previous content
    
            if (!Array.isArray(schedule) || schedule.length === 0) {
                scheduleContainer.innerHTML = "<p>Không có lịch dạy.</p>";
                return;
            }
    
            scheduleContainer.innerHTML += `
                <table class="table-container">
                    <thead>
                        <tr>
                            <th>Môn học</th>
                            <th>Lớp</th>
                            <th>Thời gian</th>
                            <th>Địa điểm</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${schedule.map(item => `
                            <tr>
                                <td>${item.subjectName}</td>
                                <td>${item.cohortName}</td>
                                <td>${item.startTime} - ${item.endTime}</td>
                                <td>${item.location}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            console.error("Lỗi khi tải lịch giảng dạy:", error);
        }
    }
    
}

// Initialize dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TeacherDashboard();
});