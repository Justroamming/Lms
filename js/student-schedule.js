class StudentSchedule {
    constructor() {
      // Giả sử thông tin sinh viên hiện tại được lưu trong sessionStorage dưới dạng chuỗi JSON.
      this.student = JSON.parse(sessionStorage.getItem('currentUser'));
      // Cấu hình lịch: chỉnh startHour/endHour theo nhu cầu.
      this.startHour = 7;
      this.endHour = 18;
      // Tuần hiện tại được định nghĩa bởi ngày thứ Hai.
      this.currentWeekStart = this.getMonday(new Date());
      // Map tên thứ sang số (Monday = 1, Tuesday = 2, …, Sunday = 7).
      this.dayMapping = {
        "Monday": 1,
        "Tuesday": 2,
        "Wednesday": 3,
        "Thursday": 4,
        "Friday": 5,
        "Saturday": 6,
        "Sunday": 7
      };
      // Các giá trị này sẽ được thiết lập sau khi load schedule.
      this.scheduleStart = null;
      this.scheduleEnd = null;
      
      this.init();
    }
  
    init() {
      this.buildCalendar();
      this.loadSchedule();
      this.updateWeekLabel();
      this.initNavigation();
    }
  
    // Utility: Trả về ngày thứ Hai của tuần của một ngày cho trước.
    getMonday(d) {
      d = new Date(d);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    }
  
    // Xây dựng lưới lịch cho 1 tuần.
    buildCalendar() {
      const calendarContainer = document.getElementById('calendarContainer');
      if (!calendarContainer) {
    console.error("Element #calendarContainer not found.");
    return;
  }
      calendarContainer.innerHTML = '';
      const calendar = document.createElement('div');
      calendar.className = 'calendar';
  
      // Ô trống góc trên bên trái.
      calendar.appendChild(document.createElement('div'));
  
      // Tạo các ô header cho 7 ngày.
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(this.currentWeekStart);
        dayDate.setDate(dayDate.getDate() + i);
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        const options = { day: '2-digit', month: '2-digit', weekday: 'short' };
        dayHeader.innerText = dayDate.toLocaleDateString('en-US', options);
        calendar.appendChild(dayHeader);
      }
  
      // Tạo các hàng cho mỗi giờ.
      for (let hour = this.startHour; hour < this.endHour; hour++) {
        // Ô hiển thị thời gian.
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        timeSlot.innerText = `${hour}:00`;
        calendar.appendChild(timeSlot);
        // Tạo 7 ô cho mỗi ngày.
        for (let i = 0; i < 7; i++) {
          const cell = document.createElement('div');
          cell.className = 'cell';
          calendar.appendChild(cell);
        }
      }
      calendarContainer.appendChild(calendar);
      // Sau khi lưới được xây dựng, hiển thị các event nếu đã load.
      this.renderEvents();
    }
  
    // Load schedule của sinh viên từ API.
    async loadSchedule() {
      try {
        const response = await fetch(`https://localhost:7231/ScheduleStudents/GetOneStudentSchedule?id=${this.student.studentId}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        this.schedule = await response.json();
        
        // Thiết lập phạm vi lịch (12 tuần) dựa trên lessonDate sớm nhất.
        if (this.schedule && this.schedule.length > 0) {
          // Tìm ngày lessonDate sớm nhất.
          const earliest = new Date(Math.min(...this.schedule.map(item => new Date(item.lessonDate))));
          this.scheduleStart = this.getMonday(earliest);
          this.scheduleEnd = new Date(this.scheduleStart);
          // Thêm 12 tuần (84 ngày) vào scheduleStart.
          this.scheduleEnd.setDate(this.scheduleEnd.getDate() + 12 * 7);
        } else {
          // Nếu không có schedule, sử dụng tuần hiện tại.
          this.scheduleStart = this.getMonday(new Date());
          this.scheduleEnd = new Date(this.scheduleStart);
        }
        
        // Nếu currentWeekStart trước scheduleStart thì gán lại bằng scheduleStart.
        if (this.currentWeekStart < this.scheduleStart) {
          this.currentWeekStart = new Date(this.scheduleStart);
        }
        
        this.renderEvents();
        this.updateWeekLabel();
      } catch (error) {
        console.error('Failed to load schedule:', error);
      }
    }
  
    // Hiển thị các event trong overlay.
    renderEvents() {
      const eventOverlay = document.getElementById('eventOverlay');
      if (!eventOverlay) return;
      eventOverlay.innerHTML = '';
      // Tính chiều rộng (pixel) của mỗi cột ngày.
      const overlayWidth = eventOverlay.offsetWidth;
      const dayColumnWidth = overlayWidth / 7;
  
      if (!this.schedule) return;
      
      // Với mỗi event, tính ngày xuất hiện của tuần hiện tại theo dayOfWeek.
      this.schedule.forEach(item => {
        // Tính ngày xuất hiện: từ currentWeekStart + (dayMapping - 1).
        const eventOccurrence = new Date(this.currentWeekStart);
        eventOccurrence.setDate(eventOccurrence.getDate() + (this.dayMapping[item.dayOfWeek] - 1));
        // Chỉ hiển thị event nếu ngày xuất hiện nằm trong khoảng 12 tuần.
        if (eventOccurrence < this.scheduleStart || eventOccurrence >= this.scheduleEnd) return;
  
        // Phân tích thời gian bắt đầu và kết thúc (format "HH:MM:SS").
        const start = this.parseTime(item.startTime);
        const end = this.parseTime(item.endTime);
        const startTotalMinutes = start.hours * 60 + start.minutes;
        const endTotalMinutes = end.hours * 60 + end.minutes;
        const calendarStartMinutes = this.startHour * 60;
        // Tính offset theo pixel và chiều cao event.
        const offsetMinutes = startTotalMinutes - calendarStartMinutes;
        const durationMinutes = endTotalMinutes - startTotalMinutes;
  
        // Tạo phần tử event.
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event';
        eventDiv.innerHTML = `
            <strong>${item.subjectName}</strong><br>
            <small>${item.teacherName}</small><br>
            <small>${item.startTime.slice(0,5)} - ${item.endTime.slice(0,5)}</small><br>
            <small>${item.location}</small>
        `;
        eventDiv.style.top = offsetMinutes + "px";
        eventDiv.style.height = durationMinutes + "px";
        eventDiv.style.left = ((this.dayMapping[item.dayOfWeek] - 1) * dayColumnWidth) + "px";
        eventDiv.style.width = (dayColumnWidth - 4) + "px";
  
        eventOverlay.appendChild(eventDiv);
      });
    }
  
    // Chuyển chuỗi thời gian ("HH:MM:SS" hoặc "HH:MM") thành đối tượng thời gian.
    parseTime(timeStr) {
      const parts = timeStr.split(":");
      return {
        hours: parseInt(parts[0], 10),
        minutes: parseInt(parts[1], 10)
      };
    }
  
    // Cập nhật label của tuần hiển thị.
    updateWeekLabel() {
      const weekLabel = document.getElementById('weekLabel');
      const start = new Date(this.currentWeekStart);
      const end = new Date(this.currentWeekStart);
      end.setDate(end.getDate() + 6);
      const options = { month: 'short', day: 'numeric' };
      let labelText = `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)} ${start.getFullYear()}`;
        
      weekLabel.innerText = labelText;
    }
  
    // Khởi tạo điều hướng tuần: nhấn Prev/Next sẽ chuyển tuần, hiển thị lưới mới và render lại các event theo tuần hiện tại.
    initNavigation() {
      document.getElementById('prevWeek').addEventListener('click', () => {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
        this.buildCalendar();
        this.updateWeekLabel();
      });
      document.getElementById('nextWeek').addEventListener('click', () => {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
        this.buildCalendar();
        this.updateWeekLabel();
      });
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    window.StudentSchedule = new StudentSchedule();
  });
  