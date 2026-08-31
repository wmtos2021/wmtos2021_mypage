// studentFirebase.js

import {
    ref,
    get,
    update,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../firebase.js";

// 전월 성실도 가져오기
export async function getPreviousDiligence(mobile, monthKey) {
    const snapshot = await get(
        ref(db, `diligence/${mobile}/${monthKey}`)
    );

    if (!snapshot.exists()) {
        return 100;
    }

    return Number(snapshot.val()) || 0;
}

// 전월 성실도 보상 지급 여부 확인
export async function getRewardStatus(mobile, currentMonth) {
    const snapshot = await get(
        ref(db, `history/${mobile}/reward/${currentMonth}`)
    );

    return snapshot.exists();
}

// 전월 성실도 보상 지급
export async function saveDiligenceReward(
    mobile,
    currentMonth,
    previousMonth,
    score,
    gold,
    point
) {
    const rewardRef = ref(
        db,
        `history/${mobile}/reward/${currentMonth}`
    );

    const rewardSnapshot = await get(rewardRef);

    if (rewardSnapshot.exists()) {
        return false;
    }

    const rewardG = Number(gold) || 0;
    const rewardP = Number(point) || 0;

    if (rewardG > 0) {
        await runTransaction(
            ref(db, `student/${mobile}/totalG`),
            currentValue => {
                const currentG = Number(currentValue) || 0;
                return currentG + rewardG;
            }
        );
    }

    if (rewardP > 0) {
        await runTransaction(
            ref(db, `student/${mobile}/totalP`),
            currentValue => {
                const currentP = Number(currentValue) || 0;
                return currentP + rewardP;
            }
        );
    }

    await update(rewardRef, {
        rewardMonth: previousMonth,
        rewardSc: Number(score) || 0,
        rewardG: rewardG,
        rewardP: rewardP
    });

    return true;
}