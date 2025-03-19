class TeacherSchedule {
  constructor() {
    this.teacher = JSON.parse(sessionStorage.getItem('currentUser'));
    this.startHour = 7;
    this.endHour = 18;
    this.currentWeekStart = this.getMonday(new Date());
    this.dayMapping = {
      "Monday": 1,
      "Tuesday": 2,
      "Wednesday": 3,
      "Thursday": 4,
      "Friday": 5,
      "Saturday": 6,
      "Sunday": 7
    };
    this.scheduleStart = null;
    this.scheduleEnd = null;

    this.showLoading();
    this.init();
  }

  init() {
    this.buildCalendar();
    this.loadSchedule();
    this.updateWeekLabel();
    this.initNavigation();
  }

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

  hideLoading() {
    const loadingDiv = document.querySelector('.calendar-loading');
    if (loadingDiv) {
      loadingDiv.classList.add('fade-out');
      setTimeout(() => {
        loadingDiv.remove();
      }, 500);
    }
  }

  getMonday(d) {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  buildCalendar() {
    const calendarContainer = document.getElementById('calendarContainer');
    if (!calendarContainer) {
      console.error("Element #calendarContainer not found.");
      return;
    }
    calendarContainer.innerHTML = '';
    const calendar = document.createElement('div');
    calendar.className = 'calendar';

    const cornerCell = document.createElement('div');
    cornerCell.className = 'time-slot';
    cornerCell.innerHTML = '<i class="fas fa-clock"></i>';
    calendar.appendChild(cornerCell);

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(this.currentWeekStart);
      dayDate.setDate(dayDate.getDate() + i);
      const dayHeader = document.createElement('div');
      dayHeader.className = 'day-header';

      const today = new Date();
      if (dayDate.getDate() === today.getDate() &&
        dayDate.getMonth() === today.getMonth() &&
        dayDate.getFullYear() === today.getFullYear()) {
        dayHeader.classList.add('today');
      }

      dayHeader.innerHTML = `
        <span class="day-name">${dayDate.toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
        <span class="day-date">${dayDate.getDate()}</span>
        <span class="day-month">${dayDate.toLocaleDateString('vi-VN', { month: 'short' })}</span>
      `;
      calendar.appendChild(dayHeader);
    }

    for (let hour = this.startHour; hour < this.endHour; hour++) {
      const timeSlot = document.createElement('div');
      timeSlot.className = 'time-slot';
      timeSlot.innerHTML = `<span>${hour}:00</span>`;
      calendar.appendChild(timeSlot);

      for (let i = 0; i < 7; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';

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

    this.calculateOverlayDimensions();
  }

  calculateOverlayDimensions() {
    const calendarWrapper = document.getElementById('calendarWrapper');
    const eventOverlay = document.getElementById('eventOverlay');
    const calendar = document.querySelector('.calendar');

    if (!calendarWrapper || !eventOverlay || !calendar) return;

    const timeSlot = document.querySelector('.time-slot');
    if (!timeSlot) return;

    const calendarRect = calendar.getBoundingClientRect();
    const timeSlotRect = timeSlot.getBoundingClientRect();

    eventOverlay.style.top = '60px';
    eventOverlay.style.left = timeSlotRect.width + 'px';
    eventOverlay.style.width = (calendarRect.width - timeSlotRect.width) + 'px';
    eventOverlay.style.height = (calendarRect.height - 60) + 'px';
  }

  async loadSchedule() {
    try {
      const response = await fetch(`https://localhost:7231/ScheduleTeachers/GetOneTeacherSchedule?id=${this.teacher.teacherId}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const scheduleData = await response.json();

      this.schedule = scheduleData;

      if (this.schedule && this.schedule.length > 0) {
        const earliest = new Date(Math.min(...this.schedule.map(item => new Date(item.lessonDate))));
        this.scheduleStart = this.getMonday(earliest);
        this.scheduleEnd = new Date(this.scheduleStart);
        this.scheduleEnd.setDate(this.scheduleEnd.getDate() + 12 * 7);
      } else {
        this.scheduleStart = this.getMonday(new Date());
        this.scheduleEnd = new Date(this.scheduleStart);
      }

      if (this.currentWeekStart < this.scheduleStart) {
        this.currentWeekStart = new Date(this.scheduleStart);
      }

      this.hideLoading();
      this.renderEvents();
      this.updateWeekLabel();
    } catch (error) {
      console.error('Failed to load schedule:', error);
      this.showErrorMessage('Không thể tải lịch dạy. Vui lòng thử lại sau.');
      this.hideLoading();
    }
  }

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

    errorDiv.querySelector('.retry-btn').addEventListener('click', () => {
      errorDiv.remove();
      this.showLoading();
      this.loadSchedule();
    });
  }

  renderEvents() {
    const eventOverlay = document.getElementById('eventOverlay');
    if (!eventOverlay) return;
    eventOverlay.innerHTML = '';

    const overlayWidth = eventOverlay.offsetWidth;
    const dayColumnWidth = overlayWidth / 7;
    const hourHeight = 60;

    if (!this.schedule || this.schedule.length === 0) {
      const noScheduleDiv = document.createElement('div');
      noScheduleDiv.className = 'no-schedule';
      noScheduleDiv.innerHTML = `
        <i class="fas fa-calendar-times"></i>
        <p>Không có lịch dạy trong tuần này</p>
      `;
      eventOverlay.appendChild(noScheduleDiv);
      return;
    }

    this.schedule.forEach((item, index) => {
      const eventDate = new Date(this.currentWeekStart);
      eventDate.setDate(eventDate.getDate() + (this.dayMapping[item.dayOfWeek] - 1));

      if (eventDate < this.scheduleStart || eventDate >= this.scheduleEnd) return;

      const start = this.parseTime(item.startTime);
      const end = this.parseTime(item.endTime);
      const startTotalMinutes = start.hours * 60 + start.minutes;
      const endTotalMinutes = end.hours * 60 + end.minutes;
      const calendarStartMinutes = this.startHour * 60;

      const offsetMinutes = startTotalMinutes - calendarStartMinutes;
      const durationMinutes = endTotalMinutes - startTotalMinutes;

      const top = (offsetMinutes / 60) * hourHeight;
      const height = (durationMinutes / 60) * hourHeight;
      const left = (this.dayMapping[item.dayOfWeek] - 1) * dayColumnWidth;

      const eventDiv = document.createElement('div');
      eventDiv.className = 'event';
      eventDiv.style.animationDelay = `${index * 0.1}s`;


      const eventTitle = item.subjectName;
      const eventColor =  'default';
      const eventClass = item.cohortName;
      const eventRoom = item.location;

      eventDiv.classList.add(`event-${eventColor}`);

      const formattedStartTime = item.startTime.slice(0, 5);
      const formattedEndTime = item.endTime.slice(0, 5);

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

      eventDiv.style.top = `${top}px`;
      eventDiv.style.left = `${left}px`;
      eventDiv.style.height = `${height}px`;
      eventDiv.style.width = `${dayColumnWidth - 2}px`;

      eventDiv.setAttribute('data-bs-toggle', 'tooltip');
      eventDiv.setAttribute('data-bs-placement', 'top');
      eventDiv.setAttribute('title', `${eventTitle} - ${eventClass} - ${eventRoom}`);

      eventDiv.addEventListener('click', () => {
        this.showEventDetails(item);
      });

      eventOverlay.appendChild(eventDiv);
    });

    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
      const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
      });
    }
  }

  showEventDetails(event) {
    const eventTitle = event.subjectName;
    const eventClass = event.cohortName;
    const eventRoom = event.location;
    const eventDay = this.getVietnameseDayName(event.dayOfWeek);
    const eventStartTime = event.startTime.slice(0, 5);
    const eventEndTime = event.endTime.slice(0, 5);

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

    const modal = new bootstrap.Modal(modalDiv);
    modal.show();

    modalDiv.addEventListener('hidden.bs.modal', function () {
      modalDiv.remove();
    });
  }

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

  parseTime(timeStr) {
    const parts = timeStr.split(":");
    return {
      hours: parseInt(parts[0], 10),
      minutes: parseInt(parts[1], 10)
    };
  }

  updateWeekLabel() {
    const weekLabel = document.getElementById('weekLabel');
    const start = new Date(this.currentWeekStart);
    const end = new Date(this.currentWeekStart);
    end.setDate(end.getDate() + 6);

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

  initNavigation() {
    document.getElementById('prevWeek').addEventListener('click', () => {
      this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
      this.buildCalendar();
      this.updateWeekLabel();
      this.renderEvents();
      this.animateWeekChange('prev');
    });

    document.getElementById('nextWeek').addEventListener('click', () => {
      this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
      this.buildCalendar();
      this.updateWeekLabel();
      this.renderEvents();
      this.animateWeekChange('next');
    });

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
      this.animateWeekChange('today');
    });

    window.addEventListener('resize', () => {
      this.calculateOverlayDimensions();
      this.renderEvents();
    });
  }

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

document.addEventListener('DOMContentLoaded', () => {
  new TeacherSchedule();
});
