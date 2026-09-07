// diligenceUi.js

import {
    getCalendarDayData
} from "./diligenceCalendar.js";

import {
    shouldShowAttendButton
} from "./diligenceAttend.js";

// 월 표시
export function renderCalendarHeader(
    currentMonth,
    todayMonth
) {
    const calendarMonth = document.getElementById("calendarMonth");
    const prevMonthBtn = document.getElementById("prevMonthBtn");
    const nextMonthBtn = document.getElementById("nextMonthBtn");

    if (!calendarMonth || !prevMonthBtn || !nextMonthBtn) {
        return;
    }

    const [year, month] = currentMonth.split("-").map(Number);

    calendarMonth.textContent = `${year}년 ${month}월`;
    prevMonthBtn.disabled = currentMonth === getMinMonth(todayMonth);
    nextMonthBtn.disabled = currentMonth === todayMonth;
}

// 최소 월
function getMinMonth(todayMonth) {
    const [year, month] = todayMonth.split("-").map(Number);

    let minYear = year;
    let minMonth = month - 2;

    if (minMonth <= 0) {
        minYear--;
        minMonth += 12;
    }

    return `${minYear}-${String(minMonth).padStart(2, "0")}`;
}

// 과목 탭 표시
export function renderSubjectTabs(
    studentInfo,
    selectedSubject,
    subjectNames,
    subjectOrder
) {
    const subjectTabs = document.getElementById("subjectTabs");

    if (!subjectTabs) {
        return;
    }

    const subjects = Object.keys(studentInfo?.class || {});

    subjectTabs.innerHTML = subjectOrder
        .filter(subject => subjects.includes(subject))
        .map(
            subject => `
                <button
                    type="button"
                    class="subjectTab ${subject === selectedSubject ? "active" : ""}"
                    data-subject="${subject}">
                    ${subjectNames[subject] || subject}
                </button>
            `
        )
        .join("");
}

// 달력 표시
export function renderCalendarDays(
    currentMonth,
    todayString,
    studentInfo,
    attendRecords,
    selectedSubject,
    attendanceCheck,
    classTime
) {
    const calendarDays = document.getElementById("calendarDays");

    if (!calendarDays) {
        return;
    }

    const [year, month] = currentMonth.split("-").map(Number);

    const emptyTemplate = document.getElementById("calendarEmptyTemplate");
    const dayTemplate = document.getElementById("calendarDayTemplate");
    const attendTemplate = document.getElementById("todayAttendTemplate");

    if (!emptyTemplate || !dayTemplate || !attendTemplate) {
        return;
    }

    let html = "";

    const firstDay = new Date(year, month - 1, 1).getDay();
    const lastDate = new Date(year, month, 0).getDate();

    if (firstDay >= 1 && firstDay <= 5) {
        for (let i = 1; i < firstDay; i++) {
            const empty = emptyTemplate.content.firstElementChild.cloneNode(true);
            html += empty.outerHTML;
        }
    }

    for (let date = 1; date <= lastDate; date++) {
        const dayData = getCalendarDayData(
            year,
            month - 1,
            date,
            todayString,
            studentInfo,
            attendRecords,
            selectedSubject
        );

        if (dayData.isWeekend) {
            continue;
        }

        const day = dayTemplate.content.firstElementChild.cloneNode(true);

        if (dayData.isToday) {
            day.classList.add("today");
        }

        day.dataset.date = dayData.dateString;

        const dateNumber = day.querySelector(".dateNumber");
        const body = day.querySelector(".calendarDayBody");

        dateNumber.textContent = date;

        if (
            !dayData.isBeforeEnrollment &&
            !dayData.isFuture &&
            dayData.record
        ) {
            body.innerHTML = renderRecordStatus(dayData.record);
        } else if (
            shouldShowAttendButton(
                dayData.isToday,
                dayData.isBeforeEnrollment,
                dayData.isFuture,
                selectedSubject,
                attendanceCheck,
                dayData.record,
                classTime
            )
        ) {
            body.appendChild(
                attendTemplate.content.firstElementChild.cloneNode(true)
            );
        } else {
            body.innerHTML = renderRecordStatus(null);
        }

        html += day.outerHTML;
    }

    calendarDays.innerHTML = html;
}

// 출석 및 숙제 상태 표시
export function renderRecordStatus(record) {
    const template = document.getElementById("statusRowTemplate");

    if (!template) {
        return "";
    }

    const attendStatus = getAttendStatus(record?.attend);
    const homeworkStatus = getHomeworkStatus(record?.homework);

    const attendRow = template.content.firstElementChild.cloneNode(true);
    const homeworkRow = template.content.firstElementChild.cloneNode(true);

    attendRow.querySelector("span").textContent = "출석";
    attendRow.querySelector("i").classList.add(attendStatus);

    homeworkRow.querySelector("span").textContent = "숙제";
    homeworkRow.querySelector("i").classList.add(homeworkStatus);

    return attendRow.outerHTML + homeworkRow.outerHTML;
}

// 출석 상태
function getAttendStatus(status) {
    if (status === "ontime" || status === "onTime") {
        return "onTime";
    }

    if (status === "late10") {
        return "late10";
    }

    if (status === "late") {
        return "late";
    }

    if (status === "absent") {
        return "absent";
    }

    return "notStarted";
}

// 숙제 상태
function getHomeworkStatus(status) {
    if (status === "done") {
        return "homeworkDone";
    }

    if (status === "notdone") {
        return "homeworkNotDone";
    }

    return "notStarted";
}