// dice.js

import { movePlayer } from "../board/move.js";
import { handleMoveResult } from "../board/popup.js";
import { payDicePoint } from "./diceFirebase.js";

// DOM
const dice = document.getElementById("dice");
const diceBtn = document.getElementById("diceBtn");
const diceModal = document.getElementById("diceModal");
const diceResult = document.getElementById("diceResult");

const alertModal = document.getElementById("alertModal");
const alertMessage = document.getElementById("alertMessage");
const alertCloseBtn = document.getElementById("alertCloseBtn");

let rolling = false;

function showAlert(message) {
    alertMessage.textContent = message;
    alertModal.classList.remove("hidden");
}

function hideAlert() {
    alertModal.classList.add("hidden");
}

// 이벤트
diceBtn.addEventListener("click", rollDice);
alertCloseBtn.addEventListener("click", hideAlert);

// 주사위 굴리기
async function rollDice() {
    if (rolling) return;

    rolling = true;
    diceBtn.disabled = true;

    try {
        await payDicePoint();

        diceModal.classList.remove("hidden");
        diceResult.textContent = "주사위를 굴리는 중...";

        // 결과를 먼저 결정
        const number = Math.floor(Math.random() * 6) + 1;

        // 각 숫자의 최종 회전값
        const faceRotation = {
            1: { x: 0, y: 0 },
            2: { x: 90, y: 0 },
            3: { x: 0, y: -90 },
            4: { x: 0, y: 90 },
            5: { x: -90, y: 0 },
            6: { x: 0, y: 180 }
        };

        // 여러 바퀴 회전 후 결과 면에서 정지
        const spinX = 1800 + faceRotation[number].x;
        const spinY = 1800 + faceRotation[number].y;

        dice.style.transition = "none";
        dice.style.transform = "rotateX(0deg) rotateY(0deg)";

        await wait(50);

        dice.style.transition = 
            "transform 1.5s cubic-bezier(.12,.8,.18,1)";
        dice.style.transform = 
            `rotateX(${spinX}deg) rotateY(${spinY}deg)`;

        await wait(2000);

        diceResult.textContent = `${number} 칸을 이동합니다.`;

        await wait(1600);

        diceModal.classList.add("hidden");

        const moveResult = await movePlayer(number);
        await handleMoveResult(moveResult);
    } catch (error) {
        diceModal.classList.add("hidden");
        showAlert(
            error.message || "주사위를 실행하는 중 오류가 발생했습니다."
        );
    } finally {
        rolling = false;
        diceBtn.disabled = false;
    }
}

// 대기
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}