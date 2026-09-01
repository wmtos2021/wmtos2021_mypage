// loadingFirebase.js

import {
    ref,
    get,
    query,
    orderByKey,
    startAt,
    endAt,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../firebase.js";
import { getDeviceId } from "../utils.js";

// 이미지 미리 로딩
function preloadImages() {
    const imageList = [
        "../imageAttend/attend_투명.webp",
        "../imageAttend/attend1_투명.webp",
        "../imageAttend/attend2_투명.webp",
        "../imageAttend/attend3_투명.webp",
        "../imageLogin/로그인화면.webp",
        "../imageLogin/학원명1_투명.webp",
        "../imageLogin/로고_투명.webp",
        "../imageBoard/보드판.webp",
        "../imageBoard/보드말.webp",
        "../imageStudent/골드.webp",
        "../imageStudent/성실도.webp",
        "../imageStudent/포인트.webp"
    ];

    imageList.forEach(src => {
        const image = new Image();
        image.src = src;
    });
}

// 학생 기본 정보 및 이번 달 데이터 가져오기
export async function loadStudentData() {
    preloadImages();

    const deviceId = getDeviceId();

    if (!deviceId) {
        return false;
    }

    const deviceSnapshot = await get(
        ref(db, `deviceId/${deviceId}`)
    );

    if (!deviceSnapshot.exists()) {
        return false;
    }

    const deviceInfo = deviceSnapshot.val();
    const mobile = deviceInfo.mobile;

    if (!mobile) {
        return false;
    }

    const studentSnapshot = await get(
        ref(db, `student/${mobile}`)
    );

    if (!studentSnapshot.exists()) {
        return false;
    }

    const studentInfo = studentSnapshot.val();

    const today = new Date().toLocaleDateString("sv-SE", {
        timeZone: "Asia/Seoul"
    });

    const monthKey = today.slice(0, 7);
    const monthStart = `${monthKey}-01`;

    const nextMonth = new Date(
        Number(monthKey.slice(0, 4)),
        Number(monthKey.slice(5, 7)),
        1
    );

    nextMonth.setDate(0);

    const monthEnd =
        `${monthKey}-${String(nextMonth.getDate()).padStart(2, "0")}`;

    // 이번 달 데이터 동시 조회
    const [
        historySnapshot,
        diligenceSnapshot,
        boardSnapshot,
        shopSnapshot,
        rewardSnapshot
    ] = await Promise.all([
        get(
            query(
                ref(db, `history/${mobile}/attendance`),
                orderByKey(),
                startAt(monthStart),
                endAt(monthEnd)
            )
        ),
        get(
            ref(db, `diligence/${mobile}/${monthKey}`)
        ),
        get(
            query(
                ref(db, `history/${mobile}/board`),
                orderByKey(),
                startAt(monthStart),
                endAt(monthEnd)
            )
        ),
        get(
            query(
                ref(db, `history/${mobile}/shop`),
                orderByKey(),
                startAt(monthStart),
                endAt(monthEnd)
            )
        ),
        get(
            query(
                ref(db, `history/${mobile}/reward`),
                orderByKey(),
                startAt(monthKey),
                endAt(monthKey)
            )
        )
    ]);

    const historyData = historySnapshot.exists()
        ? historySnapshot.val()
        : {};

    const boardData = boardSnapshot.exists()
        ? boardSnapshot.val()
        : {};

    const shopData = shopSnapshot.exists()
        ? shopSnapshot.val()
        : {};

    const rewardData = rewardSnapshot.exists()
        ? rewardSnapshot.val()
        : {};

    const diligence = diligenceSnapshot.exists()
        ? Number(diligenceSnapshot.val())
        : 100;

    sessionStorage.setItem(
        "studentInfo",
        JSON.stringify(studentInfo)
    );

    sessionStorage.setItem(
        "deviceInfo",
        JSON.stringify(deviceInfo)
    );

    sessionStorage.setItem(
        "attendRecords",
        JSON.stringify({
            [monthKey]: historyData
        })
    );

    sessionStorage.setItem(
        "diligence",
        String(diligence)
    );

    sessionStorage.setItem(
        "pointHistory",
        JSON.stringify({
            attendance: historyData,
            board: boardData,
            reward: rewardData
        })
    );

    sessionStorage.setItem(
        "goldHistory",
        JSON.stringify({
            board: boardData,
            shop: shopData,
            reward: rewardData
        })
    );

    return true;
}

// 로그인 횟수 증가
export async function updateLoginCount() {
    const deviceId = getDeviceId();

    if (!deviceId) {
        return false;
    }

    const deviceSnapshot = await get(
        ref(db, `deviceId/${deviceId}`)
    );

    if (!deviceSnapshot.exists()) {
        return false;
    }

    const mobile = deviceSnapshot.val().mobile;

    if (!mobile) {
        return false;
    }

    const loginCountRef =
        ref(
            db,
            `student/${mobile}/loginCount`
        );

    await runTransaction(
        loginCountRef,
        currentValue => {
            const currentCount =
                Number(currentValue) || 0;

            return currentCount + 1;
        }
    );

    return true;
}