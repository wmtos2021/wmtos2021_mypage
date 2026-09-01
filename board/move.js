// move.js

import { boardData, startPosition } from "./boardData.js";

const playerPin = document.getElementById("playerPin");

let moving = false;

// 말 이동
export async function movePlayer(step) {
    if (moving) return;

    moving = true;

    try {
        let position =
            Number(sessionStorage.getItem("position")) || 0;

        const dice = Number(step);
        const start = position;
        let passedBank = false;

        // 말 이동
        for (let i = 0; i < dice; i++) {
            position++;

            if (position > 40) {
                position = 1;
                passedBank = true;
            }

            sessionStorage.setItem(
                "position",
                String(position)
            );

            updateMarker(position);

            await wait(300);
        }

        const type =
            passedBank
                ? "bank-normal"
                : boardData[position].type;

        return {
            start: start,
            dice: dice,
            end: position,
            type: type,
            passedBank: passedBank
        };
    } finally {
        moving = false;
    }
}

// 말 위치
export function updateMarker(position) {
    const tile =
        Number(position) === 0
            ? startPosition
            : boardData[position];

    if (!tile) return;

    playerPin.style.left =
        tile.x + "%";

    playerPin.style.top =
        tile.y + "%";
}

// 대기
function wait(ms) {
    return new Promise(
        resolve => setTimeout(resolve, ms)
    );
}