// boardData.js


export const startPosition = {
    type: "start", x: 22.5, y: 78.8
};

export const boardData = [
    null,

    // 1 ~ 9 (왼쪽)
    { type: "normal", gold: 1000, image: "G.webp", x: 8.5, y: 78.8 }, //1
    { type: "normal", point: 700, image: "P.webp", x: 8.5, y: 71.2 }, //2
    { type: "normal", gold: 500, image: "G.webp", x: 8.5, y: 64.6 }, //3
    { type: "normal", gold: 700, image: "G.webp", x: 8.5, y: 57.2 }, //4
    { type: "normal", point: 500, image: "P.webp", x: 8.5, y: 50.0 }, //5
    { type: "normal", empty: 0, image: "꽝.webp", x: 8.5, y: 43.0 }, //6
    { type: "normal", gold: 500, image: "G.webp", x: 8.5, y: 36.0 }, //7
    { type: "normal", point: 1000, image: "P.webp", x: 8.5, y: 28.8 }, //8
    { type: "normal", gold: 500, image: "G.webp", x: 8.5, y: 21.6 }, //9

    // 10 무인도
    {
        type: "island",
        title: "무인도",
        message: [
            "무인도에 갇혔어요!",
            "오늘부터 친구는 코코넛뿐!",
            "구조헬기 올 때까지 대기!",
            "축! 자연인 체험권 당첨!",
            "무인도 입국 심사 완료!"
        ],
        point: -1000,
        image: "무인도.webp",
        x: 8.5,
        y: 11.0
    },

    // 11 ~ 19 (윗줄)
    { type: "normal", gold: 800, image: "G.webp", x: 22.5, y: 11.0 }, //11
    { type: "normal", gold: 1000, image: "G.webp", x: 29.2, y: 11.0 }, //12
    { type: "normal", point: 1300, image: "P.webp", x: 36.0, y: 11.0 }, //13
    { type: "normal", gold: 800, image: "G.webp", x: 43.0, y: 11.0 }, //14
    { type: "normal", empty: 0, image: "꽝.webp", x: 50.0, y: 11.0 }, //15
    { type: "normal", point: 1000, image: "P.webp", x: 56.7, y: 11.0 }, //16
    { type: "normal", gold: 1300, image: "G.webp", x: 63.6, y: 11.0 }, //17
    { type: "normal", gold: 800, image: "G.webp", x: 70.5, y: 11.0 }, //18
    { type: "normal", point: 800, image: "P.webp", x: 77.3, y: 11.0 }, //19

    // 20 캠핑
    {
        type: "camping",
        title: "캠핑",
        message: [
            "자연 속에서 휴식을 즐기자!",
            "텐트 완성, 근데 왜 집에 가고 싶을까!",
            "캠핑이고 뭐고 귀찮긴한데...",
            "캠핑의 꽃은 불멍이지!",
            "벌레와의 전쟁에서 살아남으세요!"
        ],
        point: 5000,
        image: "캠핑.webp",
        x: 84.5,
        y: 10.0
    },

    // 21 ~ 29 (오른쪽)
    { type: "normal", point: 1300, image: "P.webp", x: 84.2, y: 21.6 }, //21
    { type: "normal", gold: 1000, image: "G.webp", x: 84.2, y: 28.6 }, //22
    { type: "normal", gold: 1000, image: "G.webp", x: 84.2, y: 35.7 }, //23
    { type: "normal", point: 1000, image: "P.webp", x: 84.2, y: 42.9 }, //24
    { type: "normal", gold: 1500, image: "G.webp", x: 84.2, y: 50.0 }, //25
    { type: "normal", empty: 0, image: "꽝.webp", x: 84.2, y: 57.2 }, //26
    { type: "normal", point: 1500, image: "P.webp", x: 84.2, y: 64.2 }, //27
    { type: "normal", gold: 1300, image: "G.webp", x: 84.2, y: 71.5 }, //28
    { type: "normal", gold: 1000, image: "G.webp", x: 84.2, y: 78.6 }, //29

    // 30 선물
    {
        type: "gift",
        title: "선물",
        message: [
            "선물을 풀어볼까요?",
            "오늘의 선물을 확인해보세요!",
            "두근두근! 선물상자를 열어보세요!",
            "어떤 선물이 들어있을까요?",
            "행운의 선물상자를 열어보세요!"
        ],
        image: "선물.webp",
        x: 84.2,
        y: 92.5
    },

    // 31 ~ 39 (아래)
    { type: "normal", gold: 1300, image: "G.webp", x: 77.3, y: 92.0 }, //31
    { type: "normal", point: 1700, image: "P.webp", x: 70.5, y: 92.0 }, //32
    { type: "normal", gold: 1700, image: "G.webp", x: 63.6, y: 92.0 }, //33
    { type: "normal", gold: 1300, image: "G.webp", x: 56.7, y: 92.0 }, //34
    { type: "normal", point: 1300, image: "P.webp", x: 50.0, y: 92.0 }, //35
    { type: "normal", gold: 1300, image: "G.webp", x: 43.0, y: 92.0 }, //36
    { type: "normal", empty: 0, image: "꽝.webp", x: 36.0, y: 92.0 }, //37
    { type: "normal", point: 2000, image: "P.webp", x: 29.2, y: 92.0 }, //38
    { type: "normal", gold: 2000, image: "G.webp", x: 22.5, y: 92.0 }, //39

    // 40 은행
    {
        type: "bank",
        title: "은행",
        message: [
            "열심히 한 너에게 주는 선물!",
            "끝까지 완주하다니 정말 대단해!",
            "포기하지 않은 너에게 박수와 응원을 보낸다!",
            "노력이 차곡차곡 쌓여가는 중!",
            "오늘도 한 걸음 성장했네!"
        ],
        point: 1000,
        image: "은행.webp",
        x: 8.5,
        y: 92.0
    }
];