// diligenceCalendar.js

export function getDefaultSubject(studentInfo) {
    const subjects = Object.keys(studentInfo?.subject || {});
    if (!subjects.length) return null;

    const data = sessionStorage.getItem("attendanceCheck");

    if (data) {
        try {
            const subject = JSON.parse(data).subject;

            if (subject && subjects.includes(subject)) {
                return subject;
            }
        } catch (error) {
            return subjects[0];
        }
    }

    return subjects[0];
}

export function renderSubjectTabs(
    studentInfo,
    selectedSubject
) {
    const subjects = Object.keys(studentInfo?.subject || {});
    if (!subjects.length) return "";

    const subjectNames = {
        korean: "국어",
        english: "영어",
        math: "수학",
        social: "사회",
        science: "과학",
        history: "역사"
    };

    return subjects.map(subject => `
        <button
            type="button"
            class="subjectTab ${subject === selectedSubject ? "active" : ""}"
            data-subject="${subject}">
            ${subjectNames[subject] || subject}
        </button>
    `).join("");
}

export function renderCalendarDays({
    year,
    month,
    lastDate,
    todayString,
    studentInfo,
    attendRecords,
    selectedSubject,
    attendanceCheck
}) {
    let html = "";

    const monthRecords = attendRecords || {};
    const firstDay = new Date(year, month, 1).getDay();
    const enrollment = studentInfo?.enrollment
        ? String(studentInfo.enrollment).slice(0, 10)
        : "";

    if (firstDay >= 1 && firstDay <= 5) {
        for (let i = 1; i < firstDay; i++) {
            html += `
                <div class="calendarDay empty"></div>
            `;
        }
    }

    for (let date = 1; date <= lastDate; date++) {
        const dayOfWeek =
            new Date(year, month, date).getDay();

        if (
            dayOfWeek === 0 ||
            dayOfWeek === 6
        ) {
            continue;
        }

        const dateString =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;

        const isToday =
            dateString === todayString;

        const dateData =
            monthRecords[dateString] || {};

        const record =
            dateData[selectedSubject] || null;

        const isBeforeEnrollment =
            Boolean(
                enrollment &&
                dateString < enrollment
            );

        const isFuture =
            dateString > todayString;

        let content = "";

        if (
            !isBeforeEnrollment &&
            !isFuture &&
            record
        ) {
            content =
                renderRecordStatus(record);

        } else if (
            isToday &&
            !isBeforeEnrollment &&
            selectedSubject &&
            attendanceCheck?.subject === selectedSubject &&
            !record
        ) {
            content = `
                <button
                    type="button"
                    id="todayAttendBtn"
                    class="todayAttendBtn">
                    <img
                        src="../imageAttend/attend_투명.webp"
                        alt="출석하기">
                </button>
            `;

        } else {
            content =
                renderRecordStatus(null);
        }

        html += `
            <div
                class="calendarDay ${isToday ? "today" : ""}"
                data-date="${dateString}">

                <span class="dateNumber">
                    ${date}
                </span>

                <div class="calendarDayBody">
                    ${content}
                </div>

            </div>
        `;
    }

    return html;
}

export function renderRecordStatus(record) {
    const attendStatus =
        getAttendStatus(record?.attend);

    const homeworkStatus =
        getHomeworkStatus(record?.homework);

    return `
        <div class="diligenceStatusRow">
            <span>출석</span>
            <i class="statusDot ${attendStatus}"></i>
        </div>

        <div class="diligenceStatusRow">
            <span>숙제</span>
            <i class="statusDot ${homeworkStatus}"></i>
        </div>
    `;
}

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

    if (status === "absent") {
        return "absent";
    }

    return "notStarted";
}

function getHomeworkStatus(status) {
    if (status === "done") {
        return "homeworkDone";
    }

    if (status === "notdone") {
        return "homeworkNotDone";
    }

    return "notStarted";
}