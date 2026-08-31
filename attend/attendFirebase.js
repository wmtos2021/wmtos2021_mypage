// attendFirebase.js

import {
    ref,
    get,
    update,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../firebase.js";

// Device ID로 학생 정보 가져오기
export async function getDeviceInfo(deviceId) {
    const snapshot = await get(ref(db, `deviceId/${deviceId}`));
    if (!snapshot.exists()) {
        return null;
    }
    return snapshot.val();
}

// 학생 정보 가져오기
export async function getStudentInfo(mobile) {
    const snapshot = await get(ref(db, `student/${mobile}`));
    if (!snapshot.exists()) {
        return null;
    }
    return snapshot.val();
}

// 학생 출석 기록 가져오기
export async function getAttendRecords(mobile) {
    const snapshot = await get(ref(db, `history/${mobile}/attendance`));
    if (!snapshot.exists()) {
        return {};
    }
    return snapshot.val();
}

// 학생 성실도 전체 기록 가져오기
export async function getDiligenceRecords(mobile) {
    const snapshot = await get(ref(db, `diligence/${mobile}`));
    if (!snapshot.exists()) {
        return {};
    }
    return snapshot.val();
}

// 오늘 출석 여부 확인
export async function checkTodayAttend(mobile, date) {
    const snapshot = await get(ref(db, `history/${mobile}/attendance/${date}`));
    return snapshot.exists();
}

// 반의 오늘 수업시간 가져오기
export async function getClassTime(className, day) {
    const snapshot = await get(ref(db, `class/${className}/${day}`));
    if (!snapshot.exists()) {
        return null;
    }
    return snapshot.val();
}

// Wisdom 번호 저장
export async function saveWisdom(deviceId, wisdom) {
    await update(ref(db, `deviceId/${deviceId}`), {
        wisdom: wisdom
    });
}

// 다음 Wisdom 번호 저장
export async function updateWisdom(deviceId, wisdom) {
    let nextWisdom = Number(wisdom) + 1;
    if (nextWisdom > 24) {
        nextWisdom = 1;
    }
    await update(ref(db, `deviceId/${deviceId}`), {
        wisdom: nextWisdom
    });
    return nextWisdom;
}

// 출석 기록 저장
export async function saveAttendHistory(mobile, date, time, attend, attendSc, getP) {
    const historyRef = ref(db, `history/${mobile}/attendance/${date}/${time}`);
    const snapshot = await get(historyRef);

    if (snapshot.exists()) {
        return false;
    }

    await update(historyRef, {
        attend: attend,
        attendP: getP,
        attendSc: attendSc,
        homework: "",
        homeworkP: "",
        homeworkSc: 0
    });

    await updateDiligence(mobile, date, attendSc);

    return true;
}

// 성실도 저장 및 차감
export async function updateDiligence(mobile, date, attendSc) {
    const month = String(date).slice(0, 7);
    const diligenceRef = ref(db, `diligence/${mobile}/${month}`);
    const result = await runTransaction(diligenceRef, currentValue => {
        const currentScore = currentValue === null ? 100 : Number(currentValue);
        const deduction = Number(attendSc) || 0;
        return Math.max(0, currentScore - deduction);
    });
    return Number(result.snapshot.val()) || 0;
}

// 성실도 가져오기
export async function getDiligence(mobile, date) {
    const month = String(date).slice(0, 7);
    const diligenceRef = ref(db, `diligence/${mobile}/${month}`);
    const snapshot = await get(diligenceRef);
    if (!snapshot.exists()) {
        return 100;
    }
    return Number(snapshot.val()) || 0;
}

// 학생 Total Point 누적
export async function updateTotalP(mobile, point) {
    const totalPRef = ref(db, `student/${mobile}/totalP`);
    await runTransaction(totalPRef, currentValue => {
        const currentP = Number(currentValue) || 0;
        return currentP + Number(point);
    });
}