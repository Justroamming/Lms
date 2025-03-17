class TeacherSchedule {
    constructor() {
        // Giả sử thông tin giáo viên hiện tại được lưu trong sessionStorage dưới dạng chuỗi JSON.
        this.teacher = JSON.parse(sessionStorage.getItem('currentUser'));
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
        
        // Hiển thị loading spinner
        this.showLoading();
        
        this.init();
      }
    
      init() {
        this.buildCalendar();
        this.loadSchedule();
        this.updateWeekLabel();
        this.initNavigation();
      }
    
      // Hiển thị loading spinner
      showLoading() {
        const calendarWrapper = document.getElementById('calendarWrapper');
        if (!calendarWrapper) return;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'calendar-loading';
        loadingDiv.innerHTML = `
          <div class="spinner">
            <i class="fas fa-circle-notch fa-spin"></i>
          </div>
          <p>Đang tải lịch dạy...</p>
        `;
        
        calendarWrapper.appendChild(loadingDiv);
      }
      
      // Ẩn loading spinner
      hideLoading() {
        const loadingDiv = document.querySelector('.calendar-loading');
        if (loadingDiv) {
          loadingDiv.classList.add('fade-out');
          setTimeout(() => {
            loadingDiv.remove();
          }, 500);
        }
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
        const cornerCell = document.createElement('div');
        cornerCell.className = 'time-slot';
        cornerCell.innerHTML = '<i class="fas fa-clock"></i>';
        calendar.appendChild(cornerCell);
    
        // Tạo các ô header cho 7 ngày.
        for (let i = 0; i < 7; i++) {
          const dayDate = new Date(this.currentWeekStart);
          dayDate.setDate(dayDate.getDate() + i);
          const dayHeader = document.createElement('div');
          dayHeader.className = 'day-header';
          
          // Kiểm tra nếu là ngày hiện tại
          const today = new Date();
          if (dayDate.getDate() === today.getDate() && 
              dayDate.getMonth() === today.getMonth() && 
              dayDate.getFullYear() === today.getFullYear()) {
            dayHeader.classList.add('today');
          }
          
          const options = { day: '2-digit', month: '2-digit', weekday: 'short' };
          dayHeader.innerHTML = `
            <span class="day-name">${dayDate.toLocaleDateString('vi-VN', {weekday: 'short'})}</span>
            <span class="day-date">${dayDate.getDate()}</span>
            <span class="day-month">${dayDate.toLocaleDateString('vi-VN', {month: 'short'})}</span>
          `;
          calendar.appendChild(dayHeader);
        }
    
        // Tạo các hàng cho mỗi giờ.
        for (let hour = this.startHour; hour < this.endHour; hour++) {
          // Ô hiển thị thời gian.
          const timeSlot = document.createElement('div');
          timeSlot.className = 'time-slot';
          timeSlot.innerHTML = `<span>${hour}:00</span>`;
          calendar.appendChild(timeSlot);
          // Tạo 7 ô cho mỗi ngày.
          for (let i = 0; i < 7; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            // Kiểm tra nếu là giờ hiện tại
            const now = new Date();
            const cellDate = new Date(this.currentWeekStart);
            cellDate.setDate(cellDate.getDate() + i);
            
            if (cellDate.getDate() === now.getDate() && 
                cellDate.getMonth() === now.getMonth() && 
                cellDate.getFullYear() === now.getFullYear() && 
                hour === now.getHours()) {
              cell.classList.add('current-hour');
            }
            
            calendar.appendChild(cell);
          }
        }
        calendarContainer.appendChild(calendar);
        
        // Tính toán kích thước của eventOverlay
        this.calculateOverlayDimensions();
      }
    
      // Tính toán kích thước và vị trí của eventOverlay
      calculateOverlayDimensions() {
        const calendarWrapper = document.getElementById('calendarWrapper');
        const eventOverlay = document.getElementById('eventOverlay');
        const calendar = document.querySelector('.calendar');
        
        if (!calendarWrapper || !eventOverlay || !calendar) return;
        
        // Lấy vị trí của ô đầu tiên (không phải header)
        const firstCell = document.querySelector('.cell');
        const timeSlot = document.querySelector('.time-slot');
        
        if (!firstCell || !timeSlot) return;
        
        const calendarRect = calendar.getBoundingClientRect();
        const wrapperRect = calendarWrapper.getBoundingClientRect();
        const timeSlotRect = timeSlot.getBoundingClientRect();
        
        // Thiết lập vị trí và kích thước của overlay
        eventOverlay.style.top = '60px'; // Chiều cao của day-header
        eventOverlay.style.left = timeSlotRect.width + 'px'; // Chiều rộng của time-slot
        eventOverlay.style.width = (calendarRect.width - timeSlotRect.width) + 'px';
        eventOverlay.style.height = (calendarRect.height - 60) + 'px'; // Trừ đi chiều cao của day-header
      }
    
      // Load schedule của giáo viên từ API.
      async loadSchedule() {
        try {
          let scheduleData;
          
          try {
            const response = await fetch(`https://scoreapi-1zqy.onrender.com/ScheduleTeachers/GetOneTeacherSchedule?id=${this.teacher.teacherId}`);
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            scheduleData = await response.json();
          } catch (error) {
            console.warn('Không thể kết nối đến API, sử dụng dữ liệu mẫu:', error);
            scheduleData = this.getMockSchedule();
          }
          
          this.schedule = scheduleData;
          
          // Thiết lập phạm vi lịch (12 tuần) dựa trên lessonDate sớm nhất.
          if (this.schedule && this.schedule.length > 0) {
            // Tìm ngày lessonDate sớm nhất.
            const dateField = this.schedule[0].lessonDate ? 'lessonDate' : 'day';
            const earliest = new Date(Math.min(...this.schedule.map(item => new Date(item[dateField]))));
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
          
          // Ẩn loading spinner
          this.hideLoading();
          
          this.renderEvents();
          this.updateWeekLabel();
        } catch (error) {
          console.error('Failed to load schedule:', error);
          
          // Hiển thị thông báo lỗi
          this.showErrorMessage('Không thể tải lịch dạy. Vui lòng thử lại sau.');
          
          // Ẩn loading spinner
          this.hideLoading();
        }
      }
      
      // Hiển thị thông báo lỗi
      showErrorMessage(message) {
        const calendarWrapper = document.getElementById('calendarWrapper');
        if (!calendarWrapper) return;
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'calendar-error';
        errorDiv.innerHTML = `
          <i class="fas fa-exclamation-circle"></i>
          <p>${message}</p>
          <button class="btn btn-primary retry-btn">
            <i class="fas fa-sync-alt"></i> Thử lại
          </button>
        `;
        
        calendarWrapper.appendChild(errorDiv);
        
        // Thêm sự kiện click cho nút thử lại
        errorDiv.querySelector('.retry-btn').addEventListener('click', () => {
          errorDiv.remove();
          this.showLoading();
          this.loadSchedule();
        });
      }
    
      // Hiển thị các event trong overlay.
      renderEvents() {
        const eventOverlay = document.getElementById('eventOverlay');
        if (!eventOverlay) return;
        eventOverlay.innerHTML = '';
        
        // Tính chiều rộng (pixel) của mỗi cột ngày.
        const overlayWidth = eventOverlay.offsetWidth;
        const dayColumnWidth = overlayWidth / 7;
        const hourHeight = 60; // Chiều cao của mỗi ô giờ
    
        if (!this.schedule || this.schedule.length === 0) {
          // Hiển thị thông báo không có lịch dạy
          const noScheduleDiv = document.createElement('div');
          noScheduleDiv.className = 'no-schedule';
          noScheduleDiv.innerHTML = `
            <i class="fas fa-calendar-times"></i>
            <p>Không có lịch dạy trong tuần này</p>
          `;
          eventOverlay.appendChild(noScheduleDiv);
          return;
        }
        
        // Với mỗi event, tính ngày xuất hiện của tuần hiện tại theo dayOfWeek.
        let hasEventsThisWeek = false;
        
        this.schedule.forEach((item, index) => {
          // Kiểm tra xem đây là dữ liệu API hay dữ liệu mẫu
          const isMockData = item.day !== undefined;
          
          let eventDate;
          
          if (isMockData) {
            // Dữ liệu mẫu đã có ngày cụ thể
            eventDate = new Date(item.day);
            
            // Kiểm tra xem ngày này có thuộc tuần hiện tại không
            const currentWeekEnd = new Date(this.currentWeekStart);
            currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
            
            if (eventDate < this.currentWeekStart || eventDate > currentWeekEnd) {
              return; // Bỏ qua sự kiện không thuộc tuần hiện tại
            }
          } else {
            // Dữ liệu API: Tính ngày xuất hiện từ currentWeekStart + (dayMapping - 1)
            eventDate = new Date(this.currentWeekStart);
            eventDate.setDate(eventDate.getDate() + (this.dayMapping[item.dayOfWeek] - 1));
            
            // Chỉ hiển thị event nếu ngày xuất hiện nằm trong khoảng 12 tuần.
            if (eventDate < this.scheduleStart || eventDate >= this.scheduleEnd) return;
          }
          
          hasEventsThisWeek = true;
    
          // Phân tích thời gian bắt đầu và kết thúc
          const startTimeStr = isMockData ? item.startTime : item.startTime;
          const endTimeStr = isMockData ? item.endTime : item.endTime;
          
          const start = this.parseTime(startTimeStr);
          const end = this.parseTime(endTimeStr);
          const startTotalMinutes = start.hours * 60 + start.minutes;
          const endTotalMinutes = end.hours * 60 + end.minutes;
          const calendarStartMinutes = this.startHour * 60;
          
          // Tính offset theo pixel và chiều cao event.
          const offsetMinutes = startTotalMinutes - calendarStartMinutes;
          const durationMinutes = endTotalMinutes - startTotalMinutes;
          
          // Tính toán vị trí và kích thước
          const top = (offsetMinutes / 60) * hourHeight;
          const height = (durationMinutes / 60) * hourHeight;
          
          // Tính vị trí theo ngày trong tuần
          let left;
          if (isMockData) {
            // Với dữ liệu mẫu, tính vị trí dựa trên ngày trong tuần (0 = Chủ nhật, 1 = Thứ 2, ...)
            const dayOfWeek = eventDate.getDay();
            // Chuyển đổi từ 0-6 (Chủ nhật-Thứ 7) sang 0-6 (Thứ 2-Chủ nhật)
            const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            left = adjustedDayOfWeek * dayColumnWidth;
          } else {
            // Với dữ liệu API, sử dụng dayMapping
            left = (this.dayMapping[item.dayOfWeek] - 1) * dayColumnWidth;
          }
    
          // Tạo phần tử event.
          const eventDiv = document.createElement('div');
          eventDiv.className = 'event';
          eventDiv.style.animationDelay = `${index * 0.1}s`;
          
          // Thêm màu sắc khác nhau cho các môn học khác nhau
          const subjectColors = {
            'Toán học': 'blue',
            'Vật lý': 'green',
            'Hóa học': 'purple',
            'Sinh học': 'orange',
            'Tiếng Anh': 'red',
            'Ngữ văn': 'teal',
            'Lịch sử': 'brown',
            'Địa lý': 'pink'
          };
          
          // Xác định tiêu đề và màu sắc dựa trên loại dữ liệu
          let eventTitle, eventColor, eventClass, eventRoom;
          
          if (isMockData) {
            eventTitle = item.title;
            eventColor = item.color || 'blue';
            eventClass = item.class;
            eventRoom = item.room;
          } else {
            eventTitle = item.subject;
            eventColor = subjectColors[item.subject] || 'default';
            eventClass = item.className;
            eventRoom = item.room;
          }
          
          eventDiv.classList.add(`event-${eventColor}`);
          
          // Định dạng thời gian hiển thị
          const formattedStartTime = isMockData ? startTimeStr : startTimeStr.slice(0, 5);
          const formattedEndTime = isMockData ? endTimeStr : endTimeStr.slice(0, 5);
          
          eventDiv.innerHTML = `
              <div class="event-header">
                <strong>${eventTitle}</strong>
                <span class="event-time">${formattedStartTime} - ${formattedEndTime}</span>
              </div>
              <div class="event-body">
                <div class="event-detail">
                  <i class="fas fa-users"></i>
                  <span>${eventClass}</span>
                </div>
                <div class="event-detail">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>${eventRoom}</span>
                </div>
              </div>
          `;
          
          // Thiết lập vị trí và kích thước
          eventDiv.style.top = `${top}px`;
          eventDiv.style.left = `${left}px`;
          eventDiv.style.height = `${height}px`;
          eventDiv.style.width = `${dayColumnWidth - 2}px`;
          
          // Thêm tooltip
          eventDiv.setAttribute('data-bs-toggle', 'tooltip');
          eventDiv.setAttribute('data-bs-placement', 'top');
          eventDiv.setAttribute('title', `${eventTitle} - ${eventClass} - ${eventRoom}`);
          
          // Thêm sự kiện click để hiển thị chi tiết
          eventDiv.addEventListener('click', () => {
            this.showEventDetails(item);
          });
          
          eventOverlay.appendChild(eventDiv);
        });
        
        // Nếu không có sự kiện nào trong tuần này
        if (!hasEventsThisWeek) {
          const noScheduleDiv = document.createElement('div');
          noScheduleDiv.className = 'no-schedule';
          noScheduleDiv.innerHTML = `
            <i class="fas fa-calendar-times"></i>
            <p>Không có lịch dạy trong tuần này</p>
          `;
          eventOverlay.appendChild(noScheduleDiv);
        }
        
        // Khởi tạo tooltips
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
          const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
          tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
          });
        }
      }
      
      // Hiển thị chi tiết sự kiện
      showEventDetails(event) {
        // Kiểm tra xem đây là dữ liệu API hay dữ liệu mẫu
        const isMockData = event.day !== undefined;
        
        // Xác định các thông tin cần hiển thị
        let eventTitle, eventClass, eventRoom, eventDay, eventStartTime, eventEndTime;
        
        if (isMockData) {
          eventTitle = event.title;
          eventClass = event.class;
          eventRoom = event.room;
          
          // Lấy tên thứ từ ngày
          const eventDate = new Date(event.day);
          const dayOfWeek = eventDate.getDay();
          const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
          eventDay = weekdays[dayOfWeek];
          
          eventStartTime = event.startTime;
          eventEndTime = event.endTime;
        } else {
          eventTitle = event.subjectName;
          eventClass = event.cohortName;
          eventRoom = event.location;
          eventDay = this.getVietnameseDayName(event.dayOfWeek);
          eventStartTime = event.startTime.slice(0, 5);
          eventEndTime = event.endTime.slice(0, 5);
        }
        
        // Tạo modal hiển thị chi tiết
        const modalDiv = document.createElement('div');
        modalDiv.className = 'modal fade';
        modalDiv.id = 'eventDetailsModal';
        modalDiv.setAttribute('tabindex', '-1');
        modalDiv.setAttribute('aria-labelledby', 'eventDetailsModalLabel');
        modalDiv.setAttribute('aria-hidden', 'true');
        
        modalDiv.innerHTML = `
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="eventDetailsModalLabel">Chi tiết lịch dạy</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div class="event-details">
                  <div class="event-detail-item">
                    <i class="fas fa-book"></i>
                    <div>
                      <label>Môn học</label>
                      <p>${eventTitle}</p>
                    </div>
                  </div>
                  <div class="event-detail-item">
                    <i class="fas fa-users"></i>
                    <div>
                      <label>Lớp</label>
                      <p>${eventClass}</p>
                    </div>
                  </div>
                  <div class="event-detail-item">
                    <i class="fas fa-calendar-day"></i>
                    <div>
                      <label>Thứ</label>
                      <p>${eventDay}</p>
                    </div>
                  </div>
                  <div class="event-detail-item">
                    <i class="fas fa-clock"></i>
                    <div>
                      <label>Thời gian</label>
                      <p>${eventStartTime} - ${eventEndTime}</p>
                    </div>
                  </div>
                  <div class="event-detail-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <div>
                      <label>Địa điểm</label>
                      <p>${eventRoom}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        
        document.body.appendChild(modalDiv);
        
        // Hiển thị modal
        const modal = new bootstrap.Modal(modalDiv);
        modal.show();
        
        // Xóa modal khi đóng
        modalDiv.addEventListener('hidden.bs.modal', function () {
          modalDiv.remove();
        });
      }
      
      // Chuyển đổi tên thứ tiếng Anh sang tiếng Việt
      getVietnameseDayName(englishDayName) {
        const dayMap = {
          'Monday': 'Thứ Hai',
          'Tuesday': 'Thứ Ba',
          'Wednesday': 'Thứ Tư',
          'Thursday': 'Thứ Năm',
          'Friday': 'Thứ Sáu',
          'Saturday': 'Thứ Bảy',
          'Sunday': 'Chủ Nhật'
        };
        
        return dayMap[englishDayName] || englishDayName;
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
        
        // Kiểm tra nếu là tuần hiện tại
        const today = new Date();
        const currentWeekStart = this.getMonday(today);
        const isCurrentWeek = start.getTime() === currentWeekStart.getTime();
        
        const options = { month: 'short', day: 'numeric' };
        let labelText = `${start.toLocaleDateString('vi-VN', options)} - ${end.toLocaleDateString('vi-VN', options)} ${start.getFullYear()}`;
        
        if (isCurrentWeek) {
          labelText = `<span class="current-week-badge">Tuần này</span> ${labelText}`;
        }
          
        weekLabel.innerHTML = labelText;
      }
    
      // Khởi tạo điều hướng tuần: nhấn Prev/Next sẽ chuyển tuần, hiển thị lưới mới và render lại các event theo tuần hiện tại.
      initNavigation() {
        document.getElementById('prevWeek').addEventListener('click', () => {
          this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
          this.buildCalendar();
          this.updateWeekLabel();
          this.renderEvents();
          
          // Thêm hiệu ứng chuyển tuần
          this.animateWeekChange('prev');
        });
        
        document.getElementById('nextWeek').addEventListener('click', () => {
          this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
          this.buildCalendar();
          this.updateWeekLabel();
          this.renderEvents();
          
          // Thêm hiệu ứng chuyển tuần
          this.animateWeekChange('next');
        });
        
        // Thêm nút trở về tuần hiện tại
        const weekNavigation = document.querySelector('.week-navigation');
        const todayButton = document.createElement('button');
        todayButton.className = 'btn-today';
        todayButton.innerHTML = '<i class="fas fa-calendar-day"></i> Hôm nay';
        weekNavigation.appendChild(todayButton);
        
        todayButton.addEventListener('click', () => {
          const today = new Date();
          this.currentWeekStart = this.getMonday(today);
          this.buildCalendar();
          this.updateWeekLabel();
          this.renderEvents();
          
          // Thêm hiệu ứng chuyển tuần
          this.animateWeekChange('today');
        });
        
        // Thêm sự kiện resize để tính lại kích thước overlay khi cửa sổ thay đổi kích thước
        window.addEventListener('resize', () => {
          this.calculateOverlayDimensions();
          this.renderEvents();
        });
      }
      
      // Thêm hiệu ứng chuyển tuần
      animateWeekChange(direction) {
        const calendarContainer = document.getElementById('calendarContainer');
        if (!calendarContainer) return;
        
        calendarContainer.classList.add('week-change');
        calendarContainer.classList.add(`week-change-${direction}`);
        
        setTimeout(() => {
          calendarContainer.classList.remove('week-change');
          calendarContainer.classList.remove(`week-change-${direction}`);
        }, 500);
      }
}

// Khởi tạo khi document ready
document.addEventListener('DOMContentLoaded', () => {
    new TeacherSchedule();
});