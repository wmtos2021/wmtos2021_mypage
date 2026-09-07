// attend.js

import {
    getDeviceId,
    getTimestamp,
    getDateFromTimestamp,
    getDayFromTimestamp
} from "../utils.js";

import {
    getClassTime,
    checkTodayAttend,
    saveAttend,
    updateWisdom
} from "./attendFirebase.js";

import {
    checkAcademyDistance,
    ALLOW_DISTANCE
} from "./gps.js";

import {
    showAttendPopup,
    showAttendMessage
} from "./attendPopup.js";

import {getWisdom} from "./wisdom.js";

const deviceId = getDeviceId();

let todayClassTime = null;
let todayWisdom = null;
let todayMobile = null;
let todayClass = null;
let attendanceClass = null;
let attendTimestamp = null;
let todayLatitude = null;
let todayLongitude = null;
let attendProcessing = false;

// loading에서 준비한 학생 정보 가져오기
function getStudentInfo() {
    const data = sessionStorage.getItem("studentInfo");

    if (!data) {
        return null;
    }

    try {
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}

// device 정보 가져오기
function getDeviceInfo() {
    const data = sessionStorage.getItem("deviceInfo");

    if (!data) {
        return null;
    }

    try {
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}

// QR 출석 정보 가져오기
function getAttendanceCheck() {
    const data = sessionStorage.getItem("attendanceCheck");

    if (!data) {
        return null;
    }

    try {
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}

// 오늘 정보 준비
async function loadTodayInfo(showMessage = true) {
    const studentInfo = getStudentInfo();
    const deviceInfo = getDeviceInfo();
    const attendanceCheck = getAttendanceCheck();

    if (!studentInfo || !deviceInfo) {
        if (showMessage) {
            showAttendMessage("학생 정보를 확인할 수 없습니다.");
        }
        return false;
    }

    if (!attendanceCheck) {
        if (showMessage) {
            showAttendMessage("출석체크 QR을 새로 인식해주세요.");
        }
        return false;
    }

    todayMobile = deviceInfo.mobile || null;
    todayWisdom = studentInfo.wisdom || deviceInfo.wisdom || null;
    todayClass = studentInfo.class || deviceInfo.class || {};

    attendanceClass = attendanceCheck.class || null;
    attendTimestamp = attendanceCheck.attendTimestamp || null;
    todayLatitude = attendanceCheck.latitude;
    todayLongitude = attendanceCheck.longitude;

    if (!attendanceClass) {
        if (showMessage) {
            showAttendMessage("출석 수업을 확인할 수 없습니다.");
        }
        return false;
    }

    if (!todayMobile) {
        if (showMessage) {
            showAttendMessage("학생 정보를 확인할 수 없습니다.");
        }
        return false;
    }

    if (!todayClass[attendanceClass]) {
        if (showMessage) {
            showAttendMessage("수강하지 않는 수업입니다.");
        }
        return false;
    }

    return true;
}

// 출석 가능 시간 확인
export function isAttendTimeAvailable(
    classTime,
    timestamp
) {
    if (!classTime || !timestamp) {
        return false;
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    const time = date.toLocaleTimeString(
        "ko-KR",
        {
            timeZone: "Asia/Seoul",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }
    );

    const classParts = String(classTime).split(":");
    const timeParts = time.split(":");

    if (
        classParts.length < 2 ||
        timeParts.length < 2
    ) {
        return false;
    }

    const classHour = Number(classParts[0]);
    const classMinute = Number(classParts[1]);
    const timeHour = Number(timeParts[0]);
    const timeMinute = Number(timeParts[1]);

    if (
        !Number.isFinite(classHour) ||
        !Number.isFinite(classMinute) ||
        !Number.isFinite(timeHour) ||
        !Number.isFinite(timeMinute)
    ) {
        return false;
    }

    const classMinutes =
        classHour * 60 +
        classMinute;

    const timeMinutes =
        timeHour * 60 +
        timeMinute;

    return (
        timeMinutes >= classMinutes - 49 &&
        timeMinutes <= classMinutes + 60
    );
}

// 성실도 달력용 출석 가능 여부
export async function getAttendAvailability() {
    const loaded = await loadTodayInfo(false);

    if (!loaded) {
        return false;
    }

    const className =
        todayClass[attendanceClass];

    if (!className) {
        return false;
    }

    const day =
        getDayFromTimestamp(
            getTimestamp()
        );

    if (!day) {
        return false;
    }

    const classTime =
        await getClassTime(
            attendanceClass,
            className,
            day
        );

    if (!classTime) {
        return false;
    }

    return isAttendTimeAvailable(
        classTime,
        getTimestamp()
    );
}

// 출석 처리
export async function handleAttend() {
    if (attendProcessing) {
        return false;
    }

    attendProcessing = true;

    try {
        const loaded =
            await loadTodayInfo();

        if (!loaded) {
            return false;
        }

        const today =
            getDateFromTimestamp(
                getTimestamp()
            );

        if (!today) {
            showAttendMessage(
                "오늘 날짜를 확인할 수 없습니다."
            );
            return false;
        }

        if (!attendTimestamp) {
            showAttendMessage(
                "출석체크 QR을 새로 인식해주세요."
            );
            return false;
        }

        // QR 유효시간 확인
        const elapsed =
            Date.now() -
            new Date(attendTimestamp).getTime();

        if (
            Number.isNaN(elapsed) ||
            elapsed < 0 ||
            elapsed > 15 * 60 * 1000
        ) {
            showAttendMessage(
                "출석체크 QR을 새로 인식해주세요."
            );
            return false;
        }

        // 학원과의 거리 확인
        const distance =
            checkAcademyDistance(
                todayLatitude,
                todayLongitude
            );

        if (distance > ALLOW_DISTANCE) {
            showAttendMessage(
                "학원에 등원 후 출석해주세요."
            );
            return false;
        }

        // 오늘 수업시간 가져오기
        const className =
            todayClass[attendanceClass];

        if (!className) {
            showAttendMessage(
                "수강하지 않는 수업입니다."
            );
            return false;
        }

        const day =
            getDayFromTimestamp(
                getTimestamp()
            );

        if (!day) {
            showAttendMessage(
                "오늘 요일을 확인할 수 없습니다."
            );
            return false;
        }

        todayClassTime =
            await getClassTime(
                attendanceClass,
                className,
                day
            );

        // 수업이 없는 날
        if (!todayClassTime) {
            showAttendMessage(
                "수업이 없는 날입니다."
            );
            return false;
        }

        // 오늘 해당 수업 이미 출석했는지 확인
        const alreadyAttend =
            await checkTodayAttend(
                todayMobile,
                today,
                attendanceClass
            );

        if (alreadyAttend) {
            showAttendMessage(
                "이미 출석을 완료했어요!"
            );
            return false;
        }

        // 출석 가능 시간 확인
        if (
            !isAttendTimeAvailable(
                todayClassTime,
                attendTimestamp
            )
        ) {
            showAttendMessage(
                "현재는 출석 가능 시간이 아닙니다."
            );
            return false;
        }

        // 출석 상태
        const qrDate =
            new Date(attendTimestamp);

        if (Number.isNaN(qrDate.getTime())) {
            showAttendMessage(
                "출석체크 QR을 새로 인식해주세요."
            );
            return false;
        }

        const qrTime =
            qrDate.toLocaleTimeString(
                "ko-KR",
                {
                    timeZone: "Asia/Seoul",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                }
            );

        const classParts =
            String(todayClassTime).split(":");

        const qrParts =
            qrTime.split(":");

        const classMinutes =
            Number(classParts[0]) * 60 +
            Number(classParts[1]);

        const qrMinutes =
            Number(qrParts[0]) * 60 +
            Number(qrParts[1]);

        let imageAttend = "";
        let point = "";
        let getP = 0;
        let attend = "";
        let attendSc = 0;

        if (qrMinutes < classMinutes) {
            imageAttend =
                "../imageAttend/attend1_투명.webp";
            point = "+ 100P";
            getP = 100;
            attend = "ontime";
            attendSc = 0;
        } else if (
            qrMinutes <
            classMinutes + 10
        ) {
            imageAttend =
                "../imageAttend/attend2_투명.webp";
            point = "+ 80P";
            getP = 80;
            attend = "late10";
            attendSc = 0.5;
        } else {
            imageAttend =
                "../imageAttend/attend3_투명.webp";
            point = "+ 50P";
            getP = 50;
            attend = "late";
            attendSc = 1;
        }

        // 출석, 성실도, POINT 저장
        const result =
            await saveAttend(
                todayMobile,
                today,
                attendanceClass,
                attend,
                attendSc,
                getP
            );

        if (!result.success) {
            if (
                result.reason ===
                "alreadyAttend"
            ) {
                showAttendMessage(
                    "이미 출석을 완료했어요!"
                );
            } else {
                showAttendMessage(
                    "출석 처리 중 오류가 발생했습니다."
                );
            }

            return false;
        }

        // 오늘의 명언
        const wisdom =
            getWisdom(todayWisdom);

        // 출석 결과 팝업
        showAttendPopup(
            imageAttend,
            point,
            wisdom.title,
            wisdom.message,
            async () => {
                todayWisdom =
                    await updateWisdom(
                        deviceId,
                        todayWisdom
                    );

                document.dispatchEvent(
                    new CustomEvent(
                        "attendanceCompleted",
                        {
                            detail: {
                                point: getP,
                                class: attendanceClass,
                                attend,
                                attendSc
                            }
                        }
                    )
                );
            }
        );

        return true;
    } catch (error) {
        showAttendMessage(
            "출석 처리 중 오류가 발생했습니다."
        );
        return false;
    } finally {
        attendProcessing = false;
    }
}