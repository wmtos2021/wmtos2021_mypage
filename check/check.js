// check.js

import {
    getDeviceInfo,
    updateAttendTimestamp,
    getAuthUser
} from "./checkFirebase.js";

const checkMessage = document.getElementById("checkMessage");
const locationModal = document.getElementById("locationModal");
const locationMessage = document.getElementById("locationMessage");
const locationConfirmBtn = document.getElementById("locationConfirmBtn");

// 애니메이션
function dotAnimation() {
    const dot1 = document.querySelector(".dot1");
    const dot2 = document.querySelector(".dot2");
    const dot3 = document.querySelector(".dot3");

    dot1.classList.remove("show");
    dot2.classList.remove("show");
    dot3.classList.remove("show");

    setTimeout(() => {
        dot1.classList.add("show");

        setTimeout(() => {
            dot2.classList.add("show");

            setTimeout(() => {
                dot3.classList.add("show");

                setTimeout(() => {
                    dotAnimation();
                }, 700);
            }, 700);
        }, 700);
    }, 500);
}

dotAnimation();

// Device ID 확인
let deviceId = localStorage.getItem("deviceId");

if (!deviceId) {
    deviceId = crypto.randomUUID();

    localStorage.setItem(
        "deviceId",
        deviceId
    );
}

// 위치정보 확인
function getLocation() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve(position);
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    });
}

// 위치정보 알림
function showLocationMessage(message) {
    return new Promise((resolve) => {
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
    await new Promise(resolve =>
        setTimeout(resolve, 2000)
    );

    location.href = url;
}

// 로그인 확인
async function checkLogin() {
    try {
        const position = await checkLocation();

        if (!position) {
            return;
        }

        // 위치정보 및 QR 인식 시간 갱신
        await updateAttendTimestamp(
            deviceId,
            position.coords.latitude,
            position.coords.longitude
        );

        // Firebase에서 Device ID 확인
        const snapshot = await getDeviceInfo(deviceId);

        // Firebase Authentication 확인
        const user = getAuthUser();
        let isLogin = false;

        // Auth 사용자가 있는 경우
        if (
            user
            && snapshot.exists()
            && snapshot.val().uid === user.uid
        ) {
            isLogin = true;
        }

        // 정상 로그인
        if (isLogin) {
            await movePage("../loading/loading.html");
            return;
        }

        // 로그인 필요
        await movePage("../login/login.html");

    } catch (error) {
        await movePage("../login/login.html");
    }
}

checkLogin();