// studentFirebase.js

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../firebase.js";

// 이전 2개월 출석 및 성실도 기록 가져오기
export async function getPreviousRecords(mobile) {
    const today = new Date();
    const attendRecords = {};
    const diligenceRecords = {};
    const requests = [];

    for (let i = 1; i <= 2; i++) {
        const date =
            new Date(
                today.getFullYear(),
                today.getMonth() - i,
                1
            );

        const monthKey =
            `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;

        requests.push(
            get(
                ref(
                    db,
                    `history/${mobile}/${monthKey}`
                )
            ).then(snapshot => {
                if (snapshot.exists()) {
                    attendRecords[monthKey] =
                        snapshot.val();
                }
            })
        );

        requests.push(
            get(
                ref(
                    db,
                    `diligence/${mobile}/${monthKey}`
                )
            ).then(snapshot => {
                if (snapshot.exists()) {
                    diligenceRecords[monthKey] =
                        Number(snapshot.val());
                }
            })
        );
    }

    await Promise.all(requests);

    return {
        attendRecords,
        diligenceRecords
    };
}