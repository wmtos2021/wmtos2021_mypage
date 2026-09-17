// shopFirebase.js

import {
    ref,
    get,
    update
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {db} from "../firebase.js";

// 학생 정보 가져오기
export async function getStudentInfo(mobile) {
    if (!mobile) {
        return null;
    }

    const snapshot = await get(
        ref(db, `student/${mobile}`)
    );

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.val();
}

// 교환 신청
export async function requestExchange(
    mobile,
    name,
    product,
    useG,
    currentGold
) {
    if (!mobile || !name || !product) {
        return {
            success: false,
            reason: "INVALID_DATA"
        };
    }

    const requiredGold = Number(useG);
    const current = Number(currentGold);

    if (
        !Number.isFinite(requiredGold) ||
        requiredGold <= 0
    ) {
        return {
            success: false,
            reason: "INVALID_GOLD"
        };
    }

    if (
        !Number.isFinite(current) ||
        current < 0
    ) {
        return {
            success: false,
            reason: "INVALID_CURRENT_GOLD"
        };
    }

    // GOLD 부족
    if (current < requiredGold) {
        return {
            success: false,
            reason: "INSUFFICIENT_GOLD"
        };
    }

    // 차감 후 GOLD
    const updatedGold =
        current - requiredGold;

    // 현재 시간
    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    const hour =
        String(
            now.getHours()
        ).padStart(2, "0");

    const minute =
        String(
            now.getMinutes()
        ).padStart(2, "0");

    const second =
        String(
            now.getSeconds()
        ).padStart(2, "0");

    const dateKey =
        `${year}-${month}-${day}`;

    const timeKey =
        `${hour}:${minute}:${second}`;

    const orderKey =
        `${dateKey} ${timeKey}`;

    // 여러 경로 저장
    const updates = {};

    // GOLD 차감
    updates[
        `student/${mobile}/totalG`
    ] = updatedGold;

    // 주문 접수
    updates[
        `inbox/new/${orderKey}`
    ] = {
        mobile,
        name,
        product,
        type: "order",
        useG: requiredGold
    };

    // GOLD 사용 내역
    updates[
        `history/${mobile}/shop/${dateKey}/${timeKey}`
    ] = {
        product,
        useG: requiredGold
    };

    try {
        await update(
            ref(db),
            updates
        );

        return {
            success: true,
            orderKey,
            totalG: updatedGold
        };

    } catch (error) {
        console.error(
            "교환 신청 실패:",
            error
        );

        return {
            success: false,
            reason: "REQUEST_FAILED"
        };
    }
}