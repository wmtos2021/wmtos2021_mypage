// session.js

import {
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import { auth } from "./firebase.js";

const SESSION_TIME = 5 * 60 * 1000;
const SESSION_KEY = "sessionExpiresAt";

let sessionTimer = null;
let sessionStarted = false;

// 로그인 세션 시작
export function startSession() {
    const expiresAt = Date.now() + SESSION_TIME;

    sessionStorage.setItem(
        SESSION_KEY,
        String(expiresAt)
    );

    startSessionTimer();
}

// 세션 만료 시간 가져오기
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

// 세션 타이머 시작
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

    sessionTimer = setTimeout(
        () => {
            expireSession();
        },
        remaining
    );
}

// 사용자 활동 갱신
function updateSession() {
    if (!sessionStarted) {
        return;
    }

    const expiresAt = getSessionExpiresAt();

    if (!expiresAt) {
        return;
    }

    if (expiresAt <= Date.now()) {
        expireSession();
        return;
    }

    const newExpiresAt = Date.now() + SESSION_TIME;

    sessionStorage.setItem(
        SESSION_KEY,
        String(newExpiresAt)
    );

    startSessionTimer();
}

// 세션 만료
async function expireSession() {
    if (sessionTimer) {
        clearTimeout(sessionTimer);
        sessionTimer = null;
    }

    sessionStarted = false;

    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem("studentInfo");
    sessionStorage.removeItem("deviceInfo");
    sessionStorage.removeItem("attendRecords");
    sessionStorage.removeItem("diligence");

    try {
        await signOut(auth);
    } catch (error) {
        // 로그아웃 실패와 관계없이 로그인 화면으로 이동
    }

    location.replace("../login/login.html");
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
        location.replace("../login/login.html");
        return false;
    }

    if (expiresAt <= Date.now()) {
        await expireSession();
        return false;
    }

    const user = await waitForAuth();

    if (!user) {
        sessionStorage.removeItem(SESSION_KEY);
        location.replace("../login/login.html");
        return false;
    }

    sessionStarted = true;
    startSessionTimer();

    return true;
}

// 사용자 활동 감지
function setupActivityDetection() {
    const events = [
        "click",
        "touchstart",
        "keydown"
    ];

    events.forEach(eventName => {
        document.addEventListener(
            eventName,
            updateSession,
            {
                passive: true
            }
        );
    });
}

// 페이지가 다시 표시될 때 세션 확인
function setupPageShowDetection() {
    window.addEventListener(
        "pageshow",
        async () => {
            if (!sessionStarted) {
                return;
            }

            const expiresAt = getSessionExpiresAt();

            if (
                !expiresAt ||
                expiresAt <= Date.now()
            ) {
                await expireSession();
                return;
            }

            startSessionTimer();
        }
    );
}

// 세션 초기화
setupActivityDetection();
setupPageShowDetection();