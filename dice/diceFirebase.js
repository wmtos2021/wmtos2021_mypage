// diceFirebase.js

import {
    ref,
    get,
    update
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../firebase.js";

const DICE_COST = 2000;

// 주사위 사용료 차감
export async function payDicePoint() {
    const deviceInfo = JSON.parse(
        sessionStorage.getItem("deviceInfo")
    );

    const mobile = deviceInfo.mobile;

    const pointRef = ref(
        db,
        `student/${mobile}/totalP`
    );

    const snapshot = await get(pointRef);

    if (!snapshot.exists()) {
        throw new Error(
            "포인트 정보를 찾을 수 없습니다."
        );
    }

    const currentPoint =
        Number(snapshot.val()) || 0;

    if (currentPoint < DICE_COST) {
        throw new Error(
            "주사위를 굴리려면 2,000P가 필요합니다."
        );
    }

    const newPoint =
        currentPoint - DICE_COST;

    await update(
        ref(db, `student/${mobile}`),
        {
            totalP: newPoint
        }
    );

    return newPoint;
}