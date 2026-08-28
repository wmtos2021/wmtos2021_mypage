// studentDiligence.js

import {
    handleAttend,
    isAttendAvailable,
    isTodayAttended,
    isDiligenceStatusAvailable
} from "../attend/attend.js";

let currentDate = new Date();
let studentInfo = null;
let attendRecords = {};

// 성실도 데이터 설정
export function setDiligenceData(info, records) {
    studentInfo = info;
    attendRecords = records || {};
}

// 성실도 달력 표시
export function renderDiligenceCalendar() {
    const diligenceContent =
        document.getElementById("diligenceContent");

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const lastDate =
        new Date(
            year,
            month + 1,
            0
        ).getDate();

    const today = new Date();

    // 최근 6개월
    const minDate =
        new Date(
            today.getFullYear(),
            today.getMonth() - 5,
            1
        );

    const isCurrentMonth =
        year === today.getFullYear() &&
        month === today.getMonth();

    const isMinMonth =
        year === minDate.getFullYear() &&
        month === minDate.getMonth();

    diligenceContent.innerHTML = `
        <div class="calendarHeader">
            <button
                type="button"
                class="monthBtn"
                id="prevMonthBtn"
                ${isMinMonth ? "disabled" : ""}>
                ‹
            </button>

            <strong>
                ${year}년 ${month + 1}월
            </strong>

            <button
                type="button"
                class="monthBtn"
                id="nextMonthBtn"
                ${isCurrentMonth ? "disabled" : ""}>
                ›
            </button>
        </div>

        <div class="calendar">
            <div class="dayName">월</div>
            <div class="dayName">화</div>
            <div class="dayName">수</div>
            <div class="dayName">목</div>
            <div class="dayName">금</div>

            ${createCalendarDays(
                year,
                month,
                lastDate,
                isCurrentMonth,
                today
            )}
        </div>
    `;

    document
        .getElementById("prevMonthBtn")
        .addEventListener(
            "click",
            () => {
                if (isMinMonth) return;

                currentDate.setMonth(
                    currentDate.getMonth() - 1
                );

                renderDiligenceCalendar();
            }
        );

    document
        .getElementById("nextMonthBtn")
        .addEventListener(
            "click",
            () => {
                if (isCurrentMonth) return;

                currentDate.setMonth(
                    currentDate.getMonth() + 1
                );

                renderDiligenceCalendar();
            }
        );

    const attendBtn =
        document.getElementById("todayAttendBtn");

    if (attendBtn) {
        attendBtn.addEventListener(
            "click",
            handleAttend
        );
    }
}

// 달력 날짜 생성
function createCalendarDays(
    year,
    month,
    lastDate,
    isCurrentMonth,
    today
) {
    let html = "";

    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();

    if (
        firstDay >= 1 &&
        firstDay <= 5
    ) {
        for (
            let i = 1;
            i < firstDay;
            i++
        ) {
            html += `
                <div class="calendarDay empty"></div>
            `;
        }
    }

    const todayString =
        `${today.getFullYear()}-${String(
            today.getMonth() + 1
        ).padStart(2, "0")}-${String(
            today.getDate()
        ).padStart(2, "0")}`;

    const enrollment =
        studentInfo?.enrollment
            ? String(
                studentInfo.enrollment
            ).slice(0, 10)
            : "";

    for (
        let date = 1;
        date <= lastDate;
        date++
    ) {
        const dayOfWeek =
            new Date(
                year,
                month,
                date
            ).getDay();

        if (
            dayOfWeek === 0 ||
            dayOfWeek === 6
        ) {
            continue;
        }

        const dateString =
            `${year}-${String(
                month + 1
            ).padStart(2, "0")}-${String(
                date
            ).padStart(2, "0")}`;

        const isToday =
            isCurrentMonth &&
            date === today.getDate();

        const record =
            attendRecords[dateString] || null;

        const isBeforeEnrollment =
            enrollment &&
            dateString < enrollment;

        const isFuture =
            dateString > todayString;

        const attended =
            isToday &&
            isTodayAttended();

        const attendAvailable =
            isToday &&
            !isBeforeEnrollment &&
            !attended &&
            isAttendAvailable();

        let attendStatus = "absent";
        let homeworkStatus = "homeworkNotDone";

        // 입학 전 또는 미래
        if (
            isBeforeEnrollment ||
            isFuture
        ) {
            attendStatus = "notStarted";
            homeworkStatus = "notStarted";

        // 출석 기록이 있는 날
        } else if (record) {
            attendStatus =
                getAttendStatus(
                    record.attend
                );

            homeworkStatus =
                getHomeworkStatus(
                    record.homework,
                    isToday
                );

        // 오늘 출석 가능 시간
        } else if (
            isToday &&
            !isDiligenceStatusAvailable()
        ) {
            attendStatus = "notStarted";
            homeworkStatus = "notStarted";

        // 지난 날짜 + 출석 기록 없음
        } else {
            attendStatus = "absent";
            homeworkStatus = "homeworkNotDone";
        }

        html += `
            <div
                class="calendarDay ${
                    isToday ? "today" : ""
                }">

                <span class="dateNumber">
                    ${date}
                </span>

                ${
                    attendAvailable
                        ? `
                            <button
                                type="button"
                                id="todayAttendBtn"
                                class="todayAttendBtn">

                                <img
                                    src="../imageAttend/attend_투명.webp"
                                    alt="출석하기">

                            </button>
                        `
                        : `
                            ${createStatus(
                                "출석",
                                attendStatus
                            )}

                            ${createStatus(
                                "숙제",
                                homeworkStatus
                            )}
                        `
                }

            </div>
        `;
    }

    return html;
}

// 출석 상태 변환
function getAttendStatus(status) {
    if (
        status === "ontime" ||
        status === "onTime"
    ) {
        return "onTime";
    }

    if (status === "late10") {
        return "late10";
    }

    if (status === "late") {
        return "late";
    }

    return "absent";
}

// 숙제 상태 변환
function getHomeworkStatus(
    status,
    isToday
) {
    if (status === "done") {
        return "homeworkDone";
    }

    if (status === "notdone") {
        return "homeworkNotDone";
    }

    if (
        isToday &&
        status === ""
    ) {
        return "notStarted";
    }

    return "homeworkNotDone";
}

// 상태 표시
function createStatus(
    label,
    status
) {
    return `
        <div class="diligenceStatusRow">
            <span>${label}</span>
            <i class="statusDot ${status}"></i>
        </div>
    `;
}