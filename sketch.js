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

// sketch.js
const BaseDataSheetUrls = {
  "KRM13HF2H": "https://script.google.com/macros/s/AKfycbzDnWVNkIFI0BTX_BpJAZxKEfPn2EVjZxovyBSEY2zEb7-gD3AOejB01Cl6y0G91k_t/exec",
};

const craneDataCache = {};

// 共通データ取得関数（キャッシュがあれば即返却）
async function getCraneData(model) {
  if (!craneDataCache[model]) {
    const url = BaseDataSheetUrls[model];
    if (!url) {
      console.error(`モデル ${model} のURLが設定されていません。`);
      return null;
    }
    const response = await fetch(url);
    craneDataCache[model] = await response.json();
  }
  return craneDataCache[model];
}

async function fetchCraneDataPreset(model, MaxHolizon, MaxHight, XsizeHolizon) {
  const data = await getCraneData(model);
  if (!data) return null;

  const xlabelsGroup = document.getElementById('axis-labels-x');
  const xlinesGroup = document.getElementById('grid-lines-x');
  const ylabelsGroup = document.getElementById('axis-labels-y');
  const ylinesGroup = document.getElementById('grid-lines-y');

  xlabelsGroup.innerHTML = '';
  xlinesGroup.innerHTML = '';
  ylabelsGroup.innerHTML = '';
  ylinesGroup.innerHTML = '';

  const scale = 10;

  // 【改善】HTML文字列を配列にまとめて1回で描画注入する（DOM操作の高速化）
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
  xlinesGroup.innerHTML = xlinesHTML;
  xlabelsGroup.innerHTML = xlabelsHTML;
  xlabelsGroup.setAttribute('transform', `translate(0, ${MaxHight})`);

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
  ylinesGroup.innerHTML = ylinesHTML;
  ylabelsGroup.innerHTML = ylabelsHTML;

  return data;
}

let BoomAngle = 0;
let BoomLength = 0;
let BoomWidth;

let SB = 0;
let SBB = document.getElementById('specail-boom-button');

if (SBB) {
  SBB.addEventListener('click', () => {
    SB = SB === 0 ? 1 : 0;
    SBB.classList.toggle('active');

    const lengthSlider = document.getElementById('boom-length-slider');
    if (lengthSlider) {
      lengthSlider.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
}

async function loadCraneBaseData(model) {
  // 【改善】共通関数経由で取得（無駄な重複fetchを防止）
  const data = await getCraneData(model);
  if (!data) return;

  const BaseData = data["製品情報"];
  const DAData = data["危険角度"];
  const DDData = data["描画情報"];
  const J0Data = data["J0"];
  const J1Data = data["J1"];
  const J2Data = data["J2"];

  let CW = BaseData[1][1];

  // 文字列を配列に変換して直接セット
let BSet = typeof BaseData[2][15] === 'string' 
  ? JSON.parse(BaseData[2][15]) 
  : BaseData[2][15];

// あとはそのまま BSet1, BSet2 を作成
let BSet1 = BSet.map(num => num.toString(3).padStart(6, '0'));
let BSet2 = BSet1.map(str => str.split('').map(Number));

  let CD = BaseData[3][1];
  let BoomMaxAngle = BaseData[4][1];
  let SpecialBoom = BaseData[7][1];

  let BN = BaseData[1][15];
  let BoomSet = BaseData[2][15];
  let footpinX = BaseData[1][9];
  let footpinY = BaseData[2][9];

  for (let i = 1; i <= BN; i++) {
    window[`Boom${i}th`] = BaseData[i+3][15];
  }

  BoomLength = Boom1th / 1000;

  // alert(Boom1th); // ★同期処理で停止するため削除

  let outrigger1st = BaseData[12][3];
  let outrigger2nd = BaseData[13][3];
  let outrigger3rd = BaseData[14][3];
  let outrigger4th = BaseData[15][3];
  let outrigger5th = BaseData[16][3];

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

  document.getElementById('crane-chart').setAttribute('viewBox', '0 0 ' + (MaxHolizon) + ' ' + (MaxHight));
  document.getElementById('boom-slider').setAttribute('max', BoomMaxAngle);

  // --- ブームの生成処理 ---
  const boomLines = [];
  const boom = document.getElementById('boom');
  const boomEdges = [];
  const edge = document.getElementById('edge');

  // 【改善】文字列組み立てで一括注入
  let edgeHTML = '';
  let boomHTML = '';
  for (let i = BN; i >= 1; i--) {
    const BColor2 = '#f39c12';
    edgeHTML += `<line id="boom-Edge-${i}" x1="0" y1="0" y2="0" stroke="${BColor2}" stroke-width="${BoomWidth/100*(10-i)/10}" />`;

    const BColor1 = i === 1 ? '#f39c12' : '#52504e';
    boomHTML += `<line id="boom-line-${i}" x1="0" y1="0" y2="0" stroke="${BColor1}" stroke-width="${BoomWidth/100*(10-i)/10}" />`;
  }
  edge.innerHTML = edgeHTML;
  boom.innerHTML = boomHTML;

  for (let i = BN; i >= 1; i--) {
    boomEdges[i] = document.getElementById(`boom-Edge-${i}`);
    boomLines[i] = document.getElementById(`boom-line-${i}`);
  }

  const boomEdgeLength = 1;//仮
  const boomVerticalLength = BoomWidth / 1000 / 5;//仮
  boomLines[1].setAttribute('x2', Boom1th / 100 - boomEdgeLength * (BN - 1));

  for (let i = 2; i <= BN; i++) {
    boomEdges[i].setAttribute('x2', Boom1th / 100 - boomEdgeLength * (BN - i));
  }

  const slider = document.getElementById('boom-slider');
  const angleVal = document.getElementById('angle-val');
  const WorkingRadius = document.getElementById('working-radius');
  const lengthSlider = document.getElementById('boom-length-slider');
  const lengthVal = document.getElementById('boom-length-val');

  slider.addEventListener('input', (e) => {
    const angle = e.target.value;
    boom.setAttribute('transform', `translate(${-footpinX/100}, ${FootpinTransY}) rotate(${-angle},0,${-BoomWidth/100/2})`);
    edge.setAttribute('transform', `translate(${-footpinX/100}, ${FootpinTransY}) rotate(${-angle},0,${-BoomWidth/100/2})`);
    angleVal.textContent = Number(angle).toFixed(0);
    BoomAngle = Number(angle).toFixed(0);

    WorkingRadius.textContent = String(Number(Math.floor((BoomLength*Math.cos(BoomAngle * Math.PI / 180)+BoomWidth/1000*Math.sin(BoomAngle * Math.PI / 180)-1.32)*10)/10).toFixed(1)).padStart(4, ' ');
    lengthSlider.dispatchEvent(new Event('input'));
  });

  lengthSlider.addEventListener('input', (e) => {
    const length = parseFloat(e.target.value);
    resetAllBoomLength();

    BoomLength = Number(length / 10).toFixed(1);

    WorkingRadius.textContent = String(Number(Math.floor((BoomLength*Math.cos(BoomAngle * Math.PI / 180)+BoomWidth/1000*Math.sin(BoomAngle * Math.PI / 180)-1.32)*10)/10).toFixed(1)).padStart(4, ' ');

    if (SB === 0) {
      if (length <= 127.8) {
        const length1 = length/2;
        const length2 = Boom1th / 100/2;
        boomLines[2].setAttribute('x2', length1 * 1 + length2 * 1 - boomEdgeLength * 4);//1,2
        boomEdges[2].setAttribute('x1', length1 * 1 + length2 * 1 - boomEdgeLength * 5);//1,2
        boomEdges[2].setAttribute('x2', length1 * 1 + length2 * 1 - boomEdgeLength * 4);//1,2

        boomLines[3].setAttribute('x2', length1 * 2 + length2 * 0 - boomEdgeLength * 3);//1,2
        boomEdges[3].setAttribute('x1', length1 * 2 + length2 * 0 - boomEdgeLength * 4);//1,2
        boomEdges[3].setAttribute('x2', length1 * 2 + length2 * 0 - boomEdgeLength * 3);//1,2

        boomLines[4].setAttribute('x2', length - boomEdgeLength * 2);//0
        boomEdges[4].setAttribute('x1', length - boomEdgeLength * 3);//0
        boomEdges[4].setAttribute('x2', length - boomEdgeLength * 2);//0

        boomLines[5].setAttribute('x2', length - boomEdgeLength * 1);//0
        boomEdges[5].setAttribute('x1', length - boomEdgeLength * 2);//0
        boomEdges[5].setAttribute('x2', length - boomEdgeLength * 1);//0
      } else if (length > 127.8) {
        const length1 = (127.8 + Boom1th / 100) / 2;
        const length2 = (length - 127.8)/3;
        boomLines[2].setAttribute('x2', length1 - boomEdgeLength * 4);//2
        boomEdges[2].setAttribute('x1', length1 - boomEdgeLength * 5);//2
        boomEdges[2].setAttribute('x2', length1 - boomEdgeLength * 4);//2

        boomLines[3].setAttribute('x2', length2 * 0 + 127.8 - boomEdgeLength * 3);//2
        boomEdges[3].setAttribute('x1', length2 * 0 + 127.8 - boomEdgeLength * 4);//2
        boomEdges[3].setAttribute('x2', length2 * 0 + 127.8 - boomEdgeLength * 3);//2

        boomLines[4].setAttribute('x2', length2 * 1 + 127.8 - boomEdgeLength * 2);//1,2
        boomEdges[4].setAttribute('x1', length2 * 1 + 127.8 - boomEdgeLength * 3);//1,2
        boomEdges[4].setAttribute('x2', length2 * 1 + 127.8 - boomEdgeLength * 2);//1,2

        boomLines[5].setAttribute('x2', length2 * 2 + 127.8 - boomEdgeLength * 1);//1,2
        boomEdges[5].setAttribute('x1', length2 * 2 + 127.8 - boomEdgeLength * 2);//1,2
        boomEdges[5].setAttribute('x2', length2 * 2 + 127.8 - boomEdgeLength * 1);//1,2
      }
    } else if (SB === 1) {
      if (length <= 165.2) {
        const length1 = (length - Boom1th / 100) / 3;

        boomLines[2].setAttribute('x2', Boom1th / 100 - boomEdgeLength * 4);//0
        boomEdges[2].setAttribute('x1', Boom1th / 100 - boomEdgeLength * 5);//0
        boomEdges[2].setAttribute('x2', Boom1th / 100 - boomEdgeLength * 4);//0

        boomLines[3].setAttribute('x2', length1 * 0 + Boom1th / 100 - boomEdgeLength * 3);//0
        boomEdges[3].setAttribute('x1', length1 * 0 + Boom1th / 100 - boomEdgeLength * 4);//0
        boomEdges[3].setAttribute('x2', length1 * 0 + Boom1th / 100 - boomEdgeLength * 3);//0

        boomLines[4].setAttribute('x2', length1 * 1 + Boom1th / 100 - boomEdgeLength * 2);//1,2
        boomEdges[4].setAttribute('x1', length1 * 1 + Boom1th / 100 - boomEdgeLength * 3);//1,2
        boomEdges[4].setAttribute('x2', length1 * 1 + Boom1th / 100 - boomEdgeLength * 2);//1,2

        boomLines[5].setAttribute('x2', length1 * 2 + Boom1th / 100 - boomEdgeLength * 1);//1,2
        boomEdges[5].setAttribute('x1', length1 * 2 + Boom1th / 100 - boomEdgeLength * 2);//1,2
        boomEdges[5].setAttribute('x2', length1 * 2 + Boom1th / 100 - boomEdgeLength * 1);//1,2
      } else if (length > 165.2) {
        const length1 = (165.2 - Boom1th / 100) / 3;
        const length2 = (length - 165.2)/2;

        boomLines[2].setAttribute('x2', length2 * 1 + Boom1th / 100 - boomEdgeLength * 4);//1,2
        boomEdges[2].setAttribute('x1', length2 * 1 + Boom1th / 100 - boomEdgeLength * 5);//1,2
        boomEdges[2].setAttribute('x2', length2 * 1 + Boom1th / 100 - boomEdgeLength * 4);//1,2

        boomLines[3].setAttribute('x2', length2 * 2 + Boom1th / 100 - boomEdgeLength * 3);//1,2
        boomEdges[3].setAttribute('x1', length2 * 2 + Boom1th / 100 - boomEdgeLength * 4);//1,2
        boomEdges[3].setAttribute('x2', length2 * 2 + Boom1th / 100 - boomEdgeLength * 3);//1,2

        boomLines[4].setAttribute('x2', length - length1 * 2 - boomEdgeLength * 2);//2
        boomEdges[4].setAttribute('x1', length - length1 * 2 - boomEdgeLength * 3);//2
        boomEdges[4].setAttribute('x2', length - length1 * 2 - boomEdgeLength * 2);//2

        boomLines[5].setAttribute('x2', length - length1 * 1 - boomEdgeLength * 1);//2
        boomEdges[5].setAttribute('x1', length - length1 * 1 - boomEdgeLength * 2);//2
        boomEdges[5].setAttribute('x2', length - length1 * 1 - boomEdgeLength * 1);//2
      }
    }

    for (let i = 2; i <= BN; i++) {
      boomLines[i].setAttribute('y1', boomVerticalLength * (i - 1));
      boomLines[i].setAttribute('y2', boomVerticalLength * (i - 1));
      boomEdges[i].setAttribute('y1', boomVerticalLength * (i - 1));
      boomEdges[i].setAttribute('y2', boomVerticalLength * (i - 1));
    }

    boomLines[BN].setAttribute('x2', length);
    boomEdges[BN].setAttribute('x1', length - boomEdgeLength);
    boomEdges[BN].setAttribute('x2', length);

    lengthVal.textContent = Number(length / 10).toFixed(1);
  });
}

function resetAllBoomLength() {
  document.querySelectorAll('[id^="boom-line-"]:not(#boom-line-1)').forEach(line => {
    line.setAttribute('x2', 0);
  });

  document.querySelectorAll('[id^="boom-Edge-"]').forEach(edge => {
    edge.setAttribute('x1', 0);
    edge.setAttribute('x2', 0);
  });
}

function calculate(data) {
  const value = data[3][0];
  console.log("計算結果:", value);
}