// attend.js

import {
    getDeviceId,
    getSeoulDay,
    getSeoulTime
} from "../utils.js";

import {
    getDeviceInfo,
    getClassTime,
    checkTodayAttend,
    saveWisdom,
    updateWisdom,
    saveAttendHistory,
    updateTotalP,
    saveAttendRecord
} from "./attendFirebase.js";

import {
    checkAcademyDistance,
    ALLOW_DISTANCE
} from "./gps.js";

import {
    showAttendPopup,
    showAttendMessage
} from "./attendPopup.js";

import { getWisdom } from "./wisdom.js";

const deviceId = getDeviceId();

let todayClassTime = null;
let todayWisdom = null;
let todayMobile = null;
let todayName = "";
let attendTimestamp = null;
let todayLatitude = null;
let todayLongitude = null;
let attendPointValue = 0;


// 오늘 정보 가져오기
async function loadTodayInfo() {
    const deviceInfo = await getDeviceInfo(deviceId);

    if (!deviceInfo) {
        showAttendMessage("등록된 학원생 정보가 없습니다.");
        return false;
    }

    todayClassTime = await getClassTime(
        deviceInfo.class,
        getSeoulDay()
    );

    todayWisdom = deviceInfo.wisdom;

    if (!todayWisdom) {
        todayWisdom = Math.floor(Math.random() * 24) + 1;

        await saveWisdom(
            deviceId,
            todayWisdom
        );
    }

    todayMobile = deviceInfo.mobile;
    todayName = deviceInfo.name || "";
    attendTimestamp = deviceInfo.attendTimestamp || null;
    todayLatitude = deviceInfo.latitude;
    todayLongitude = deviceInfo.longitude;

    return true;
}


// 오늘 정보 로딩
const todayInfoPromise =
    loadTodayInfo()
        .catch(() => {
            showAttendMessage("학원생이 아닙니다.\n선생님께 문의하세요.");
            return false;
        });


// 오늘 정보 로딩 완료 대기
export async function waitTodayInfo() {
    return await todayInfoPromise;
}


// 출석 버튼 가능 여부
export function isAttendAvailable() {
    if (!todayClassTime) {
        return false;
    }

    const currentTime = getSeoulTime();
    const classParts = todayClassTime.split(":");
    const currentParts = currentTime.split(":");

    const classMinutes =
        Number(classParts[0]) * 60 +
        Number(classParts[1]);

    const currentMinutes =
        Number(currentParts[0]) * 60 +
        Number(currentParts[1]);

    return (
        currentMinutes >= classMinutes - 49 &&
        currentMinutes <= classMinutes + 60
    );
}


// 성실도 상태 표시 가능 여부
export function isDiligenceStatusAvailable() {
    if (!todayClassTime) {
        return false;
    }

    const currentTime = getSeoulTime();
    const classParts = todayClassTime.split(":");
    const currentParts = currentTime.split(":");

    const classMinutes =
        Number(classParts[0]) * 60 +
        Number(classParts[1]);

    const currentMinutes =
        Number(currentParts[0]) * 60 +
        Number(currentParts[1]);

    return currentMinutes >= classMinutes + 90;
}


// 오늘 이미 출석했는지 확인
export async function isTodayAttended() {
    if (!todayMobile) {
        return false;
    }

    const today =
        new Date().toLocaleDateString(
            "sv-SE",
            { timeZone: "Asia/Seoul" }
        );

    return await checkTodayAttend(
        todayMobile,
        today
    );
}


// 출석 처리
export async function handleAttend() {
    try {
        const loaded = await todayInfoPromise;

        if (!loaded) {
            return false;
        }

        // QR 유효시간 확인
        if (
            !attendTimestamp ||
            Date.now() - attendTimestamp > 5 * 60 * 1000
        ) {
            showAttendMessage("출석체크 QR을 새로 인식해주세요.");
            return false;
        }

        // 학원과의 거리 확인
        const distance = checkAcademyDistance(
            todayLatitude,
            todayLongitude
        );

        if (distance > ALLOW_DISTANCE) {
            showAttendMessage("학원에 등원 후 출석해주세요.");
            return false;
        }

        const today =
            new Date().toLocaleDateString(
                "sv-SE",
                { timeZone: "Asia/Seoul" }
            );

        // 오늘 이미 출석한 경우
        if (await isTodayAttended()) {
            showAttendMessage("이미 출석을 완료했어요!");
            return false;
        }

        // 수업이 없는 날
        if (!todayClassTime) {
            showAttendMessage("수업이 없는 날입니다.");
            return false;
        }

        const currentTime = getSeoulTime();
        const classParts = todayClassTime.split(":");
        const currentParts = currentTime.split(":");

        const classMinutes =
            Number(classParts[0]) * 60 +
            Number(classParts[1]);

        const currentMinutes =
            Number(currentParts[0]) * 60 +
            Number(currentParts[1]);

        // 출석 가능 시간 확인
        if (
            currentMinutes < classMinutes - 49 ||
            currentMinutes > classMinutes + 60
        ) {
            showAttendMessage("현재는 출석 가능 시간이 아닙니다.");
            return false;
        }

        // 출석 상태
        let imageAttend = "";
        let point = "";
        let attendStatus = "";

        if (currentMinutes < classMinutes) {
            imageAttend = "../imageAttend/attend1_투명.webp";
            point = "+ 100P";
            attendPointValue = 100;
            attendStatus = "ontime";

        } else if (currentMinutes < classMinutes + 10) {
            imageAttend = "../imageAttend/attend2_투명.webp";
            point = "+ 80P";
            attendPointValue = 80;
            attendStatus = "late10";

        } else {
            imageAttend = "../imageAttend/attend3_투명.webp";
            point = "+ 50P";
            attendPointValue = 50;
            attendStatus = "late";
        }

        // 오늘의 명언
        const wisdom = getWisdom(todayWisdom);

        // 출석 결과 팝업
        showAttendPopup(
            imageAttend,
            point,
            wisdom.title,
            wisdom.message,
            async () => {
                const time =
                    new Date().toLocaleTimeString(
                        "en-GB",
                        {
                            timeZone: "Asia/Seoul",
                            hour12: false
                        }
                    );

                // 출석 기록 저장
                const saved = await saveAttendHistory(
                    todayMobile,
                    today,
                    time,
                    attendPointValue
                );

                // ATTEND 기록 저장
                await saveAttendRecord(
                    todayMobile,
                    today,
                    attendStatus,
                    "",
                    todayName
                );

                // 포인트 누적
                if (saved) {
                    await updateTotalP(
                        todayMobile,
                        attendPointValue
                    );
                }

                // 다음 명언 저장
                todayWisdom = await updateWisdom(
                    deviceId,
                    todayWisdom
                );

                document.dispatchEvent(
                    new CustomEvent("attendanceCompleted")
                );
            }
        );

        return true;

    } catch (error) {
        showAttendMessage("출석 처리 중 오류가 발생했습니다.");
        return false;
    }
}