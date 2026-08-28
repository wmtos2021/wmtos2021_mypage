// diligenceCalendar.js

import {
    isAttendAvailable,
    isDiligenceStatusAvailable
} from "../attend/attend.js";

// 달력 날짜 생성
export function renderCalendarDays(
    year,
    month,
    lastDate,
    isCurrentMonth,
    today,
    studentInfo,
    attendRecords
) {
    let html = "";

    const monthKey =
        `${year}-${String(month + 1).padStart(2, "0")}`;

    const monthRecords =
        attendRecords[monthKey] || {};

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
            monthRecords[dateString] || null;

        const isBeforeEnrollment =
            enrollment &&
            dateString < enrollment;

        const isFuture =
            dateString > todayString;

        const attended =
            isToday &&
            !!record;

        const attendAvailable =
            isToday &&
            !isBeforeEnrollment &&
            !attended &&
            isAttendAvailable();

        let attendStatus =
            "absent";

        let homeworkStatus =
            "homeworkNotDone";

        if (
            isBeforeEnrollment ||
            isFuture
        ) {
            attendStatus =
                "notStarted";

            homeworkStatus =
                "notStarted";
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
        } else if (
            isToday &&
            !isDiligenceStatusAvailable()
        ) {
            attendStatus =
                "notStarted";

            homeworkStatus =
                "notStarted";
        } else {
            attendStatus =
                "absent";

            homeworkStatus =
                "homeworkNotDone";
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