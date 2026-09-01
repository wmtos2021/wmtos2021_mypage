// gift.js

// 선물 확률
function getGiftPrize() {
    const prizes = [
        { gold: 2000, probability: 11 },
        { gold: 2200, probability: 13 },
        { gold: 2400, probability: 14 },
        { gold: 2600, probability: 14 },
        { gold: 2800, probability: 14 },
        { gold: 3000, probability: 13 },
        { gold: 3200, probability: 8 },
        { gold: 3400, probability: 5 },
        { gold: 3600, probability: 3.5 },
        { gold: 3800, probability: 2 },
        { gold: 4000, probability: 1.2 },
        { gold: 4200, probability: 0.7 },
        { gold: 4400, probability: 0.3 },
        { gold: 4600, probability: 0.2 },
        { gold: 4800, probability: 0.08 },
        { gold: 5000, probability: 0.02 }
    ];

    const rand = Math.random() * 100;
    let cumulative = 0;

    for (const prize of prizes) {
        cumulative += prize.probability;

        if (rand < cumulative) {
            return prize.gold;
        }
    }

    return prizes[prizes.length - 1].gold;
}

// 선물 오픈
export function showGiftPopup() {
    return new Promise(resolve => {
        const modal = document.getElementById("giftModal");
        const giftImage = document.getElementById("giftImage");
        const message = document.getElementById("giftMessage");

        const resultModal = document.getElementById("giftResultModal");
        const resultReward = document.getElementById("giftResultReward");

        const prize = getGiftPrize();

        giftImage.src = "../imageBoard/선물.webp";
        message.textContent = "선물상자를 클릭해보세요!";

        giftImage.onclick = function() {
            giftImage.classList.remove("giftFlash");
            void giftImage.offsetWidth;
            giftImage.classList.add("giftFlash");

            setTimeout(() => {
                modal.classList.add("hidden");

                resultReward.textContent =
                    `+ ${prize.toLocaleString()}G`;

                resultModal.classList.remove("hidden");

                setTimeout(() => {
                    resultModal.classList.add("hidden");
                    resolve(prize);
                }, 2400);
            }, 500);
        };

        modal.classList.remove("hidden");
    });
}