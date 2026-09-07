// diligenceFirebase.js

import {
    ref,
    get,
    query,
    orderByKey,
    startAt,
    endAt
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../../firebase.js";

// 월 출석 및 성실도 가져오기
export async function getMonthRecords(
    mobile,
    monthKey
) {
    const attendanceRef = ref(
        db,
        `history/${mobile}/attendance`
    );

    const diligenceRef = ref(
        db,
        `diligence/${mobile}/${monthKey}`
    );

    const [year, month] = monthKey.split("-").map(Number);
    const lastDate = new Date(year, month, 0).getDate();

    const monthStart = `${monthKey}-01`;
    const monthEnd = `${monthKey}-${String(lastDate).padStart(2, "0")}`;

    const attendanceQuery =
        query(
            attendanceRef,
            orderByKey(),
            startAt(monthStart),
            endAt(monthEnd)
        );

    const [
        attendanceSnapshot,
        diligenceSnapshot
    ] = await Promise.all([
        get(attendanceQuery),
        get(diligenceRef)
    ]);

    const attendRecords = attendanceSnapshot.exists()
        ? attendanceSnapshot.val()
        : {};

    const diligenceScore = diligenceSnapshot.exists()
        ? Number(diligenceSnapshot.val())
        : null;

    return {
        monthKey,
        attendRecords,
        diligenceScore
    };
}

// 오늘 출석 기록 가져오기
export async function getTodayRecords(
    mobile,
    today
) {
    const attendanceRef = ref(
        db,
        `history/${mobile}/attendance/${today}`
    );

    const snapshot = await get(attendanceRef);

    return snapshot.exists()
        ? snapshot.val()
        : {};
}