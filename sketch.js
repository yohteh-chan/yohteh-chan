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

document.getElementById('clear-cache-btn')?.addEventListener('click', () => {
  localStorage.clear();
  alert('キャッシュをクリアしました。ページを再読み込みします。');
  location.reload(); // ページをリロードして最新データを再取得
});

// sketch.js
const BaseDataSheetUrls = {
  "KRM-13H-F2H": "https://script.google.com/macros/s/AKfycbzDnWVNkIFI0BTX_BpJAZxKEfPn2EVjZxovyBSEY2zEb7-gD3AOejB01Cl6y0G91k_t/exec",
  "KRM13HF2H": "https://script.google.com/macros/s/AKfycbzDnWVNkIFI0BTX_BpJAZxKEfPn2EVjZxovyBSEY2zEb7-gD3AOejB01Cl6y0G91k_t/exec"
};

// メモリ用キャッシュ（ページ読み込み中の保持用）
const craneDataCache = {};

// データを取得・キャッシュ管理する関数
async function getCraneData(model) {
  // 1. メモリキャッシュにあればそれを返す
  if (craneDataCache[model]) {
    return craneDataCache[model];
  }

  // 2. localStorage（ブラウザ保存）にあればそれを返す（爆速）
  const localData = localStorage.getItem(`crane_data_${model}`);
  if (localData) {
    try {
      const parsedData = JSON.parse(localData);
      craneDataCache[model] = parsedData; // メモリにも載せておく
      console.log(`[Cache Hit] localStorageから ${model} のデータを読み出しました`);
      return parsedData;
    } catch (e) {
      console.warn("キャッシュのパースに失敗したため再取得します", e);
      localStorage.removeItem(`crane_data_${model}`);
    }
  }


  // 3. キャッシュが無ければGAS（API）へ通信して取得する
  const url = BaseDataSheetUrls[model];
  if (!url) {
    console.error(`モデル ${model} のURLが設定されていません。`);
    return null;
  }

  try {
    console.log(`[Fetch API] GASから ${model} のデータを新規取得します...`);
    const response = await fetch(url);
    const data = await response.json();

    // 取得したデータをメモリとlocalStorageの両方に保存
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

let jibB = 0;
const jibBtn = document.getElementById('jib-Btn');

jibBtn?.addEventListener('click', () => {
  jibB = 1 - jibB; // 0 と 1 を相互切り替え
  jibBtn.classList.toggle('active', jibB === 1); // activeクラスの着脱

const lengthSlider = document.getElementById('boom-length-slider');
    if (lengthSlider) {
      lengthSlider.dispatchEvent(new Event('input', { bubbles: true }));
    }


});

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

let BSet2 = [];   // 3次元配列
let Bset0 = [];   // 基準のブーム段
let BSsetA = [];  // 各グループの1の個数（0除外・連続重複除去済み）

if (typeof BoomSet === 'string') {
  const matches = BoomSet.match(/\[[^\]]+\]/g);

  if (matches) {
    matches.forEach(jsonStr => {
      const bsetArr = JSON.parse(jsonStr);

      // 1. 各グループの 2次元配列（桁分解済み）を生成
      const groupMatrix = bsetArr.map(num =>
        num.toString(3).padStart(BN, '0').split('').map(Number)
      );
      BSet2.push(groupMatrix);

      // 2. 「0を含む最後の行番号」を特定（1始まりの番号）
      // 末尾から探索（findLastIndex）して、最初に見つかった 0 を含む行のインデックスを取得
      const lastZeroRowIndex = groupMatrix.findLastIndex(row => row.includes(0));
      if (lastZeroRowIndex !== -1) {
        Bset0.push(lastZeroRowIndex + 1); // 1始まりの行番号として格納
      }

      // 3. 各行の「1 の個数」を集計
      const rawCounts = groupMatrix.map(row => 
        row.filter(val => val === 1).length
      );

      // 4. 0 を除外した上で、連続する重複を除外
      const filteredCounts = rawCounts
        .filter(count => count > 0)
        .filter((count, index, array) => 
          index === 0 || count !== array[index - 1]
        );

      BSsetA.push(filteredCounts);
    });
  }
}




let jib1th=BaseData[2][17]/100;
let jib2th=BaseData[3][17]/100;
let jib3th=BaseData[4][17]/100;


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

 const BoomLengthSliderValueChange = document.getElementById('boom-length-slider');
BoomLengthSliderValueChange.setAttribute('min', window.Boom1th/100);
BoomLengthSliderValueChange.setAttribute('max', window[`Boom${BN}th`]/100);
BoomLengthSliderValueChange.setAttribute('value', window.Boom1th/100);

  // --- ブームの生成処理 ---
  const boomLines = [];
  const boom = document.getElementById('boom');
  const boomEdges = [];
  const edge = document.getElementById('edge');
  const jibLines = [];
  const jib = document.getElementById('jib');

  // 【改善】文字列組み立てで一括注入
  let jibHTML = '';
  let edgeHTML = '';
  let boomHTML = '';
  for (let i = BN; i >= 1; i--) {
  const BColor3 = '#d80606';
    jibHTML += `<line id="jib-line-${i}" x1="0" y1="0" y2="0" stroke="${BColor3}" stroke-width="0" />`;


    const BColor2 = '#f39c12';
    edgeHTML += `<line id="boom-Edge-${i}" x1="0" y1="0" y2="0" stroke="${BColor2}" stroke-width="${BoomWidth/100*(10-i)/10}" />`;

    const BColor1 = i === 1 ? '#f39c12' : '#52504e';
    boomHTML += `<line id="boom-line-${i}" x1="0" y1="0" y2="0" stroke="${BColor1}" stroke-width="${BoomWidth/100*(10-i)/10}" />`;
  }
  edge.innerHTML = edgeHTML;
  boom.innerHTML = boomHTML;
  jib.innerHTML = jibHTML;

  for (let i = BN; i >= 1; i--) {
    boomEdges[i] = document.getElementById(`boom-Edge-${i}`);
    boomLines[i] = document.getElementById(`boom-line-${i}`);
    jibLines[i] = document.getElementById(`jib-line-${i}`);
  }

  const boomEdgeLength = 1;//仮
  const boomVerticalLength = BoomWidth / 1000 / 5;//仮
  boomLines[1].setAttribute('x2', Boom1th / 100 - boomEdgeLength * (BN - 1));

  for (let i = 2; i <= BN; i++) {
    boomEdges[i].setAttribute('x2', Boom1th / 100 - boomEdgeLength * (BN - i));
  }

   jibLines[1].setAttribute('x2', jib1th - boomEdgeLength * (BN - 1));

  const slider = document.getElementById('boom-slider');
  const angleVal = document.getElementById('angle-val');
  const WorkingRadius = document.getElementById('working-radius');
  const lengthSlider = document.getElementById('boom-length-slider');
  const lengthVal = document.getElementById('boom-length-val');

  slider.addEventListener('input', (e) => {
    const angle = e.target.value;
    boom.setAttribute('transform', `translate(${-footpinX/100}, ${FootpinTransY}) rotate(${-angle},0,${-BoomWidth/100/2})`);
    edge.setAttribute('transform', `translate(${-footpinX/100}, ${FootpinTransY}) rotate(${-angle},0,${-BoomWidth/100/2})`);
    jib.setAttribute('transform', `translate(${-footpinX/100}, ${FootpinTransY}) rotate(${-angle},0,${-BoomWidth/100/2})`);
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








let baseValues;


const BaseBoom = [];
BaseBoom[1]=Boom1th/100;

Bset0.forEach((val, index) => {
  BaseBoom[index + 2] = window[`Boom${val}th`] / 100;
});



let targetB=length<BaseBoom[2+SB]?0:1;



const LtoB1 = length - BaseBoom[1];
const LtoB2 = length - BaseBoom[2];
const LtoB3 = length - BaseBoom[3];


let BSetA=BSsetA[SB];

if(SB==0){
  
const l1 = targetB === 0 ? LtoB1 / BSetA[0] : (LtoB1 - LtoB2) / BSetA[0];
const l2 = LtoB2 / BSetA[1];

baseValues = [];
let step1 = 1, step2 = 1;

for (let i = 0; i < BN; i++) {
  baseValues[i] = i <BSetA[0] ? BaseBoom[1] + l1 * step1++
                : targetB === 0 ? length
                : BaseBoom[2] + (i > 1  ? l2 * step2++ : 0);
}


/*
 baseValues = targetB === 0
  ?[BaseBoom[1] + l1,
    length,
    length,
    length]
  :[BaseBoom[1] + l1,
    BaseBoom[2],
    BaseBoom[2] + l2,
    BaseBoom[2] + l2 * 2];
*/

}else{
const l1 = (targetB === 0 ? LtoB1 : LtoB1 - LtoB3) / BSetA[0];
const l2 = LtoB3 / BSetA[1];

let s1 = 1, s2 = 1, s3 = 1;
const th = Bset0[SB] - 2;

baseValues = new Array(BN).fill(BaseBoom[1]).map((val, i) => 
  val + (i < th 
    ? (targetB === 0 ? 0 : l2 * s2++) 
    : (targetB === 0 ? l1 * s1++ : LtoB3 + l1 * s3++))
);


  

   /*

  baseValues = targetB === 0
  ?[BaseBoom[1] + l1 * 0,
    BaseBoom[1] + l1 * 0,
    BaseBoom[1] + l1,
    BaseBoom[1] + l1 * 2]

  :[BaseBoom[1] + l2,
    BaseBoom[1] + l2 * 2,
    BaseBoom[1] + LtoB3 + l1,
    BaseBoom[1] + LtoB3 + l1 * 2];


   */



}







// 共通の描画ループ（1回だけで完結）
for (let i = 2; i <= BN-1; i++) {
  const base = baseValues[i - 2];
  const x2 = base - boomEdgeLength * (BN - i);
  const x3 = base - boomEdgeLength * (BN + 1 - i);

  boomLines[i].setAttribute('x2', x2);
  boomEdges[i].setAttribute('x1', x3);
  boomEdges[i].setAttribute('x2', x2);
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



    if(jibB==1){

      const jibShift=boomVerticalLength*(BN-1)+7.54/4;
      jibLines[1].setAttribute('stroke-width',"1");

      jibLines[1].setAttribute('x1', length);
      jibLines[1].setAttribute('x2', length+jib1th);
      jibLines[1].setAttribute('y1', jibShift);
      jibLines[1].setAttribute('y2', jibShift);

    }else{
      jibLines[1].setAttribute('stroke-width',"0");
    }

    lengthVal.textContent = Number(length / 10).toFixed(1);
  });


//jibB




}

function resetAllBoomLength() {
  document.querySelectorAll('[id^="boom-line-"]:not(#boom-line-1)').forEach(line => {
    line.setAttribute('x2', 0);
  });

  document.querySelectorAll('[id^="boom-Edge-"]').forEach(edge => {
    edge.setAttribute('x1', 0);
    edge.setAttribute('x2', 0);
  });

  document.querySelectorAll('[id^="jib-line-"]').forEach(edge => {
    jib.setAttribute('stroke', '#d80606');
    jib.setAttribute('x1', 0);
    jib.setAttribute('x2', 0);
 
  });
}

function calculate(data) {
  const value = data[3][0];
  console.log("計算結果:", value);
}