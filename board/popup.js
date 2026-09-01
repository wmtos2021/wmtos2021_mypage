// popup.js

import { boardData } from "./boardData.js";
import { getSeoulDate, getSeoulTime } from "../utils.js";
import {
    savePosition,
    updatePoint,
    updateGold,
    saveBoardHistory
} from "./boardFirebase.js";
import { showGiftPopup } from "./gift.js";

// 일반 팝업
export function showPopup(message, image, type = "") {
    return new Promise(resolve => {
        const modal = document.getElementById("specialModal");
        const messageElement = document.getElementById("specialMessage");
        const imageElement = document.getElementById("specialImage");
        const button = document.getElementById("specialCloseBtn");

        messageElement.innerHTML = message;

        if (image) {
            imageElement.src = `../imageBoard/${image}`;
            imageElement.style.display = "block";
        } else {
            imageElement.style.display = "none";
        }

        button.textContent =
            type === "gift"
                ? "선물 개봉"
                : "확인";

        button.onclick = async function() {
            modal.classList.add("hidden");

            if (type === "gift") {
                const prize = await showGiftPopup();
                resolve(prize);
                return;
            }

            resolve(0);
        };

        modal.classList.remove("hidden");
    });
}

// 이동 후 처리
export async function handleMoveResult(moveResult) {
    const deviceInfo = JSON.parse(
        sessionStorage.getItem("deviceInfo")
    );

    const mobile = deviceInfo.mobile;

    const reward = {
        getP: 0,
        getG: 0
    };

    // 은행 통과
    if (moveResult.passedBank) {
        await wait(1500);

        const bankReward =
            await processBoardTile(
                40,
                mobile
            );

        reward.getP += bankReward.getP;
        reward.getG += bankReward.getG;
    }

    // 도착 칸 처리
    const tileReward =
        await processBoardTile(
            moveResult.end,
            mobile
        );

    reward.getP += tileReward.getP;
    reward.getG += tileReward.getG;

    // 현재 위치 저장
    await savePosition(
        mobile,
        moveResult.end
    );

    // 최신 POINT / GOLD / 위치 조회
    if (window.refreshGameStatus) {
        await window.refreshGameStatus();
    }

    // 기록 날짜와 시간
    const rawDate = getSeoulDate();

    const date =
        `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;

    const time = getSeoulTime();

    // 보드 기록 저장
    await saveBoardHistory(
        mobile,
        date,
        time,
        {
            start: moveResult.start,
            dice: moveResult.dice,
            end: moveResult.end,
            type: moveResult.type,
            getP: reward.getP,
            getG: reward.getG,
            useP: 2000
        }
    );

    return reward;
}

// 보드 칸 처리
async function processBoardTile(position, mobile) {
    const tile = boardData[position];

    const reward = {
        getP: 0,
        getG: 0
    };

    if (!tile) {
        return reward;
    }

    // 일반 칸 - POINT
    if (
        tile.type === "normal" &&
        tile.point !== undefined
    ) {
        const point = Number(tile.point);

        await updatePoint(
            mobile,
            point
        );

        reward.getP = point;

        if (point > 0) {
            await showPopup(
                `+${point.toLocaleString()}P를 획득했습니다!`
            );
        } else if (point < 0) {
            await showPopup(
                `${Math.abs(point).toLocaleString()}P가 차감되었습니다!`
            );
        } else {
            await showPopup(
                "아무것도 없습니다!"
            );
        }

        return reward;
    }

    // 일반 칸 - GOLD
    if (
        tile.type === "normal" &&
        tile.gold !== undefined
    ) {
        const gold = Number(tile.gold);

        await updateGold(
            mobile,
            gold
        );

        reward.getG = gold;

        await showPopup(
            `+${gold.toLocaleString()}G를 획득했습니다!`
        );

        return reward;
    }

    // 일반 칸 - 꽝
    if (
        tile.type === "normal" &&
        tile.empty !== undefined
    ) {
        await showPopup(
            "아무것도 없습니다!"
        );

        return reward;
    }

    // 무인도
    if (tile.type === "island") {
        const point = Number(tile.point);

        await updatePoint(
            mobile,
            point
        );

        reward.getP = point;

        const message =
            tile.message[
                Math.floor(
                    Math.random() *
                    tile.message.length
                )
            ];

        await showPopup(
            message,
            tile.image
        );

        return reward;
    }

    // 캠핑
    if (tile.type === "camping") {
        const point = Number(tile.point);

        await updatePoint(
            mobile,
            point
        );

        reward.getP = point;

        const message =
            tile.message[
                Math.floor(
                    Math.random() *
                    tile.message.length
                )
            ];

        await showPopup(
            message,
            tile.image
        );

        return reward;
    }

    // 선물
    if (tile.type === "gift") {
        const message =
            Array.isArray(tile.message)
                ? tile.message[
                    Math.floor(
                        Math.random() *
                        tile.message.length
                    )
                ]
                : tile.message;

        const gold =
            Number(
                await showPopup(
                    message,
                    tile.image,
                    "gift"
                )
            ) || 0;

        if (gold > 0) {
            await updateGold(
                mobile,
                gold
            );
        }

        reward.getG = gold;

        return reward;
    }

    // 은행
    if (tile.type === "bank") {
        const point = Number(tile.point);

        await updatePoint(
            mobile,
            point
        );

        reward.getP = point;

        const message =
            tile.message[
                Math.floor(
                    Math.random() *
                    tile.message.length
                )
            ];

        await showPopup(
            message,
            tile.image
        );

        return reward;
    }

    return reward;
}

// 대기
function wait(ms) {
    return new Promise(
        resolve => setTimeout(resolve, ms)
    );
}