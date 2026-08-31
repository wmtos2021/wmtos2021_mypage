// studentGoldFirebase.js

import {
    ref,
    get,
    query,
    orderByKey,
    startAt,
    endAt
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../firebase.js";

// GOLD 내역 가져오기
export async function getGoldHistory(mobile, monthKey) {
    const monthStart = `${monthKey}-01`;

    const [year, month] = monthKey.split("-").map(Number);
    const lastDate = new Date(year, month, 0).getDate();
    const monthEnd =
        `${monthKey}-${String(lastDate).padStart(2, "0")}`;

    const boardSnapshot = await get(
        query(
            ref(db, `history/${mobile}/board`),
            orderByKey(),
            startAt(monthStart),
            endAt(monthEnd)
        )
    );

    const shopSnapshot = await get(
        query(
            ref(db, `history/${mobile}/shop`),
            orderByKey(),
            startAt(monthStart),
            endAt(monthEnd)
        )
    );

    const rewardSnapshot = await get(
        query(
            ref(db, `history/${mobile}/reward`),
            orderByKey(),
            startAt(monthKey),
            endAt(monthKey)
        )
    );

    return {
        board: boardSnapshot.exists()
            ? boardSnapshot.val()
            : {},
        shop: shopSnapshot.exists()
            ? shopSnapshot.val()
            : {},
        reward: rewardSnapshot.exists()
            ? rewardSnapshot.val()
            : {}
    };
}