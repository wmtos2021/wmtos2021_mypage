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
export function showPopup(message, image, type = "", reward = "") {
    return new Promise(resolve => {
        const modal = document.getElementById("popupModal");
        const messageElement = document.getElementById("popupMessage");
        const rewardElement = document.getElementById("popupReward");
        const imageElement = document.getElementById("popupImage");

        // 팝업 문구
        messageElement.innerHTML = message;
        messageElement.style.display = message ? "block" : "none";

        // 보상 문구
        rewardElement.innerHTML = reward;
        rewardElement.style.display = reward ? "block" : "none";

        // 팝업 이미지
        if (image) {
            imageElement.src = `../imageBoard/${image}`;
            imageElement.style.display = "block";
        } else {
            imageElement.style.display = "none";
        }

        modal.classList.remove("hidden");

        // 일반 팝업은 1.8초, 은행/무인도/캠핑은 2.4초
        const duration = ["bank", "island", "camping"].includes(type) ? 2400 : 1800;

        setTimeout(() => {
            modal.classList.add("hidden");
            resolve(0);
        }, duration);
    });
}

// 이동 후 처리
export async function handleMoveResult(moveResult) {
    const deviceInfo = JSON.parse(sessionStorage.getItem("deviceInfo"));
    const mobile = deviceInfo.mobile;

    const reward = {
        getP: 0,
        getG: 0
    };

    // 은행 도착
    if (moveResult.reachedBank) {
        const bankResult = await processBoardTile(40, mobile);

        reward.getP += bankResult.getP;
        reward.getG += bankResult.getG;

        if (bankResult.popup) {
            await showPopup(
                bankResult.popup.message,
                bankResult.popup.image,
                bankResult.popup.type || "",
                bankResult.popup.reward || ""
            );
        }
    }

    // 도착 칸 처리
    const tileResult = moveResult.end === 40
        ? { getP: 0, getG: 0, popup: null, gift: null }
        : await processBoardTile(moveResult.end, mobile);

    reward.getP += tileResult.getP;
    reward.getG += tileResult.getG;

    // 현재 위치 저장
    await savePosition(mobile, moveResult.end);

    // 기록 날짜와 시간
    const rawDate = getSeoulDate();
    const date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
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

    // 도착 칸 팝업
    if (tileResult.popup) {
        await showPopup(
            tileResult.popup.message,
            tileResult.popup.image,
            tileResult.popup.type || "",
            tileResult.popup.reward || ""
        );
    }

    // 선물 팝업
    if (tileResult.gift) {
        await showGiftPopup(tileResult.gift);
    }

    // 최신 POINT / GOLD / 위치 조회
    if (window.refreshGameStatus) {
        await window.refreshGameStatus();
    }

    return reward;
}

// 보드 칸 처리
async function processBoardTile(position, mobile) {
    const tile = boardData[position];

    const result = {
        getP: 0,
        getG: 0,
        popup: null,
        gift: null
    };

    if (!tile) {
        return result;
    }

    // 일반 칸 - POINT
    if (tile.type === "normal" && tile.point !== undefined) {
        const point = Number(tile.point);

        await updatePoint(mobile, point);

        result.getP = point;
        result.popup = {
            message: "",
            image: tile.image,
            reward: `+ ${point.toLocaleString()}P`
        };

        return result;
    }

    // 일반 칸 - GOLD
    if (tile.type === "normal" && tile.gold !== undefined) {
        const gold = Number(tile.gold);

        await updateGold(mobile, gold);

        result.getG = gold;
        result.popup = {
            message: "",
            image: tile.image,
            reward: `+ ${gold.toLocaleString()}G`
        };

        return result;
    }

    // 일반 칸 - 꽝
    if (tile.type === "normal" && tile.empty !== undefined) {
        result.popup = {
            message: "",
            image: tile.image,
            reward: "다음 기회에"
        };

        return result;
    }

    // 무인도
    if (tile.type === "island") {
        const point = Number(tile.point);

        await updatePoint(mobile, point);

        result.getP = point;

        const message = tile.message[
            Math.floor(Math.random() * tile.message.length)
        ];

        result.popup = {
            message,
            image: tile.image,
            reward: `- ${Math.abs(point).toLocaleString()}P`,
            type: "island"
        };

        return result;
    }

    // 캠핑
    if (tile.type === "camping") {
        const point = Number(tile.point);

        await updatePoint(mobile, point);

        result.getP = point;

        const message = tile.message[
            Math.floor(Math.random() * tile.message.length)
        ];

        result.popup = {
            message,
            image: tile.image,
            reward: `+ ${point.toLocaleString()}P`,
            type: "camping"
        };

        return result;
    }

    // 선물
    if (tile.type === "gift") {
        result.gift = {
            message: Array.isArray(tile.message)
                ? tile.message[
                    Math.floor(Math.random() * tile.message.length)
                ]
                : tile.message
        };

        return result;
    }

    // 은행
    if (tile.type === "bank") {
        const point = Number(tile.point);

        await updatePoint(mobile, point);

        result.getP = point;

        const message = tile.message[
            Math.floor(Math.random() * tile.message.length)
        ];

        result.popup = {
            message,
            image: tile.image,
            reward: `+ ${point.toLocaleString()}P`,
            type: "bank"
        };

        return result;
    }

    return result;
}