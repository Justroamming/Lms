class TeacherScores {
    constructor() {
        this.apiBaseUrl = 'https://localhost:7231/ScoreTeachers'; // Replace with your API base URL
        this.teacher = JSON.parse(sessionStorage.getItem('currentUser'));
        this.setupEventListeners();
        this.loadCohorts();

    }

    setupEventListeners() {
        

        document.getElementById('scoreForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveScore();
        });

        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
    }

    async loadCohorts() {
     
        try {
            const response = await fetch(`${this.apiBaseUrl}/GetAllCohortteachbyateacher?id=${this.teacher.teacherId}`);
            const cohorts = await response.json();
            const classFilter = document.getElementById('classFilter');
           
            if (classFilter) {
                classFilter.innerHTML = `
                    <option value="">Chọn lớp học</option>
                    ${cohorts.map(cohort => `
                        <option value="${cohort.cohortID}">
                            ${cohort.cohortName}
                        </option>
                    `).join('')}
                `;

            const subjectresponse = await fetch(`${this.apiBaseUrl}/GetTeacherAllSubjectsTeach?id=${this.teacher.teacherId}`);
            const subjects = await subjectresponse.json();
            const subject = document.getElementById('subjectID');    
            if(subject){
                subject.innerHTML = `
                    <option value="">Chọn môn học</option>
                    ${subjects.map(subject => `
                        <option value="${subject.subjectID}">
                            ${subject.subjectName}
                        </option>
                    `).join('')}
                `;
            }

                classFilter.addEventListener('change', () => {
                    this.filterStudentsByCohort(classFilter.value);
                });
            }
        } catch (error) {
            console.error('Error loading cohorts:', error);
        }
    }

    async filterStudentsByCohort(cohortId) {
        try {
        const response = await fetch(`${this.apiBaseUrl}/GetTeacherAllStudentGrades?id=${this.teacher.teacherId}`);
            const scores = await response.json();
            const studentsResponse = await fetch(`${this.apiBaseUrl}/GetTeacherAllTeachStudentsByCohort?id=${this.teacher.teacherId}`);
            const students = await studentsResponse.json();
            const studentSelect = document.getElementById('studentID');
            if(studentSelect){
                studentSelect.innerHTML = `
                    <option value="">Tất cả học sinh</option>
                    ${students.filter(s => !cohortId || s.cohortID === cohortId).map(student => `
                        <option value="${student.studentID}">
                            ${student.studentName}
                        </option>
                    `).join('')}
                `;
            }

           const tbody = document.querySelector('#scoreTable tbody');
           if (!tbody) return;


           tbody.innerHTML = scores.map(score => {
               const student = students.find(s => s.studentID === score.studentID && s.cohortID === cohortId);
               if (!student) return ''; 
               return `
                   <tr>
                       <td>${student.studentName}</td>
                       <td>${student.cohortName}</td>
                       <td>${score.subjectName}</td>
                       <td>${score.testType}</td>
                       <td>${score.score}</td>
                       <td>${score.weight}%</td>
                       <td>${score.testDate}</td>
                       <td>${score.gradeDate}</td>
                       <td>
                           <button class="btn btn-edit" onclick="window.TeacherScores.openeditModal('${score.gradeID}')">
                               <i class="fas fa-edit"></i>
                           </button>
                           <button class="btn btn-delete" onclick="window.TeacherScores.deleteScore('${score.gradeID}')">
                               <i class="fas fa-trash"></i>
                           </button>
                       </td>
                   </tr>
               `;
           }).join('');
       } catch (error) {
           console.error('Error filtering students:', error);
       }
    }

    openAddScoreModal() {
        const modal = document.getElementById('scoreModal');
        if (modal) {
            document.getElementById('modalTitle').textContent = 'Thêm Điểm Mới';
            document.getElementById('gradeID').value = '';
            document.getElementById('scoreForm').reset();
            document.getElementById('gradeDate').valueAsDate = new Date();
            modal.style.display = 'block';
            
        }
    }

    async openeditModal(gradeID) {
        const modal = document.getElementById('scoreModal');
        const form = document.getElementById('scoreForm');

        if (gradeID) {
            const response = await fetch(`${this.apiBaseUrl}/GetAOneStudentGradeByTeacher?gradeID=${gradeID}`);
            const ScoreArray = await response.json();
          
            
            // Populate fields directly using API keys
            Object.keys(ScoreArray).forEach(key => {
                const input = form.querySelector(`[id="${key}"]`);
                if (input) {
                    input.value = ScoreArray[key];
                }
            });
        } else {
            form.reset();
        }
        document.getElementById('scoreModal').style.display = 'block';
    }

    async saveScore() {
        const gradeId = document.getElementById('gradeID')?.value?.trim();
        const studentId = document.getElementById('studentID')?.value?.trim();
        const scoreValue = parseFloat(document.getElementById('score')?.value);
        const subject = document.getElementById('subjectID')?.value?.trim();
        const type = document.getElementById('testType')?.value?.trim();
        const weight = parseFloat(document.getElementById('weight')?.value?.trim());
        const testDate = document.getElementById('testDate')?.value?.trim();
        const date = document.getElementById('gradeDate')?.value?.trim();
    
        try {
                
            if (scoreValue < 0 || scoreValue > 10) {
                alert('Điểm số phải từ 0 đến 10!');
                return;
            }
            const isupdating=Boolean(gradeId);
            const params = new URLSearchParams({
                gradeID: gradeId||'',
                studentID: studentId,
                score: scoreValue,
                teacherID: this.teacher.teacherId,
                gradeDate: date,
                subjectID:subject,
                testType:type,
                testDate:testDate,
                weight:weight         
              
            });
            

            const url = isupdating 
            ? `${this.apiBaseUrl}/UpdateTeacherStudentGrade?${params}` 
            : `${this.apiBaseUrl}/InsertTeacherStudentGrade?${params}`;
            
            const method = isupdating ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
              
            });
    
            if (!response.ok) {
                throw new Error('Lưu điểm thất bại!');
            }
    
            this.closeModal();
            
            this.filterStudentsByCohort(document.getElementById('classFilter').value);
    
       
     
        } catch (error) {
            console.error('Lỗi khi lưu điểm:', error);
            alert(`Lỗi: ${error.message}`);
        }
    }
    

    async deleteScore(gradeID) {
        if (!confirm('Bạn có chắc chắn muốn xóa điểm này?')) return;
        console.log("gradeID: ",gradeID);
        try {
            await fetch(`${this.apiBaseUrl}/DeleteTeacherStudentGrade?gradeID=${gradeID}`, {
                method: 'DELETE'
            });

            await this.filterStudentsByCohort(document.getElementById('classFilter').value);

           
        } catch (error) {
            console.error('Error deleting score:', error);
        }
    }

    closeModal() {
        document.getElementById('scoreModal').style.display = 'none';
    }

    validateScore(score) {
        return score >= 0 && score <= 10;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const teacherScoresInstance = new TeacherScores();
    window.TeacherScores = teacherScoresInstance;
});
