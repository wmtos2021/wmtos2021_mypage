// check.js

import {
    getDeviceInfo,
    getAuthUser
} from "./checkFirebase.js";

import { startSession } from "../end/session.js";

import {
    VERSION,
    ACADEMY_NAME,
    ACADEMY_ADDRESS,
    getDeviceId,
    getTimestamp
} from "../utils.js";

// HTML 요소
const locationModal = document.getElementById("locationModal");
const locationMessage = document.getElementById("locationMessage");
const locationConfirmBtn = document.getElementById("locationConfirmBtn");

const dot1 = document.querySelector(".dot1");
const dot2 = document.querySelector(".dot2");
const dot3 = document.querySelector(".dot3");

const PAGE_DELAY = 2000;
const deviceId = getDeviceId();

const academyName = document.querySelector(".footerLine1");
const academyAddress = document.querySelector(".footerLine2");
const version = document.getElementById("version");

academyName.textContent = ACADEMY_NAME;
academyAddress.textContent = ACADEMY_ADDRESS;
version.textContent = `Ver ${VERSION}`;

// QR 수업 확인
const className =
    new URLSearchParams(location.search).get("class");

// 애니메이션
function dotAnimation() {
    dot1.classList.remove("show");
    dot2.classList.remove("show");
    dot3.classList.remove("show");

    setTimeout(() => {
        dot1.classList.add("show");

        setTimeout(() => {
            dot2.classList.add("show");

            setTimeout(() => {
                dot3.classList.add("show");
                setTimeout(dotAnimation, 700);
            }, 500);
        }, 500);
    }, 500);
}

// 위치정보 확인
function getLocation() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    });
}

// 출석 확인 정보 임시 저장
function saveAttendanceCheck(position) {
    sessionStorage.setItem(
        "attendanceCheck",
        JSON.stringify({
            class: className,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            attendTimestamp: getTimestamp()
        })
    );
}

// 위치정보 알림
function showLocationMessage(message) {
    return new Promise(resolve => {
        locationMessage.textContent = message;
        locationModal.classList.remove("hidden");

        locationConfirmBtn.onclick = () => {
            locationModal.classList.add("hidden");
            resolve();
        };
    });
}

// 위치정보 확인
async function checkLocation() {
    try {
        return await getLocation();
    } catch (error) {
        await showLocationMessage(
            "위치 정보를 확인할 수 없습니다.\n휴대폰 상단 메뉴에서 위치를 켜주세요.\n위치를 켠 후 확인을 눌러주세요."
        );

        try {
            return await getLocation();
        } catch (error) {
            await showLocationMessage(
                "위치 정보를 확인할 수 없습니다.\n잠시 후 다시 실행해주세요."
            );

            return null;
        }
    }
}

// 화면 전환
async function movePage(url) {
    await new Promise(resolve => {
        setTimeout(resolve, PAGE_DELAY);
    });

    location.href = url;
}

// 로그인 확인
async function checkLogin() {
    try {
        // QR 수업 확인
        if (!className) {
            await movePage("../end/end.html?reason=invalidClass");
            return;
        }

        const position = await checkLocation();

        if (!position) {
            return;
        }

        saveAttendanceCheck(position);

        const snapshot = await getDeviceInfo(deviceId);
        const user = getAuthUser();

        const isLogin =
            user &&
            snapshot.exists() &&
            snapshot.val().uid === user.uid;

        if (isLogin) {
            startSession();
            await movePage("../loading/loading.html");
            return;
        }

        await movePage("../login/login.html");
    } catch (error) {
        await movePage("../login/login.html");
    }
}

dotAnimation();
checkLogin();