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

    const outriggerStates = {
        fl: 'max',
        fr: 'max',
        rl: 'max',
        rr: 'max'
    };

    let outriggerNumber =BaseData[1][3];
    

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


//アウトリガー
    try {

    let outriggerList = [];



    //BaseData[12+i][3]
for (let i = outriggerNumber; i >= 1; i--) {
    let labelText;
    const distanceVal = BaseData[11 + i][3]/1000; // 例: "7.0m" または 7.0

    if (i === outriggerNumber) {
        labelText = "最大 (" + distanceVal + "m)";
    } else if (i === 1) {
        labelText = "最小 (" + distanceVal + "m)";
    } else {
        labelText = "中間 (" + distanceVal + "m)";
    }

    outriggerList.push({
        value: String(i),
        label: labelText
    });
}


        // 2. 対象の select 要素を取得
        const selectEl = document.getElementById('outrigger-select');
        if (!selectEl) {
            console.warn('#outrigger-select が見つかりませんでした');
            return;
        }

        // 3. 既存の option を一度クリアする
        selectEl.innerHTML = '';

        // 4. 動的に option を作成して追加する
        const fragment = document.createDocumentFragment();

        outriggerList.forEach((item) => {
            const option = document.createElement('option');
            option.value = item.value;
            option.textContent = item.label;
            fragment.appendChild(option);
        });

        selectEl.appendChild(fragment);

    } catch (error) {
        console.error('アウトリガーデータの読み込みに失敗しました:', error);
    }



const outriggerBtns = document.querySelectorAll('.outrigger-btn:not(.btn-all)');
const allBtn = document.querySelector('.outrigger-btn.btn-all');
const outriggerSelect = document.getElementById('outrigger-select');

// 各個ボタンのクリック（トグルON/OFF）
outriggerBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('selected');
        updateAllBtnState();
        logCurrentSelection('ボタン操作');
    });
});

// ALLボタンのクリック（全選択 / 全解除）
if (allBtn) {
    allBtn.addEventListener('click', () => {
        const allSelected = Array.from(outriggerBtns).every(btn => btn.classList.contains('selected'));

        outriggerBtns.forEach(btn => {
            if (allSelected) {
                btn.classList.remove('selected'); // 全解除
            } else {
                btn.classList.add('selected');    // 全選択
            }
        });

        updateAllBtnState();
        logCurrentSelection('ALLボタン操作');
    });
}

// ALLボタン自体の表示状態を自動更新
function updateAllBtnState() {
    if (!allBtn) return;
    const allSelected = Array.from(outriggerBtns).every(btn => btn.classList.contains('selected'));
    if (allSelected) {
        allBtn.classList.add('selected');
    } else {
        allBtn.classList.remove('selected');
    }
}

// ★ 2. セレクトボックスの値が変わったとき、選択中のアウトリガーの「保持する数字（値）」を更新
if (outriggerSelect) {
    outriggerSelect.addEventListener('change', () => {
        const selectedVal = outriggerSelect.value;
        const selectedBtns = document.querySelectorAll('.outrigger-btn.selected:not(.btn-all)');

        // 選択状態（黄枠がついている）のアウトリガーの値を一括更新
        selectedBtns.forEach(btn => {
            const pos = btn.dataset.position;
            if (pos && outriggerStates.hasOwnProperty(pos)) {
                outriggerStates[pos] = selectedVal; // データを書き換え
            }
        });

        logCurrentSelection('長さ変更');
    });
}

// ★ 3. 選択状態(1/0)と、保持している各アウトリガーの数値を出力する関数
function logCurrentSelection(actionType) {
    const positions = ['fl', 'fr', 'rl', 'rr'];
    
    // ① 現在選択されているかどうかのフラグ (1 or 0)
    const selectStatusStr = positions.map(pos => {
        const btn = document.querySelector(`.outrigger-btn[data-position="${pos}"]`);
        const isSelected = btn && btn.classList.contains('selected') ? 1 : 0;
        return `${pos.toUpperCase()} ${isSelected}`;
    }).join(', ');

    // ② 保持している各箇所の長さの値 (FL: max, FR: mid など)
    const valuesStr = positions.map(pos => {
        return `${pos.toUpperCase()}: ${outriggerStates[pos]}`;
    }).join(', ');

    // ログ出力
    //console.log(`[${actionType}] 選択状態: [${selectStatusStr}] | 保持データ: { ${valuesStr} }`);
}


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
    const pinBtn = document.getElementById('pin-boom-angle-dialog');
    const BoomTrigger = document.getElementById('boom-trigger');
    const outriggerBtns = document.querySelectorAll('.outrigger-btn');
    const stateSelect = document.getElementById('outrigger-state-select');

    let activeBtn = null;

    let posX = 0, posY = 0;
    let isBoomDialogPinned = false; // 未定義エラー防止のための変数定義
    let highestZIndex = 1000;

function bringToFront(dialogEl) {
        if (!dialogEl) return;
        highestZIndex++;
        dialogEl.style.zIndex = highestZIndex;
    }

    

    // ★ピン留めボタンのイベント設定
    if (pinBtn) {
        pinBtn.addEventListener('click', (e) => {
            e.stopPropagation();
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

    if (boomGroup) boomGroup.addEventListener('click', openBoomDialog);
    if (BoomTrigger) BoomTrigger.addEventListener('click', openBoomDialog);

    if (closeBtn && dialog) {
        closeBtn.addEventListener('click', () => {
            isBoomDialogPinned = false;
            if (pinBtn) pinBtn.classList.remove('pinned');
            dialog.close();
        });
    }

    // ダイアログ外のクリックで閉じる処理
    document.addEventListener('pointerdown', (e) => {
        if (dialog && dialog.open && !isBoomDialogPinned) {
            const isClickInsideDialog = dialog.contains(e.target);
            const isClickOnTrigger = 
                (boomGroup && boomGroup.contains(e.target)) ||
                (BoomTrigger && BoomTrigger.contains(e.target));

            if (!isClickInsideDialog && !isClickOnTrigger) {
                dialog.close();
            }
        }
    });

    // ドラッグ処理
    let isDragging = false, startX = 0, startY = 0;
    if (dialogHeader && dialog) {
        dialogHeader.addEventListener('mousedown', (e) => {
            if (e.target === closeBtn || e.target === pinBtn) return;
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

    // --- スライダー ＆ 目盛り生成制御 ---
    const lengthSlider = document.getElementById('boom-length-slider');
    const popupLengthVal = document.getElementById('popup-length-val');
    const mainLengthVal = document.getElementById('length-val');
    const trackBg = document.querySelector('.boom-track-bg');

    const presetValues = [53, 90.4, 127.8, 165.2, 202.6, 240];//仮


function updateBoomFill() {
    if (!lengthSlider) return;

    const min = parseFloat(lengthSlider.min) || 53; //仮
    const max = parseFloat(lengthSlider.max) || 240;//仮
    const currentVal = parseFloat(lengthSlider.value);

    // つまみの現在位置をパーセント（0〜100%）で計算
    const percent = ((currentVal - min) / (max - min)) * 100;

    const COLOR_ACTIVE = '#444'; // 伸びた部分
    const COLOR_INACTIVE = 'rgba(0, 0, 0, 0.5)';   // 未到達部分

    // つまみ位置でピタッと色が変わるグラデーション文字列を生成
    const fillGradient = `linear-gradient(90deg, 
        ${COLOR_ACTIVE} 0%, 
        ${COLOR_ACTIVE} ${percent}%, 
        ${COLOR_INACTIVE} ${percent}%, 
        ${COLOR_INACTIVE} 100%)`;

    // CSS変数を更新
    trackBg.style.setProperty('--boom-fill', fillGradient);
}

// スライダー操作イベントに紐付け
lengthSlider.addEventListener('input', updateBoomFill);
updateBoomFill();


let isUpdatingUI = false;


    // UI更新関数 (※dispatchEvent は削除)
   function updateLengthUI(value) {
    // 処理中の場合は処理を中断して無限ループを防ぐ
    if (isUpdatingUI) return;

    isUpdatingUI = true; // フラグをオンにする

    try {
        const valNum = parseFloat(value);
        
        if (lengthSlider) lengthSlider.value = value;
        
        const displayVal = (valNum / 10).toFixed(1);

        if (popupLengthVal) popupLengthVal.textContent = displayVal;
        if (mainLengthVal) mainLengthVal.textContent = displayVal;

        // イベントを発火させても、isUpdatingUI が true なのでループしない
        if (lengthSlider) {
            lengthSlider.dispatchEvent(new Event('input', { bubbles: true }));
        }
    } finally {
        isUpdatingUI = false; // 処理が終わったら必ずフラグをオフに戻す
    }
}
    // 点（目盛り）を生成する関数
    function generatePresetTicks(values) {
        const ticksContainer = document.getElementById('preset-ticks');
        if (!ticksContainer || !lengthSlider || values.length === 0) return;

        ticksContainer.innerHTML = '';

        const min = Math.min(...values);
        const max = Math.max(...values);
        lengthSlider.min = min;
        lengthSlider.max = max;


        
        values.forEach(val => {
            const span = document.createElement('span');
            span.className = 'tick-mark';
            span.setAttribute('data-value', val);

            const dotRadius = 8;

            const percent = ((val - min) / (max - min)) * 100;
            //span.style.left = `${percent}%`;

            span.style.left = `calc(${percent}% + (${dotRadius}px - ${percent * (dotRadius * 2 / 100)}px))`;

            span.addEventListener('click', (e) => {
                e.stopPropagation();
                updateLengthUI(val);
            });

            ticksContainer.appendChild(span);
        });
    }

    // 目盛り生成と初期化
    generatePresetTicks(presetValues);

    if (lengthSlider) {
    lengthSlider.addEventListener('input', (e) => {
        if (isUpdatingUI) return; // ★プログラムからの更新時は何もしない
        updateLengthUI(e.target.value);
    });
    
    // 初期値の反映
    updateLengthUI(lengthSlider.value);
}


    



function makeElementDraggable(dialogEl, headerEl) {
        if (!dialogEl || !headerEl) return;

        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let currentY = 0;
        let isPinned = false;

        dialogEl.addEventListener('pointerdown', () => {
            bringToFront(dialogEl);
        });


        const pinBtn = headerEl.querySelector('.pin-btn');
        if (pinBtn) {
            pinBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // ドラッグ発火を防ぐ
                isPinned = !isPinned; // フラグの切り替え

                if (isPinned) {
                    pinBtn.classList.add('pinned');
                    headerEl.style.cursor = 'default';
                } else {
                    pinBtn.classList.remove('pinned');
                    headerEl.style.cursor = 'move';
                }
            });
        }

        // ドラッグ開始
        headerEl.addEventListener('pointerdown', (e) => {
            // 閉じるボタンやピンボタンをクリックした時はドラッグを開始しない
            if (e.target.closest('.close-btn') || e.target.closest('.pin-btn')) return;

            isDragging = true;
            headerEl.setPointerCapture(e.pointerId);

            // 現在の transform 位置を取得（まだ未設定なら 0）
            const transform = window.getComputedStyle(dialogEl).transform;
            if (transform !== 'none') {
                const matrix = new DOMMatrix(transform);
                currentX = matrix.e;
                currentY = matrix.f;
            } else {
                currentX = 0;
                currentY = 0;
            }

            startX = e.clientX - currentX;
            startY = e.clientY - currentY;

            headerEl.style.cursor = 'grabbing';
        });

        // ドラッグ中
        headerEl.addEventListener('pointermove', (e) => {
            if (!isDragging) return;

            currentX = e.clientX - startX;
            currentY = e.clientY - startY;

            // translate(x, y) で位置を移動
            dialogEl.style.transform = `translate(${currentX}px, ${currentY}px)`;
        });

        // ドラッグ終了
        const stopDrag = (e) => {
            if (!isDragging) return;
            isDragging = false;
            try {
                headerEl.releasePointerCapture(e.pointerId);
            } catch (err) {}
            headerEl.style.cursor = 'move';
        };

        headerEl.addEventListener('pointerup', stopDrag);
        headerEl.addEventListener('pointercancel', stopDrag);

        document.addEventListener('pointerdown', (e) => {
            // ダイアログが開いていない場合は何もしない
            if (!dialogEl.hasAttribute('open')) return;

            // ピン止めされている場合は閉じない
            if (isPinned) return;

            // クリックされた要素がダイアログ内部、または開くきっかけ（#power-train等）なら閉じない
            const isClickInside = dialogEl.contains(e.target);
            const isPowerTrainClick = e.target.closest('#power-train');

            if (!isClickInside && !isPowerTrainClick) {
                dialogEl.removeAttribute('open');
            }
        });
    }

    // ----------------------------------------------------
    // アウトリガーダイアログの初期化とイベント設定
    // ----------------------------------------------------
    const powerTrainEl = document.getElementById('power-train');
    const outriggerDialog = document.getElementById('outrigger-dialog');
    const outriggerCloseBtn = document.getElementById('outrigger-close-btn');

    // ドラッグ機能の適用（アウトリガー用ダイアログ）
    if (outriggerDialog) {
        const outriggerHeader = outriggerDialog.querySelector('.popup-header');
        makeElementDraggable(outriggerDialog, outriggerHeader);
    }

    // 開く処理
    if (powerTrainEl && outriggerDialog) {
        powerTrainEl.addEventListener('click', (e) => {
            e.stopPropagation();
            outriggerDialog.setAttribute('open', '');
            bringToFront(outriggerDialog); // 最前面化
        });
    }

    // 閉じる処理
    if (outriggerCloseBtn && outriggerDialog) {
        outriggerCloseBtn.addEventListener('click', () => {
            outriggerDialog.removeAttribute('open');
        });
    }


const boomDialog = document.getElementById('boom-angle-dialog');
    if (boomDialog) {
        makeElementDraggable(boomDialog, boomDialog.querySelector('.popup-header'));
    }




    outriggerBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pos = e.currentTarget.dataset.position;

            if (pos === 'all') {
                // ALLボタンを押した場合：全てのアウトリガーに現在のセレクト値を一括適用
                const selectedState = stateSelect.value;
                outriggerBtns.forEach(b => {
                    if (b.dataset.position !== 'all') {
                        applyStateToBtn(b, selectedState);
                    }
                });
            } else {
                // 各個別ボタンを押した場合：アクティブ表示にして状態を切り替え
                outriggerBtns.forEach(b => b.style.outline = 'none');
                e.currentTarget.style.outline = '2px solid #fff';
                activeBtn = e.currentTarget;
            }
        });
    });

    // 状態（セレクトボックス）が変更されたら選択中のボタンに反映
    if (stateSelect) {
        stateSelect.addEventListener('change', (e) => {
            if (activeBtn && activeBtn.dataset.position !== 'all') {
                applyStateToBtn(activeBtn, e.target.value);
            }
        });
    }

    // ボタンに状態クラスを付与するヘルパー関数
    function applyStateToBtn(btnElement, stateValue) {
        btnElement.classList.remove('is-max', 'is-mid', 'is-min', 'is-block');
        btnElement.classList.add(`is-${stateValue}`);
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