const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const input = document.getElementById("typingInput");
const seCorrect = document.getElementById("seCorrect");
const seMiss = document.getElementById("seMiss");
const seResult = document.getElementById("seResult");

const ghostNormal = new Image();
ghostNormal.src = "ghost_normal.png";
const ghostHappy = new Image();
ghostHappy.src = "ghost_happy.png";
const ghostSad = new Image();
ghostSad.src = "ghost_sad.png";

// ---------------------------
// 単語辞書（読み付き）
// ---------------------------
const words = [
  { jp: "雨", hira: "あめ" },
  { jp: "雷", hira: "かみなり" },
  { jp: "虹", hira: "にじ" },
  { jp: "月", hira: "つき" },
  { jp: "青空", hira: "あおぞら" },
  { jp: "曇り", hira: "くもり" },
  { jp: "快晴", hira: "かいせい" },
  { jp: "気球", hira: "ききゅう" },
  { jp: "星座", hira: "せいざ" },
  { jp: "太陽", hira: "たいよう" },
  { jp: "雲間", hira: "くもま" },
  { jp: "凧揚げ", hira: "たこあげ" },
  { jp: "望遠鏡", hira: "ぼうえんきょう" },
  { jp: "夕焼け", hira: "ゆうやけ" },
  { jp: "あられ", hira: "あられ" },
  { jp: "ひょう", hira: "ひょう" },
  { jp: "流れ星", hira: "ながれぼし" },
  { jp: "飛行機", hira: "ひこうき" },
  { jp: "ツバメ", hira: "つばめ" },
  { jp: "トンボ", hira: "とんぼ" }
];

let gameState = "title";
let currentWord = "";
let hiraWord = "";
let romaCandidates = [];

let score = 0;
let timeLimit = 30;
let startTime = 0;

let ghostFace = "normal";
let faceTimer = 0;

let effect = null;

let resultRank = "";
let resultMessage = "";

// ---------------------------
// ひらがな → ローマ字（複数方式対応）
// ---------------------------
function hiraToRoma(hira) {
    const table = {
        "あ":"a","い":"i","う":"u","え":"e","お":"o",
        "か":"ka","き":"ki","く":"ku","け":"ke","こ":"ko",
        "さ":"sa","し":["shi","si"],"す":"su","せ":"se","そ":"so",
        "た":"ta","ち":["chi","ti"],"つ":["tsu","tu"],"て":"te","と":"to",
        "な":"na","に":"ni","ぬ":"nu","ね":"ne","の":"no",
        "は":"ha","ひ":"hi","ふ":["fu","hu"],"へ":"he","ほ":"ho",
        "ま":"ma","み":"mi","む":"mu","め":"me","も":"mo",
        "や":"ya","ゆ":"yu","よ":"yo",
        "ら":"ra","り":"ri","る":"ru","れ":"re","ろ":"ro",
        "わ":"wa","を":"wo","ん":"n",
        "が":"ga","ぎ":"gi","ぐ":"gu","げ":"ge","ご":"go",
        "ざ":"za","じ":["ji","zi"],"ず":"zu","ぜ":"ze","ぞ":"zo",
        "だ":"da","ぢ":["ji","di"],"づ":["zu","du"],"で":"de","ど":"do",
        "ぱ":"pa","ぴ":"pi","ぷ":"pu","ぺ":"pe","ぽ":"po",
        // ★ ここを追加
        "ば":"ba","び":"bi","ぶ":"bu","べ":"be","ぼ":"bo",
        // ★ ここまで
        "きゃ":"kya","きゅ":"kyu","きょ":"kyo",
        "しゃ":["sha","sya"],"しゅ":["shu","syu"],"しょ":["sho","syo"],
        "ちゃ":["cha","tya"],"ちゅ":["chu","tyu"],"ちょ":["cho","tyo"],
        "にゃ":"nya","にゅ":"nyu","にょ":"nyo",
        "ひゃ":"hya","ひゅ":"hyu","ひょ":"hyo",
        "みゃ":"mya","みゅ":"myu","みょ":"myo",
        "りゃ":"rya","りゅ":"ryu","りょ":"ryo"
    };


    let result = [""];
    let i = 0;

    while (i < hira.length) {
        let chunk = hira[i];

        if (i + 1 < hira.length) {
            const two = hira[i] + hira[i + 1];
            if (table[two]) {
                const romaList = Array.isArray(table[two]) ? table[two] : [table[two]];
                result = result.flatMap(r => romaList.map(rr => r + rr));
                i += 2;
                continue;
            }
        }

        const romaList = Array.isArray(table[chunk]) ? table[chunk] : [table[chunk]];
        result = result.flatMap(r => romaList.map(rr => r + rr));
        i++;
    }

    return result;
}

// ---------------------------
// ゲーム開始
// ---------------------------
function startGame() {
    score = 0;
    startTime = Date.now();
    ghostFace = "normal";
    faceTimer = 0;
    effect = null;

    pickWord();

    input.value = "";
    input.disabled = false;
    input.focus();

    gameState = "play";
}

function pickWord() {
    const w = words[Math.floor(Math.random() * words.length)];
    currentWord = w.jp;
    hiraWord = w.hira;
    romaCandidates = hiraToRoma(hiraWord);
}

// ---------------------------
// 判定
// ---------------------------
function checkAnswer() {
    const user = input.value.trim().toLowerCase();

    for (const r of romaCandidates) {
        if (user === r) {
            onCorrect();
            return;
        }
    }
    onMiss();
}

function onCorrect() {
    score++;
    ghostFace = "happy";
    faceTimer = 60;
    effect = { type: "correct", timer: 40 };
    seCorrect.currentTime = 0;
    seCorrect.play();

    pickWord();
    input.value = "";
}

function onMiss() {
    ghostFace = "sad";
    faceTimer = 60;
    effect = { type: "miss", timer: 40 };
    seMiss.currentTime = 0;
    seMiss.play();
}

// ---------------------------
// リザルト評価
// ---------------------------
function evaluateScore() {
    if (score >= 20) {
        resultRank = "達人級！";
        resultMessage = "すごい！あなたはタイピングの達人級！";
    } else if (score >= 10) {
        resultRank = "玄人級！";
        resultMessage = "やるね！あなたは玄人級！";
    } else if (score >= 5) {
        resultRank = "新社会人級！";
        resultMessage = "もっと上を目指そう！";
    } else {
        resultRank = "初心者級！";
        resultMessage = "まだまだ初心者級！がんばろう！";
    }
}

// ---------------------------
// 入力イベント
// ---------------------------
input.addEventListener("keydown", e => {
    if (gameState !== "play") return;
    if (e.key === "Enter") {
        checkAnswer();
    }
});

// ---------------------------
// キー操作（開始・再スタート）
// ---------------------------
document.addEventListener("keydown", e => {
    if (gameState === "title" && e.key === "Enter") {
        startGame();
    } else if (gameState === "result" && e.key === "Enter") {
        gameState = "title";
    }
});

// ---------------------------
// 描画
// ---------------------------
function drawGhost(x, y) {
    let img = ghostNormal;
    if (ghostFace === "happy") img = ghostHappy;
    else if (ghostFace === "sad") img = ghostSad;

    const size = 160;
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
}

function drawEffect(x, y) {
    if (!effect) return;
    const t = effect.timer;
    const progress = (40 - t) / 40;
    const baseRadius = 60 + progress * 40;

    let innerColor, outerColor;
    if (effect.type === "correct") {
        innerColor = "rgba(0,255,255,0.9)";
        outerColor = "rgba(255,255,255,0)";
    } else {
        innerColor = "rgba(255,0,0,0.9)";
        outerColor = "rgba(255,255,255,0)";
    }

    const grad = ctx.createRadialGradient(x, y, 10, x, y, baseRadius + 40);
    grad.addColorStop(0, innerColor);
    grad.addColorStop(1, outerColor);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, baseRadius + 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.stroke();
}

function drawRomaGuide() {
    const user = input.value.trim().toLowerCase();
    const target = romaCandidates[0];

    let matchLen = 0;
    for (let i = 0; i < user.length; i++) {
        if (target[i] === user[i]) matchLen++;
        else break;
    }

    ctx.font = "28px monospace";

    const centerX = canvas.width / 2;
    const y = canvas.height * 0.82;

    // ① 灰色の全体を中央揃えで描く
    ctx.textAlign = "center";
    ctx.fillStyle = "#888";
    ctx.fillText(target, centerX, y);

    // ② 左端の位置を計算（中央揃えのため）
    const fullWidth = ctx.measureText(target).width;
    const leftX = centerX - fullWidth / 2;

    // ③ 青い部分だけ左揃えで重ね描き
    ctx.textAlign = "left";
    ctx.fillStyle = "#4cf";
    ctx.fillText(target.slice(0, matchLen), leftX, y);
}



function drawTitle() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";

    ctx.font = "64px sans-serif";
    ctx.fillText("Ghost Typing", canvas.width / 2, canvas.height * 0.35);

    ctx.font = "28px sans-serif";
    ctx.fillText("Enterキーでスタート", canvas.width / 2, canvas.height * 0.55);
}

function drawPlay() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const elapsed = (Date.now() - startTime) / 1000;
    const remain = Math.max(0, timeLimit - elapsed);

    if (remain <= 0) {
        gameState = "result";
        input.disabled = true;
        seResult.currentTime = 0;
        seResult.play();
        evaluateScore();
    }

    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.font = "24px sans-serif";
    ctx.fillText(`Score: ${score}`, 20, 40);
    ctx.fillText(`Time: ${remain.toFixed(1)}s`, 20, 80);

    const gx = canvas.width / 2;
    const gy = canvas.height * 0.45;

    drawEffect(gx, gy);
    drawGhost(gx, gy);

    ctx.textAlign = "center";
    ctx.font = "32px sans-serif";
    ctx.fillStyle = "#0ff";
    ctx.fillText(currentWord, canvas.width / 2, canvas.height * 0.75);

    drawRomaGuide();
}

function drawResult() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";

    ctx.font = "56px sans-serif";
    ctx.fillText("RESULT", canvas.width / 2, canvas.height * 0.25);

    ctx.font = "32px sans-serif";
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height * 0.40);

    ctx.font = "32px sans-serif";
    ctx.fillText(resultRank, canvas.width / 2, canvas.height * 0.52);

    ctx.font = "22px sans-serif";
    ctx.fillText(resultMessage, canvas.width / 2, canvas.height * 0.60);

    ctx.font = "24px sans-serif";
    ctx.fillText("Enterキーでタイトルへ戻る", canvas.width / 2, canvas.height * 0.80);
}

function update() {
    if (faceTimer > 0) {
        faceTimer--;
        if (faceTimer <= 0) ghostFace = "normal";
    }

    if (effect && effect.timer > 0) {
        effect.timer--;
        if (effect.timer <= 0) effect = null;
    }
}

function loop() {
    update();

    if (gameState === "title") drawTitle();
    else if (gameState === "play") drawPlay();
    else if (gameState === "result") drawResult();

    requestAnimationFrame(loop);
}

input.disabled = true;
loop();
