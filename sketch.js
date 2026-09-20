const craneMaster = {
    "13t クラス": [{ id: "KRM-13H-F2H", name: "KRM-13H-F2H" }],
    "16t・20t クラス": [
        { id: "16t_G3", name: "16t (G3)" },
        { id: "16t_G4", name: "16t (G4)" },
        { id: "16t_G5", name: "16t (G5)" },
        { id: "20t_G4", name: "20t (G4)" }
    ]
};

function initCraneSelector() {
    const container = document.getElementById("crane-selector");
    if (!container) return;

    for (const [className, cranes] of Object.entries(craneMaster)) {
        const section = document.createElement("div");
        section.className = "crane-section";

        const header = document.createElement("div");
        header.className = "crane-header";
        header.textContent = `▼ ${className}`;
        header.onclick = () => section.classList.toggle("open");

        const content = document.createElement("div");
        content.className = "crane-content";

        cranes.forEach(crane => {
            const btn = document.createElement("button");
            btn.className = "crane-btn";
            btn.textContent = crane.name;
            btn.onclick = () => window.location.href = `crane-detail.html?id=${crane.id}`;
            content.appendChild(btn);
        });

        section.appendChild(header);
        section.appendChild(content);
        container.appendChild(section);
    }
}

document.getElementById('clear-cache-btn')?.addEventListener('click', () => {
    localStorage.clear();
    alert('キャッシュをクリアしました。ページを再読み込みします。');
    location.reload();
});

// sketch.js
const BaseDataSheetUrls = {
    "KRM-13H-F2H": "https://script.google.com/macros/s/AKfycbzDnWVNkIFI0BTX_BpJAZxKEfPn2EVjZxovyBSEY2zEb7-gD3AOejB01Cl6y0G91k_t/exec",
    "KRM13HF2H": "https://script.google.com/macros/s/AKfycbzDnWVNkIFI0BTX_BpJAZxKEfPn2EVjZxovyBSEY2zEb7-gD3AOejB01Cl6y0G91k_t/exec"
};

// メモリ用キャッシュ
const craneDataCache = {};

async function getCraneData(model) {
    if (craneDataCache[model]) return craneDataCache[model];

    const localData = localStorage.getItem(`crane_data_${model}`);
    if (localData) {
        try {
            const parsedData = JSON.parse(localData);
            craneDataCache[model] = parsedData;
            console.log(`[Cache Hit] localStorageから ${model} のデータを読み出しました`);
            return parsedData;
        } catch (e) {
            console.warn("キャッシュのパースに失敗したため再取得します", e);
            localStorage.removeItem(`crane_data_${model}`);
        }
    }

    const url = BaseDataSheetUrls[model];
    if (!url) {
        console.error(`モデル ${model} のURLが設定されていません。`);
        return null;
    }

    try {
        console.log(`[Fetch API] GASから ${model} のデータを新規取得します...`);
        const response = await fetch(url);
        const data = await response.json();

        craneDataCache[model] = data;
        localStorage.setItem(`crane_data_${model}`, JSON.stringify(data));
        return data;
    } catch (error) {
        console.error("データ取得エラー:", error);
        return null;
    }
}

async function fetchCraneDataPreset(model, MaxHolizon, MaxHight, XsizeHolizon) {
    const data = await getCraneData(model);
    if (!data) return null;

    const xlabelsGroup = document.getElementById('axis-labels-x');
    const xlinesGroup = document.getElementById('grid-lines-x');
    const ylabelsGroup = document.getElementById('axis-labels-y');
    const ylinesGroup = document.getElementById('grid-lines-y');

    if (xlabelsGroup) xlabelsGroup.innerHTML = '';
    if (xlinesGroup) xlinesGroup.innerHTML = '';
    if (ylabelsGroup) ylabelsGroup.innerHTML = '';
    if (ylinesGroup) ylinesGroup.innerHTML = '';

    const scale = 10;

    let xlinesHTML = '';
    let xlabelsHTML = '';
    const XmaxVal = MaxHolizon / 10;
    for (let i = 0; i <= XmaxVal; i += 1) {
        const isMultipleOfFive = (i % 5 === 0);
        const dashStyle = isMultipleOfFive ? '' : 'stroke-dasharray="2,2"';
        const xPos = i * scale;

        xlinesHTML += `<line x1="${xPos}" y1="0" x2="${xPos}" y2="${MaxHight}" stroke="#444" stroke-width="1" ${dashStyle} />`;
        if (isMultipleOfFive) {
            xlabelsHTML += `<text id="x-label-${i}" x="${xPos}" y="0">${i}</text>`;
        }
    }
    if (xlinesGroup) xlinesGroup.innerHTML = xlinesHTML;
    if (xlabelsGroup) {
        xlabelsGroup.innerHTML = xlabelsHTML;
        xlabelsGroup.setAttribute('transform', `translate(0, ${MaxHight})`);
    }

    let ylinesHTML = '';
    let ylabelsHTML = '';
    const ymaxVal = MaxHight / 10;
    for (let i = 0; i <= ymaxVal; i += 1) {
        const isMultipleOfFive = (i % 5 === 0);
        const isMultipleLastFive = (i < 5);

        const dashStyle = isMultipleOfFive ? '' : 'stroke-dasharray="2,2"';
        const dashStyle2 = isMultipleLastFive ? 0 : XsizeHolizon;
        const yPos = MaxHight - i * scale;

        ylinesHTML += `<line x1="${dashStyle2}" y1="${yPos}" x2="${MaxHolizon}" y2="${yPos}" stroke="#444" stroke-width="1" ${dashStyle} />`;
        if (isMultipleOfFive) {
            ylabelsHTML += `<text id="y-label-${i}" x="-30" y="${yPos}">${i}</text>`;
        }
    }
    if (ylinesGroup) ylinesGroup.innerHTML = ylinesHTML;
    if (ylabelsGroup) ylabelsGroup.innerHTML = ylabelsHTML;

    return data;
}

// グローバル状態管理
let BoomAngle = 0;
let BoomWidth = 0;
let SB = 0;
let jibB = 0;
let minAngle;
let maxAngle;

// ボタンイベント設定
const SBB = document.getElementById('specail-boom-button');
if (SBB) {
    SBB.addEventListener('click', () => {
        SB = SB === 0 ? 1 : 0;
        SBB.classList.toggle('active');
        const lengthSlider = document.getElementById('boom-length-slider');
        lengthSlider?.dispatchEvent(new Event('input', { bubbles: true }));
    });
}

const jibBtn = document.getElementById('jib-Btn');
jibBtn?.addEventListener('click', () => {
    jibB = 1 - jibB;
    jibBtn.classList.toggle('active', jibB === 1);
    const lengthSlider = document.getElementById('boom-length-slider');
    lengthSlider?.dispatchEvent(new Event('input', { bubbles: true }));
});

async function loadCraneBaseData(model) {
    const data = await getCraneData(model);
    if (!data) return;

    const $ = id => document.getElementById(id);
    const setAttrs = (el, attrs) => {
        if (!el) return;
        for (const key in attrs) el.setAttribute(key, attrs[key]);
    };

    const toRad = (deg) => (deg * Math.PI) / 180;

    const BaseData = data["製品情報"],
        DAData = data["危険角度"],
        DDData = data["描画情報"];

    minAngle = 0;
    maxAngle = Number(BaseData[4][1]); // 最大角度セット

    let CW = BaseData[1][1],
        CD = BaseData[3][1],
        BoomMaxAngle = BaseData[4][1],
        SpecialBoom = BaseData[7][1],
        SL = BaseData[22][1];

    let BoomShift = DDData[3][2] / 100;
    let BN = BaseData[1][15],
        BoomSet = BaseData[2][15];

    let footpinX = BaseData[1][9],
        footpinY = BaseData[2][9] - BoomShift;

    let jibNumber = BaseData[1][17];
    const jibY = DDData.map(row => row[28]).filter(val => val !== null && val !== undefined && val !== '').map(Number);
    const JibSteps = [];

    let jibMin = BaseData[20][1];
    let jibMax = BaseData[5][1];

    let BSet2 = [], Bset0 = [], BSsetA = [];

    for (let i = 1; i <= BN; i++) {
        window[`Boom${i}th`] = BaseData[i + 3][15];
    }

    if (typeof BoomSet === 'string') {
        const matches = BoomSet.match(/\[[^\]]+\]/g);
        if (matches) {
            matches.forEach(jsonStr => {
                const bsetArr = JSON.parse(jsonStr);
                const groupMatrix = bsetArr.map(num =>
                    num.toString(3).padStart(BN, '0').split('').map(Number)
                );
                BSet2.push(groupMatrix);

                const lastZeroRowIndex = groupMatrix.findLastIndex(row => row.includes(0));
                if (lastZeroRowIndex !== -1) {
                    Bset0.push(lastZeroRowIndex + 1);
                }

                const rawCounts = groupMatrix.map(row => row.filter(val => val === 1).length);
                const filteredCounts = rawCounts
                    .filter(count => count > 0)
                    .filter((count, index, array) => index === 0 || count !== array[index - 1]);

                BSsetA.push(filteredCounts);
            });
        }
    }

    for (let i = 1; i <= jibNumber; i++) {
        window[`jib${i}th`] = BaseData[i + 1][17] / 100;
        JibSteps.push(BaseData[i + 1][17] / 100);
    }

    const JS = $('jib-slider');
    if (JS) {
        JS.setAttribute('min', jibMin);
        JS.setAttribute('max', jibMax);
        JS.setAttribute('value', jibMin);
    }

    const JLS = $('jib-length-slider');
    const JLV = $('jib-length-val');
    if (JLS && JLV) {
        JLS.setAttribute('min', window.jib1th);
        JLS.setAttribute('max', window[`jib${jibNumber}th`]);
        JLV.setAttribute('value', window.jib1th);
        JLS.setAttribute('value', window.jib1th);
    }

    const DHCdata = DDData.map(row => row[32]);

    let MaxHight = Math.ceil(BaseData[10][1] / 5000) * 50 + 10;
    let MaxHolizon = Math.ceil(BaseData[12][1] / 5000) * 50 + 10;
    let XsizeHolizon = -1 * Math.ceil(BaseData[2][11] / 1000) * 8;

    await fetchCraneDataPreset(model, MaxHolizon, MaxHight, XsizeHolizon);

    BoomWidth = BaseData[18][1];
    let tireD = DDData[2][20] / 200;
    let tireY = DDData[8][20] / 100;
    let FootpinTransY = MaxHight - footpinY / 100 + BoomWidth / 100 / 2;

    const TireD = document.querySelectorAll('.Tire circle');
    TireD.forEach(circle => {
        circle.setAttribute('r', tireD);
        circle.setAttribute('cy', -tireY);
    });

    $('crane-chart')?.setAttribute('viewBox', '0 0 ' + (MaxHolizon) + ' ' + (MaxHight));$('boom-slider')?.setAttribute('max', BoomMaxAngle);

    const el = $('boom-length-slider');
    if (el) {
        const minVal = window.Boom1th / 100;
        el.min = minVal;
        el.max = window[`Boom${BN}th`] / 100;
        el.value = minVal;
    }

    // SVGパーツ生成
    const edge = $('edge'), boom =$('boom'), jib = $('jib'), jibHead =$('jibHead'),
        head = $('head'), TensionRod = $('TensionRod'), DHCF =$('DerrickHydraulicCylinderF'),
        DHCT = $('DerrickHydraulicCylinderT'), DHCbox =$('DerrickHydraulicCylinderBOX');

    let [jibHTML, edgeHTML, boomHTML, headHTML, jibHeadHTML, TensionRodHTML, DHCFHTML, DHCTHTML, DHCboxHTML] = Array(9).fill('');

    const BColor2 = '#f39c12', BColor3 = '#d80606';

    for (let i = BN; i >= 1; i--) {
        const BColor1 = i === 1 ? '#f39c12' : '#52504e';
        jibHTML += `<line id="jib-line-${i}" x1="0" y1="0" y2="0" stroke="${BColor2}"/>`;
        edgeHTML += `<line id="boom-Edge-${i}" x1="0" y1="0" y2="0" stroke="${BColor2}" stroke-width="${BoomWidth / 100 * (10 - i) / 10}" />`;
        boomHTML += `<line id="boom-line-${i}" x1="0" y1="0" y2="0" stroke="${BColor1}" stroke-width="${BoomWidth / 100 * (10 - i) / 10}" />`;
    }

    const createSVG = (tag, id, stroke) => `<${tag} id="${id}" x1="0" y1="0" y2="0" stroke="${stroke}"/>`;

    DHCFHTML += createSVG('circle', 'DHC-F-circle', BColor2);
    DHCTHTML += createSVG('circle', 'DHC-T-circle', BColor2);
    headHTML += createSVG('line', 'head-line', BColor3);
    jibHeadHTML += createSVG('line', 'jib-head-line', BColor2);
    TensionRodHTML += createSVG('line', 'TensionRod-line', BColor2);

    for (let i = 0; i <= 1; i++) {
        DHCboxHTML += `<line id="DHC-box-${i}" x1="0" y1="0" y2="0" stroke="${BColor2}"/>`;
    }

    if (edge) edge.innerHTML = edgeHTML;
    if (boom) boom.innerHTML = boomHTML;
    if (jib) jib.innerHTML = jibHTML;
    if (jibHead) jibHead.innerHTML = jibHeadHTML;
    if (head) head.innerHTML = headHTML;
    if (TensionRod) TensionRod.innerHTML = TensionRodHTML;
    if (DHCF) DHCF.innerHTML = DHCFHTML;
    if (DHCT) DHCT.innerHTML = DHCTHTML;
    if (DHCbox) DHCbox.innerHTML = DHCboxHTML;

    const boomEdges = [], boomLines = [], jibLines = [], DHCboxLines = [];
    for (let i = BN; i >= 1; i--) {
        boomEdges[i] = $(`boom-Edge-${i}`);
        boomLines[i] = $(`boom-line-${i}`);
        jibLines[i] = $(`jib-line-${i}`);
    }

    const headLine = $(`head-line`),
        jibHeadLine = $(`jib-head-line`),
        TensionRodLine = $(`TensionRod-line`),
        DHCFcircle = $(`DHC-F-circle`),
        DHCTcircle = $(`DHC-T-circle`);

    const boomEdgeLength = 0.4;
    const boomVerticalLength = BoomWidth / 1000 / 5;
    boomLines[1]?.setAttribute('x2', window.Boom1th / 100 - boomEdgeLength * (BN - 1));

    for (let i = 2; i <= BN; i++) {
        boomEdges[i]?.setAttribute('x2', window.Boom1th / 100 - boomEdgeLength * (BN - i));
    }
    jibLines[1]?.setAttribute('x2', window.jib1th - boomEdgeLength * (BN - 1));

    const slider = $('boom-slider'),
        angleVal = $('angle-val'),
        WorkingRadius = $('working-radius'),
        lengthSlider = $('boom-length-slider'),
        lengthVal = $('boom-length-val'),
        jibAngle = $('jib-slider'),
        jibAngleVal = $('jib-angle-val'),
        jibLength = $('jib-length-slider'),
        jibLengthVal = $('jib-length-val');

    const jibShift = boomVerticalLength * (BN - 1) + 7.54 / 4;

    for (let i = 1; i >= 0; i--) {
        DHCboxLines[i] = $(`DHC-box-${i}`);
    }

    jibAngle?.addEventListener('input', (e) => {
        if (jibAngleVal) jibAngleVal.textContent = Number(e.target.value).toFixed(0);
        lengthSlider?.dispatchEvent(new Event('input'));
    });

    const getNearest = (arr, val) => {
        let nearest = arr[0];
        let minDiff = Math.abs(arr[0] - val);
        for (let i = 1; i < arr.length; i++) {
            const diff = Math.abs(arr[i] - val);
            if (diff < minDiff) {
                minDiff = diff;
                nearest = arr[i];
            }
        }
        return nearest;
    };

    jibLength?.addEventListener('input', (e) => {
        let val = parseFloat(e.target.value);
        if (SL === 0) {
            val = getNearest(JibSteps, val);
            e.target.value = val;
        }
        if (jibLengthVal) jibLengthVal.textContent = Number(val / 10).toFixed(2);
        lengthSlider?.dispatchEvent(new Event('input'));
    });

    slider?.addEventListener('input', (e) => {
        const angle = e.target.value;
        const pivotX = DHCdata[19] / 100;
        const pivotY = MaxHight - DHCdata[18] / 100;
        const tfStr = `translate(${-footpinX / 100}, ${FootpinTransY}) rotate(${-angle},0,${-BoomWidth / 200})`;

        boom?.setAttribute('transform', tfStr);
        edge?.setAttribute('transform', tfStr);
        jib?.setAttribute('transform', tfStr);
        head?.setAttribute('transform', tfStr);
        jibHead?.setAttribute('transform', tfStr);
        TensionRod?.setAttribute('transform', tfStr);

        DHCT?.setAttribute('transform', `translate(${-footpinX / 100}, ${MaxHight - footpinY / 100}) rotate(${-angle},0,0)`);
        DHCF?.setAttribute('transform', `rotate(${-angle},${pivotX},${pivotY})`);

        if (angleVal) angleVal.textContent = Number(angle).toFixed(0);
        BoomAngle = Number(angle).toFixed(0);

        DHCFcircle?.setAttribute('r', DHCdata[3] / 100);
        DHCFcircle?.setAttribute('cx', pivotX);
        DHCFcircle?.setAttribute('cy', pivotY);

        DHCTcircle?.setAttribute('r', DHCdata[5] / 100);
        DHCTcircle?.setAttribute('fill', '#f39c12');

        const rad = -angle * Math.PI / 180;
        const radLocal = -rad;

        const localCX = DHCdata[14] / 100;
        const localCY = 7.54 + BoomShift;

        const worldCX = (localCX * Math.cos(rad) - localCY * Math.sin(rad)) - footpinX / 100;
        const worldCY = (localCX * Math.sin(rad) + localCY * Math.cos(rad)) + MaxHight - footpinY / 100;

        const dx = worldCX - pivotX;
        const dy = worldCY - pivotY;

        let X2_1 = pivotX + (dx * Math.cos(radLocal) - dy * Math.sin(radLocal));
        let Y2_1 = pivotY + (dx * Math.sin(radLocal) + dy * Math.cos(radLocal));

        const theta = Math.atan2(Y2_1 - pivotY, X2_1 - pivotX);

        let X2_0 = pivotX + (DHCdata[10] / 100) * Math.cos(theta);
        let Y2_0 = pivotY + (DHCdata[10] / 100) * Math.sin(theta);

        DHCTcircle?.setAttribute('cx', localCX);
        DHCTcircle?.setAttribute('cy', localCY);

        DHCbox?.setAttribute('transform', `rotate(${-angle}, ${pivotX}, ${MaxHight - DHCdata[18] / 100})`);

        setAttrs(DHCboxLines[1], {
            'stroke-width': DHCdata[11] / 100,
            'stroke': '#a09d9a',
            'x1': pivotX + DHCdata[3] / 100,
            'y1': MaxHight - DHCdata[18] / 100,
            'x2': X2_1,
            'y2': Y2_1
        });

        if (DHCboxLines[0]?.parentElement) {
            DHCboxLines[0].parentElement.appendChild(DHCboxLines[0]);
        }

        setAttrs(DHCboxLines[0], {
            'stroke-width': DHCdata[9] / 100,
            'x1': pivotX + DHCdata[3] / 100,
            'y1': MaxHight - DHCdata[18] / 100,
            'x2': X2_0,
            'y2': Y2_0
        });

        lengthSlider?.dispatchEvent(new Event('input'));
    });

    lengthSlider?.addEventListener('input', (e) => {
        const length = parseFloat(e.target.value);
        resetAllBoomLength();

        if (WorkingRadius) {
            WorkingRadius.textContent = String(Number(Math.floor(((length / 10) * Math.cos(toRad(BoomAngle)) + BoomWidth / 1000 * Math.sin(toRad(BoomAngle)) - footpinX / 1000) * 10) / 10).toFixed(1)).padStart(4, ' ');
        }

        let baseValues;
        const BaseBoom = [];
        BaseBoom[1] = window.Boom1th / 100;

        Bset0.forEach((val, index) => {
            BaseBoom[index + 2] = window[`Boom${val}th`] / 100;
        });

        let targetB = length < BaseBoom[2 + SB] ? 0 : 1;

        const LtoB1 = length - BaseBoom[1];
        const LtoB2 = length - BaseBoom[2];
        const LtoB3 = length - BaseBoom[3];

        let BSetA = BSsetA[SB] || [1, 1];

        if (SB == 0) {
            const l1 = targetB === 0 ? LtoB1 / BSetA[0] : (LtoB1 - LtoB2) / BSetA[0];
            const l2 = LtoB2 / BSetA[1];

            baseValues = [];
            let step1 = 1, step2 = 1;

            for (let i = 0; i < BN; i++) {
                baseValues[i] = i < BSetA[0] ? BaseBoom[1] + l1 * step1++
                    : targetB === 0 ? length
                        : BaseBoom[2] + (i > 1 ? l2 * step2++ : 0);
            }
        } else {
            const l1 = (targetB === 0 ? LtoB1 : LtoB1 - LtoB3) / BSetA[0];
            const l2 = LtoB3 / BSetA[1];

            let s1 = 1, s2 = 1, s3 = 1;
            const th = Bset0[SB] - 2;

            baseValues = new Array(BN).fill(BaseBoom[1]).map((val, i) =>
                val + (i < th
                    ? (targetB === 0 ? 0 : l2 * s2++)
                    : (targetB === 0 ? l1 * s1++ : LtoB3 + l1 * s3++))
            );
        }

        for (let i = 2; i <= BN - 1; i++) {
            const base = baseValues[i - 2];
            const x2 = base - boomEdgeLength * (BN - i);
            const x3 = base - boomEdgeLength * (BN + 1 - i);

            boomLines[i]?.setAttribute('x2', x2);
            boomEdges[i]?.setAttribute('x1', x3);
            boomEdges[i]?.setAttribute('x2', x2);
        }

        for (let i = 2; i <= BN; i++) {
            boomLines[i]?.setAttribute('y1', boomVerticalLength * (i - 1));
            boomLines[i]?.setAttribute('y2', boomVerticalLength * (i - 1));
            boomEdges[i]?.setAttribute('y1', boomVerticalLength * (i - 1));
            boomEdges[i]?.setAttribute('y2', boomVerticalLength * (i - 1));
        }

        boomLines[BN]?.setAttribute('x2', length);
        boomEdges[BN]?.setAttribute('x1', length - boomEdgeLength);
        boomEdges[BN]?.setAttribute('x2', length);

        setAttrs(headLine, {
            'x1': length,
            'x2': length,
            'y1': -7.54 / 2,
            'y2': 8.6936 - 7.54 / 2,
            'stroke-width': 2.51
        });

        let JAangle = toRad(jibAngle ? jibAngle.value : 0);
        let jibHeadLineDist = 2;
        let jibHeadY = 1.454;
        let jibLine1thY = 1.454;
        let jibLine2thY = 1.11;
        let TenshionRodR = 2.72 / 10;

        const setLine = (line, x1, x2, y1, y2) => {
            if (!line) return;
            line.setAttribute('x1', x1);
            line.setAttribute('x2', x2);
            line.setAttribute('y1', y1);
            line.setAttribute('y2', y2);
        };

        if (jibB == 1) {
            setAttrs(jibHeadLine, { 'stroke-width': jibHeadY });
            setAttrs(jibLines[1], { 'stroke-width': jibLine1thY });
            setAttrs(jibLines[2], { 'stroke-width': jibLine2thY, 'stroke': '#52504e' });

            const cosA = Math.cos(JAangle), sinA = Math.sin(JAangle);

            setAttrs(TensionRodLine, {
                'stroke-width': TenshionRodR,
                'x1': length,
                'x2': length + window.jib1th * cosA,
                'y1': -7.54 / 2,
                'y2': jibShift + window.jib1th * sinA
            });

            const jibLen = Number(jibLength ? jibLength.value : 0);

            for (let i = 1; i <= jibNumber; i++) {
                const len = i === 1 ? window[`jib${i}th`] : jibLen;
                if (jibLines[i] && len) {
                    setLine(jibLines[i], length, length + len * cosA, jibShift, jibShift + len * sinA);
                }
            }

            if (jibHeadLine) {
                const xEnd = length + jibLen * cosA;
                const yEnd = jibShift + jibLen * sinA;
                setLine(jibHeadLine, xEnd - jibHeadLineDist * cosA, xEnd, yEnd - jibHeadLineDist * sinA, yEnd);
            }
        } else {
            const BaseBoom1 = window.Boom1th / 100;
            const jibTipX = BaseBoom1 - window.jib1th;
            const jibHeadTipX = jibTipX + jibHeadLineDist;
            const HeadHalf = 7.54 / 2;
            const tensionY = HeadHalf - jibLine1thY * 0.5;

            for (let i = 1; i <= jibNumber; i++) {
                if (!jibLines[i]) continue;
                setAttrs(jibLines[i], { 'x1': BaseBoom1, 'x2': jibTipX, 'y1': HeadHalf, 'y2': HeadHalf });
            }

            setLine(jibHeadLine, jibTipX, jibHeadTipX, HeadHalf, HeadHalf);
            setLine(TensionRodLine, BaseBoom1, jibHeadTipX, tensionY, tensionY);
        }

        if (lengthVal) lengthVal.textContent = Number(length / 10).toFixed(1);

        let jibHookPoint = Number(JibSteps[0]) >= Number(jibLength ? jibLength.value : 0) ? 0 : jibNumber - 1;
        let boom_jib = Number(BoomAngle) - Number(jibAngle ? jibAngle.value : 0);

        let jibD = (jibLength ? jibLength.value : 0) / 10 * Math.cos(toRad(boom_jib)) - jibY[jibHookPoint] / 1000 * Math.sin(toRad(boom_jib));
        let boomD = (length / 10) * Math.cos(toRad(BoomAngle)) + BoomWidth / 1000 * Math.sin(toRad(BoomAngle)) - footpinX / 1000;

        if (WorkingRadius) {
            WorkingRadius.textContent = (Math.floor((boomD + jibD * jibB) * 10) / 10).toFixed(1).padStart(4, ' ');
        }
    });

    slider?.dispatchEvent(new Event('input'));
    lengthSlider?.dispatchEvent(new Event('input'));
    jibAngle?.dispatchEvent(new Event('input'));

    // データ読み込みがすべて完了してから円弧スライダーを初期化
    initArcSlider();
}

function resetAllBoomLength() {
    document.querySelectorAll('[id^="boom-line-"]:not(#boom-line-1)').forEach(line => line.setAttribute('x2', 0));
    document.querySelectorAll('[id^="boom-Edge-"]').forEach(edge => {
        edge.setAttribute('x1', 0);
        edge.setAttribute('x2', 0);
    });
    document.querySelectorAll('[id^="jib-line-"]').forEach(jib => {
        jib.setAttribute('stroke', '#f39c12');
        jib.setAttribute('x1', 0);
        jib.setAttribute('x2', 0);
    });
    document.querySelectorAll('[id^="head-line-"]').forEach(head => {
        head.setAttribute('stroke', '#d80606');
        head.setAttribute('x1', 0);
        head.setAttribute('x2', 0);
    });
    document.querySelectorAll('[id^="jib-head-line"]').forEach(jibHead => {
        jibHead.setAttribute('stroke', '#f39c12');
        jibHead.setAttribute('x1', 0);
        jibHead.setAttribute('x2', 0);
    });
}

// モーダルのピン留め状態を管理するフラグ（全体で参照できるように外に配置）
let isBoomDialogPinned = false;

// モーダル・ダイアログ制御
document.addEventListener('DOMContentLoaded', () => {
    initCraneSelector();

    const boomGroup = document.getElementById('boom');
    const dialog = document.getElementById('boom-angle-dialog');
    const dialogHeader = document.getElementById('boom-angle-dialog-header');
    const closeBtn = document.getElementById('close-boom-angle-dialog');
    const pinBtn = document.getElementById('pin-boom-angle-dialog'); // ★ピンボタン取得
    const BoomTrigger = document.getElementById('boom-trigger');

    let posX = 0, posY = 0;


    // ★ピン留めボタンのイベント設定
    if (pinBtn) {
        pinBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // イベントのバブリングを止める
            isBoomDialogPinned = !isBoomDialogPinned;
            pinBtn.classList.toggle('pinned', isBoomDialogPinned);
            console.log('Pinned:', isBoomDialogPinned);
        });
    }

      // ダイアログを開く共通関数
    function openBoomDialog() {
        if (dialog && !dialog.open) {
            posX = window.innerWidth / 2 - 120;
            posY = window.innerHeight / 3;
            dialog.style.transform = `translate(${posX}px, ${posY}px)`;
            dialog.show();
        }
    }

    // それぞれの要素にイベント登録
    if (boomGroup) boomGroup.addEventListener('click', openBoomDialog);
    if (BoomTrigger) BoomTrigger.addEventListener('click', openBoomDialog);

    if (closeBtn && dialog) {
        closeBtn.addEventListener('click', () => {
            // ×ボタンが押された時はピン止めに関わらず閉じる（ピン状態もリセット）
            isBoomDialogPinned = false;
            if (pinBtn) pinBtn.classList.remove('pinned');
            dialog.close();
        });
    }

 // ダイアログ外のクリックで閉じる処理（show() 対応版）
document.addEventListener('pointerdown', (e) => {
    // ダイアログが開いていて、かつピン留めされていない時だけ判定
    if (dialog && dialog.open && !isBoomDialogPinned) {
        
        // クリックされた要素が「ダイアログ本体」および「ダイアログを開くボタン(boomGroup)」に含まれない場合
        const isClickInsideDialog = dialog.contains(e.target);
        const isClickOnTrigger = 
                (boomGroup && boomGroup.contains(e.target)) ||
                (BoomTrigger && BoomTrigger.contains(e.target));

        if (!isClickInsideDialog && !isClickOnTrigger) {
            dialog.close();
        }
    }
});

    let isDragging = false, startX = 0, startY = 0;
    if (dialogHeader && dialog) {
        dialogHeader.addEventListener('mousedown', (e) => {
            if (e.target === closeBtn || e.target === pinBtn) return; // ピンボタン操作時のドラッグ防止
            isDragging = true;
            startX = e.clientX - posX;
            startY = e.clientY - posY;
            document.body.style.userSelect = 'none';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            posX = e.clientX - startX;
            posY = e.clientY - startY;
            dialog.style.transform = `translate(${posX}px, ${posY}px)`;
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
            }
        });
    }
});


// 円弧(Arc)計算ヘルパー
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (-angleInDegrees) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function describeArc(x, y, radius, startAngle, endAngle) {
    if (endAngle <= startAngle) return "";
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y
    ].join(" ");
}

// 円弧スライダーの初期化関数
function initArcSlider() {
    // ※ pinBtn 関連のコードは DOMContentLoaded 側に移動したためここからは削除しています

    const svg = document.getElementById('arc-slider-svg');
    const pathBg = document.getElementById('arc-bg');
    const pathAttention = document.getElementById('arc-attention');
    const pathDanger = document.getElementById('arc-danger');
    const pathDangerEdge = document.getElementById('arc-danger-edge');
    const pathActive = document.getElementById('arc-active');
    const pathActiveEdge = document.getElementById('arc-active-edge');
    const handle = document.getElementById('arc-handle');
    const textVal = document.getElementById('arc-angle-text');
    const mainSlider = document.getElementById('boom-slider');

    if (!svg || !pathBg || !pathActive || !handle) return;

    const cx = 100, cy = 100, r = 70;

    const attentionStart = minAngle + 5;
    const dangerStart = minAngle + 3;
    const dangerEnd = minAngle;

    pathBg.setAttribute('d', describeArc(cx, cy, r, dangerStart, maxAngle));
    if (pathAttention) {
        pathAttention.setAttribute('d', describeArc(cx, cy, r, dangerStart, attentionStart));
    }

    if (pathDanger) {
        pathDanger.setAttribute('d', describeArc(cx, cy, r, dangerEnd, dangerStart));
    }

    if (pathDangerEdge) {
        pathDangerEdge.setAttribute('d', describeArc(cx, cy, r, 0, 1));
    }

    function updateSliderUI(angle) {
        const clampedAngle = Math.max(minAngle, Math.min(maxAngle, angle));

        const handlePos = polarToCartesian(cx, cy, r, clampedAngle);
        handle.setAttribute('cx', handlePos.x);
        handle.setAttribute('cy', handlePos.y);

        const shadowLine = document.getElementById('arc-shadow-line');
        if (shadowLine) {
            shadowLine.setAttribute('d', describeArc(cx, cy, r, 0, clampedAngle));
        }

        const shadowBox = document.getElementById('arc-shadow-box');
        if (shadowBox) {
            shadowBox.setAttribute('d', describeArc(cx, cy, r, 0, minAngle));
        }

        if (pathActiveEdge) {
            pathActiveEdge.setAttribute('d', describeArc(cx, cy, r, attentionStart, clampedAngle));
        }

        pathActive.setAttribute('d', describeArc(cx, cy, r, minAngle, clampedAngle));

        if (handle) {
            handle.classList.remove('is-attention', 'is-danger');
            if (clampedAngle <= dangerStart) {
                handle.classList.add('is-danger');
            } else if (clampedAngle <= attentionStart) {
                handle.classList.add('is-attention');
            }
        }

        if (pathBg) {
            pathBg.classList.remove('is-attention', 'is-danger');
            if (clampedAngle <= dangerStart) {
                pathBg.classList.add('is-danger');
            } else if (clampedAngle <= attentionStart) {
                pathBg.classList.add('is-attention');
            }
        }

        if (textVal) textVal.textContent = clampedAngle.toFixed(0);

        if (mainSlider && Math.abs(parseFloat(mainSlider.value) - clampedAngle) > 0.01) {
            mainSlider.value = clampedAngle;
            mainSlider.dispatchEvent(new Event('input'));
        }
    }

    let isDragging = false;

    function handleMove(e) {
        if (!isDragging) return;

        const pt = svg.createSVGPoint();
        pt.x = e.touches ? e.touches[0].clientX : e.clientX;
        pt.y = e.touches ? e.touches[0].clientY : e.clientY;

        const ctm = svg.getScreenCTM();
        if (!ctm) return;
        const svgPt = pt.matrixTransform(ctm.inverse());

        const dx = svgPt.x - cx;
        const dy = svgPt.y - cy;

        let rad = Math.atan2(-dy, dx);
        let deg = rad * (180 / Math.PI);

        if (deg < 0) deg += 360;

        if (deg > maxAngle && deg < 360) {
            const midPoint = maxAngle + (360 - maxAngle) / 2;
            deg = (deg < midPoint) ? maxAngle : minAngle;
        }

        updateSliderUI(deg);
    }

    svg.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        isDragging = true;
        handleMove(e);
    });

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', () => { isDragging = false; });

    updateSliderUI(parseFloat(mainSlider ? mainSlider.value : minAngle));
}