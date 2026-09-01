// session.js

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import { auth } from "../firebase.js";

const SESSION_TIME = 5 * 60 * 1000;
const SESSION_KEY = "sessionExpiresAt";

let sessionTimer = null;
let sessionStarted = false;
let sessionExpired = false;

// 로그인 세션 시작
export function startSession() {
    sessionStarted = true;
    sessionExpired = false;

    const expiresAt = Date.now() + SESSION_TIME;

    sessionStorage.setItem(
        SESSION_KEY,
        String(expiresAt)
    );

    startSessionTimer();
}

// 세션 만료 시간
function getSessionExpiresAt() {
    const value = sessionStorage.getItem(SESSION_KEY);

    if (!value) {
        return 0;
    }

    const expiresAt = Number(value);

    if (!Number.isFinite(expiresAt)) {
        return 0;
    }

    return expiresAt;
}

// 세션 타이머
function startSessionTimer() {
    if (sessionTimer) {
        clearTimeout(sessionTimer);
    }

    const expiresAt = getSessionExpiresAt();

    if (!expiresAt) {
        return;
    }

    const remaining = expiresAt - Date.now();

    if (remaining <= 0) {
        expireSession();
        return;
    }

    sessionTimer = setTimeout(() => {
        expireSession();
    }, remaining);
}

// 사용자 활동 갱신
function updateSession() {
    if (!sessionStarted || sessionExpired) {
        return;
    }

    const expiresAt = getSessionExpiresAt();

    if (!expiresAt || expiresAt <= Date.now()) {
        expireSession();
        return;
    }

    sessionStorage.setItem(
        SESSION_KEY,
        String(Date.now() + SESSION_TIME)
    );

    startSessionTimer();
}

// 세션 데이터 삭제
function clearSessionData() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem("studentInfo");
    sessionStorage.removeItem("deviceInfo");
    sessionStorage.removeItem("attendRecords");
    sessionStorage.removeItem("diligence");
    sessionStorage.removeItem("pointHistory");
    sessionStorage.removeItem("goldHistory");
}

// 세션 만료
function expireSession() {
    if (sessionExpired) {
        return;
    }

    sessionExpired = true;
    sessionStarted = false;

    if (sessionTimer) {
        clearTimeout(sessionTimer);
        sessionTimer = null;
    }

    clearSessionData();

    location.replace("../end/end.html");
}

// Firebase 로그인 상태 확인
function waitForAuth() {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
                unsubscribe();
                resolve(user);
            }
        );
    });
}

// 보호 페이지 세션 확인
export async function checkSession() {
    const expiresAt = getSessionExpiresAt();

    if (!expiresAt) {
        location.replace("../end/end.html");
        return false;
    }

    if (expiresAt <= Date.now()) {
        expireSession();
        return false;
    }

    const user = await waitForAuth();

    if (!user) {
        clearSessionData();
        location.replace("../end/end.html");
        return false;
    }

    sessionStarted = true;
    sessionExpired = false;

    startSessionTimer();

    return true;
}

// 사용자 활동 감지
function setupActivityDetection() {
    const events = [
        "click",
        "touchstart",
        "pointerdown",
        "keydown",
        "scroll"
    ];

    events.forEach((eventName) => {
        document.addEventListener(
            eventName,
            updateSession,
            { passive: true }
        );
    });
}

// 페이지가 다시 표시될 때 세션 확인
function setupPageShowDetection() {
    window.addEventListener(
        "pageshow",
        async () => {
            if (!sessionStarted || sessionExpired) {
                return;
            }

            const expiresAt = getSessionExpiresAt();

            if (!expiresAt || expiresAt <= Date.now()) {
                expireSession();
                return;
            }

            startSessionTimer();
        }
    );
}

// 세션 초기화
setupActivityDetection();
setupPageShowDetection();