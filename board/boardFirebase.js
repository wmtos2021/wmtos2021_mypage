// boardFirebase.js

import {
    ref,
    get,
    update,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../firebase.js";

// 학생 정보 가져오기
export async function getStudentInfo(mobile) {
    const snapshot = await get(
        ref(db, `student/${mobile}`)
    );

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.val();
}

// 보드게임 기록 가져오기
export async function getBoardRecords(mobile) {
    const snapshot = await get(
        ref(db, `history/${mobile}/board`)
    );

    if (!snapshot.exists()) {
        return {};
    }

    return snapshot.val();
}

// 학생 마지막 위치 저장
export async function savePosition(mobile, position) {
    await update(
        ref(db, `student/${mobile}`),
        {
            lastPosition: Number(position) || 0
        }
    );
}

// POINT 증감
export async function updatePoint(mobile, point) {
    const pointRef = ref(
        db,
        `student/${mobile}/totalP`
    );

    const result = await runTransaction(
        pointRef,
        currentValue => {
            const currentPoint =
                Number(currentValue) || 0;

            return currentPoint + Number(point);
        }
    );

    return Number(
        result.snapshot.val()
    ) || 0;
}

// GOLD 증감
export async function updateGold(mobile, gold) {
    const goldRef = ref(
        db,
        `student/${mobile}/totalG`
    );

    const result = await runTransaction(
        goldRef,
        currentValue => {
            const currentGold =
                Number(currentValue) || 0;

            return Math.max(
                0,
                currentGold + Number(gold)
            );
        }
    );

    return Number(
        result.snapshot.val()
    ) || 0;
}

// 보드게임 기록 저장
export async function saveBoardHistory(
    mobile,
    date,
    time,
    data
) {
    const historyRef = ref(
        db,
        `history/${mobile}/board/${date}/${time}`
    );

    await update(
        historyRef,
        {
            start: Number(data.start) || 0,
            dice: Number(data.dice) || 0,
            end: Number(data.end) || 0,
            type: data.type || "",
            getP: data.getP ?? "",
            getG: data.getG ?? "",
            useP: data.useP ?? 0
        }
    );
}