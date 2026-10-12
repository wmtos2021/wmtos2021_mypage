// goldFirebase.js

import {
    ref,
    get,
    query,
    orderByKey,
    startAt,
    endAt
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../../firebase.js";

// GOLD 내역 가져오기
export async function getGoldHistory(mobile, monthKey) {
    const monthStart = `${monthKey}-01`;
    const [year, month] = monthKey.split("-").map(Number);
    const lastDate = new Date(year, month, 0).getDate();
    const monthEnd = `${monthKey}-${String(lastDate).padStart(2, "0")}`;

    const [boardSnapshot, shopSnapshot, rewardSnapshot, schoolSnapshot] = await Promise.all([
        get(query(
            ref(db, `history/${mobile}/board`),
            orderByKey(),
            startAt(monthStart),
            endAt(monthEnd)
        )),
        get(query(
            ref(db, `history/${mobile}/shop`),
            orderByKey(),
            startAt(monthStart),
            endAt(monthEnd)
        )),
        get(ref(db, `history/${mobile}/reward/${monthKey}`)),
        get(query(
            ref(db, `history/${mobile}/school`),
            orderByKey(),
            startAt(monthStart),
            endAt(monthEnd)
        ))
    ]);

    return {
        board: boardSnapshot.exists() ? boardSnapshot.val() : {},
        shop: shopSnapshot.exists() ? shopSnapshot.val() : {},
        reward: rewardSnapshot.exists() ? rewardSnapshot.val() : {},
        school: schoolSnapshot.exists() ? schoolSnapshot.val() : {}
    };
}

// 오늘 GOLD 내역 가져오기
export async function getTodayGoldHistory(mobile, dateKey, monthKey) {
    const [boardSnapshot, shopSnapshot, rewardSnapshot, schoolSnapshot] = await Promise.all([
        get(ref(db, `history/${mobile}/board/${dateKey}`)),
        get(ref(db, `history/${mobile}/shop/${dateKey}`)),
        get(ref(db, `history/${mobile}/reward/${monthKey}`)),
        get(ref(db, `history/${mobile}/school/${dateKey}`))
    ]);

    return {
        board: boardSnapshot.exists() ? boardSnapshot.val() : {},
        shop: shopSnapshot.exists() ? shopSnapshot.val() : {},
        reward: rewardSnapshot.exists() ? rewardSnapshot.val() : {},
        school: schoolSnapshot.exists() ? schoolSnapshot.val() : {}
    };
}