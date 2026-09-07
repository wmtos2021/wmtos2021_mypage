// pointFirebase.js

import {
    ref,
    get,
    query,
    orderByKey,
    startAt,
    endAt
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../../firebase.js";

// POINT 내역 가져오기
export async function getPointHistory(mobile, monthKey) {
    const monthStart = `${monthKey}-01`;
    const [year, month] = monthKey.split("-").map(Number);
    const lastDate = new Date(year, month, 0).getDate();
    const monthEnd = `${monthKey}-${String(lastDate).padStart(2, "0")}`;

    const attendanceSnapshot = await get(
        query(ref(db, `history/${mobile}/attendance`), orderByKey(), startAt(monthStart), endAt(monthEnd))
    );

    const boardSnapshot = await get(
        query(ref(db, `history/${mobile}/board`), orderByKey(), startAt(monthStart), endAt(monthEnd))
    );

    const rewardSnapshot = await get(
        query(ref(db, `history/${mobile}/reward`), orderByKey(), startAt(monthStart), endAt(monthEnd))
    );

    return {
        attendance: attendanceSnapshot.exists() ? attendanceSnapshot.val() : {},
        board: boardSnapshot.exists() ? boardSnapshot.val() : {},
        reward: rewardSnapshot.exists() ? rewardSnapshot.val() : {}
    };
}

// 오늘 POINT 내역 가져오기
export async function getTodayPointHistory(mobile, dateKey, monthKey) {
    const [attendanceSnapshot, boardSnapshot, rewardSnapshot] = await Promise.all([
        get(ref(db, `history/${mobile}/attendance/${dateKey}`)),
        get(ref(db, `history/${mobile}/board/${dateKey}`)),
        get(ref(db, `history/${mobile}/reward/${monthKey}`))
    ]);

    return {
        attendance: attendanceSnapshot.exists() ? attendanceSnapshot.val() : {},
        board: boardSnapshot.exists() ? boardSnapshot.val() : {},
        reward: rewardSnapshot.exists() ? rewardSnapshot.val() : {}
    };
}