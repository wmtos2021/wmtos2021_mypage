// diligenceAttend.js

// 출석 가능 시간
export function isAttendTimeAvailable(
    classTime,
    timestamp
) {
    if (!classTime || !timestamp) {
        return false;
    }

    const match = String(classTime).match(
        /^(\d{1,2}):(\d{2})(?::\d{2})?$/
    );

    if (!match) {
        return false;
    }

    const classHour = Number(match[1]);
    const classMinute = Number(match[2]);

    if (
        classHour > 23 ||
        classMinute > 59
    ) {
        return false;
    }

    const classMinutes =
        classHour * 60 + classMinute;

    const attendDate = new Date(timestamp);

    if (Number.isNaN(attendDate.getTime())) {
        return false;
    }

    const parts = new Intl.DateTimeFormat(
        "en-US",
        {
            timeZone: "Asia/Seoul",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23"
        }
    ).formatToParts(attendDate);

    let hour = 0;
    let minute = 0;

    parts.forEach(part => {
        if (part.type === "hour") {
            hour = Number(part.value);
        }

        if (part.type === "minute") {
            minute = Number(part.value);
        }
    });

    const attendMinutes =
        hour * 60 + minute;

    return (
        attendMinutes >= classMinutes - 30 &&
        attendMinutes <= classMinutes + 60
    );
}

// 출석 버튼 표시 여부
export function shouldShowAttendButton(
    isToday,
    isBeforeEnrollment,
    isFuture,
    selectedSubject,
    attendanceCheck,
    record,
    classTime
) {
    return (
        isToday &&
        !isBeforeEnrollment &&
        !isFuture &&
        Boolean(selectedSubject) &&
        attendanceCheck?.class === selectedSubject &&
        !record &&
        isAttendTimeAvailable(
            classTime,
            attendanceCheck?.attendTimestamp
        )
    );
}

// 출석 버튼 연결
export function bindAttendButton() {
    const attendBtn =
        document.getElementById("todayAttendBtn");

    if (!attendBtn) {
        return;
    }

    if (attendBtn.dataset.bound === "true") {
        return;
    }

    attendBtn.dataset.bound = "true";

    attendBtn.addEventListener(
        "click",
        async () => {
            const {handleAttend} = await import(
                "../../attend/attend.js"
            );

            await handleAttend();
        }
    );
}