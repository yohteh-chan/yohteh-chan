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

let jibNumber = BaseData[1][17];
const JibSteps = [];

for (let i = 1; i <= jibNumber; i++) {
  window[`jib${i}th`] = BaseData[i + 1][17]/100;
  JibSteps.push(BaseData[i + 1][17]/100);
}



let jibMin=BaseData[20][1];
let jibMax=BaseData[5][1];


const JS=document.getElementById('jib-slider');

JS.setAttribute('min', jibMin);
JS.setAttribute('max', jibMax);
JS.setAttribute('value', jibMin);

const JLS=document.getElementById('jib-length-slider');
const JLV=document.getElementById('jib-length-val');

JLS.setAttribute('min', window.jib1th);
JLS.setAttribute('max', window[`jib${jibNumber}th`]);
JLV.setAttribute('value', window.jib1th);
JLS.setAttribute('value', window.jib1th);
   
const DHCdata = DDData.map(row => row[32]);//シリンダ・デリック　起伏シリンダー
//描画情報のシリンダデリックのセル数
const DHCCount = DDData.map(row => row[32]).filter(val => val != null && String(val).trim() !== '').length;




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
  const jibHead = document.getElementById('jibHead');
  const head = document.getElementById('head');
  const TensionRod = document.getElementById('TensionRod');
  const DHC = document.getElementById('DerrickHydraulicCylinder');
  const DHCLines=[];


  // 【改善】文字列組み立てで一括注入
  let jibHTML = '';
  let edgeHTML = '';
  let boomHTML = '';
  let headHTML = '';
  let jibHeadHTML = '';
  let TensionRodHTML='';
  let DHCHTML='';

  
  const BColor2 = '#f39c12';
  const BColor3 = '#d80606';

  for (let i = BN; i >= 1; i--) {
    const BColor1 = i === 1 ? '#f39c12' : '#52504e';
    jibHTML += `<line id="jib-line-${i}" x1="0" y1="0" y2="0" stroke="${BColor2}"/>`;
    edgeHTML += `<line id="boom-Edge-${i}" x1="0" y1="0" y2="0" stroke="${BColor2}" stroke-width="${BoomWidth/100*(10-i)/10}" />`;
    boomHTML += `<line id="boom-line-${i}" x1="0" y1="0" y2="0" stroke="${BColor1}" stroke-width="${BoomWidth/100*(10-i)/10}" />`;
  }

  headHTML += `<line id="head-line" x1="0" y1="0" y2="0" stroke="${BColor3}"/>`;
  jibHeadHTML += `<line id="jib-head-line" x1="0" y1="0" y2="0" stroke="${BColor2}"/>`;
  TensionRodHTML += `<line id="TensionRod-line" x1="0" y1="0" y2="0" stroke="${BColor2}"/>`;

  for (let i=0;i<=5;i++){
    DHCHTML += `<circle id="DHC-line-${i}" x1="0" y1="0" y2="0" stroke="${BColor2}"/>`;
  }

  edge.innerHTML = edgeHTML;
  boom.innerHTML = boomHTML;
  jib.innerHTML = jibHTML;
  jibHead.innerHTML = jibHeadHTML;
  head.innerHTML = headHTML;
  TensionRod.innerHTML = TensionRodHTML;
  DHC.innerHTML =DHCHTML;

  for (let i = BN; i >= 1; i--) {
    boomEdges[i] = document.getElementById(`boom-Edge-${i}`);
    boomLines[i] = document.getElementById(`boom-line-${i}`);
    jibLines[i] = document.getElementById(`jib-line-${i}`);
  }




  const headLine = document.getElementById(`head-line`);
  const jibHeadLine = document.getElementById(`jib-head-line`);
  const TensionRodLine = document.getElementById(`TensionRod-line`);


//ここから-------------------------------------------------------------------------------------------------------------------------------------------------

  for (let i=0;i<=5;i++){
    DHCLines[i] = document.getElementById(`DHC-line-${i}`);
  }

  DHCLines[0].setAttribute('r', DHCdata[3]/100);
  DHCLines[0].setAttribute('cx', 13.2+DHCdata[19]/100);
  DHCLines[0].setAttribute('cy', 25.8-DHCdata[18]/100);
  

    console.log("DHCLines",DHCdata[18] / 100);



  const boomEdgeLength = 0.4;//仮
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
  const jibAngle = document.getElementById('jib-slider');
  const jibAngleVal = document.getElementById('jib-angle-val');

  const jibShift=boomVerticalLength*(BN-1)+7.54/4;//仮
  const jibLength = document.getElementById('jib-length-slider');
  const jibLengthVal = document.getElementById('jib-length-val');

  jibAngle.addEventListener('input', (e) => {
    const angle = e.target.value;
    jibAngleVal.textContent = Number(angle).toFixed(0);
    lengthSlider.dispatchEvent(new Event('input'));
  });

  jibLength.addEventListener('input', (e) => {
    const length = e.target.value;
    jibLengthVal.textContent = Number(length/10).toFixed(2);
    lengthSlider.dispatchEvent(new Event('input'));
  });
 

  slider.addEventListener('input', (e) => {
    const angle = e.target.value;
    boom.setAttribute('transform', `translate(${-footpinX/100}, ${FootpinTransY}) rotate(${-angle},0,${-BoomWidth/100/2})`);
    edge.setAttribute('transform', `translate(${-footpinX/100}, ${FootpinTransY}) rotate(${-angle},0,${-BoomWidth/100/2})`);
    jib.setAttribute('transform', `translate(${-footpinX/100}, ${FootpinTransY}) rotate(${-angle},0,${-BoomWidth/100/2})`);
    head.setAttribute('transform', `translate(${-footpinX/100}, ${FootpinTransY}) rotate(${-angle},0,${-BoomWidth/100/2})`);
    jibHead.setAttribute('transform', `translate(${-footpinX/100}, ${FootpinTransY}) rotate(${-angle},0,${-BoomWidth/100/2})`);
    TensionRod.setAttribute('transform', `translate(${-footpinX/100}, ${FootpinTransY}) rotate(${-angle},0,${-BoomWidth/100/2})`);
    DHC.setAttribute('transform', `translate(${-footpinX/100}, ${FootpinTransY}) rotate(${-angle},0,${-BoomWidth/100/2})`);
    angleVal.textContent = Number(angle).toFixed(0);
    BoomAngle = Number(angle).toFixed(0);

    WorkingRadius.textContent = String(Number(Math.floor((BoomLength*Math.cos(BoomAngle * Math.PI / 180)+BoomWidth/1000*Math.sin(BoomAngle * Math.PI / 180)-1.32)*10)/10).toFixed(1)).padStart(4, ' ');
    lengthSlider.dispatchEvent(new Event('input'));
  });







  lengthSlider.addEventListener('input', (e) => {
    const length = parseFloat(e.target.value);
    resetAllBoomLength();




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


      headLine.setAttribute('x1', length);
      headLine.setAttribute('x2', length);
      headLine.setAttribute('y1', -7.54/2);
      headLine.setAttribute('y2', 8.6936-7.54/2);
      headLine.setAttribute('stroke-width',2.51);



let JAangle =  (jibAngle.value * Math.PI) / 180;
let jibHeadLineDist=2;//仮
let jibHeadY = 1.454;
let jibLine1thY=1.454;
let jibLine2thY=1.11;
let TenshionRodR=1;//テンションロッドの太さ



    if(jibB==1){
      jibHeadLine.setAttribute('stroke-width',jibHeadY);//仮
  
      jibLines[1].setAttribute('stroke-width',jibLine1thY);//仮
      jibLines[2].setAttribute('stroke-width',jibLine2thY);//仮
      jibLines[2].setAttribute('stroke',"#52504e");//仮


      TensionRodLine.setAttribute('stroke-width',TenshionRodR);//仮
      TensionRodLine.setAttribute('x1', length);
      TensionRodLine.setAttribute('x2', length+jib1th* Math.cos(JAangle));
      TensionRodLine.setAttribute('y1', -7.54/2);//仮
      TensionRodLine.setAttribute('y2', jibShift + jib1th * Math.sin(JAangle));

     const setLine = (line, x1, x2, y1, y2) => {
      line.setAttribute('x1', x1);
      line.setAttribute('x2', x2);
      line.setAttribute('y1', y1);
      line.setAttribute('y2', y2);
    };

    const jibLen = Number(jibLength.value);
    const cosA = Math.cos(JAangle);
    const sinA = Math.sin(JAangle);

    // 1. ジブライン（複数段）の処理
    for (let i = 1; i <= jibNumber; i++) {
      const len = i === 1 ? window[`jib${i}th`] : jibLen;
      if (jibLines[i] && len) {
        setLine(jibLines[i], length, length + len * cosA, jibShift, jibShift + len * sinA);
      }
    }

    // 2. ジブヘッドラインの処理
    if (jibHeadLine) {
      const xEnd = length + jibLen * cosA;
      const yEnd = jibShift + jibLen * sinA;
      setLine(jibHeadLine, xEnd - jibHeadLineDist * cosA, xEnd, yEnd - jibHeadLineDist * sinA, yEnd);
    }


    }else{


// 共通計算値の事前定義
const BaseBoom = Boom1th / 100;
const jibTipX = BaseBoom - jib1th;
const jibHeadTipX = jibTipX + jibHeadLineDist;

const HeadHalf = 7.54 / 2; // 約 3.77
const tensionY = HeadHalf - jibLine1thY * 0.5;

// 1. ジブラインの一括設定（ループ）
for (let i = 1; i <= jibNumber; i++) {
  if (!jibLines[i]) continue;
  jibLines[i].setAttribute('x1', BaseBoom);
  jibLines[i].setAttribute('x2', jibTipX);
  jibLines[i].setAttribute('y1', HeadHalf);
  jibLines[i].setAttribute('y2', HeadHalf);
}

// 2. 補助関数の定義（複数要素の属性設定を共通化）
const setLine = (line, x1, x2, y1, y2) => {
  if (!line) return;
  line.setAttribute('x1', x1);
  line.setAttribute('x2', x2);
  line.setAttribute('y1', y1);
  line.setAttribute('y2', y2);
};

// 3. 各ラインの配置設定
setLine(jibHeadLine, jibTipX, jibHeadTipX, HeadHalf, HeadHalf);
setLine(TensionRodLine, BaseBoom, jibHeadTipX, tensionY, tensionY);
    }

    

    lengthVal.textContent = Number(length / 10).toFixed(1);

    
  });

  slider.dispatchEvent(new Event('input'));
  lengthSlider.dispatchEvent(new Event('input'));
  jibAngle.dispatchEvent(new Event('input'));





}

function resetAllBoomLength() {
  document.querySelectorAll('[id^="boom-line-"]:not(#boom-line-1)').forEach(line => {
    line.setAttribute('x2', 0);
  });

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

  document.querySelectorAll('[id^="DHC-line-"]').forEach(DHC => {
    DHC.setAttribute('stroke', '#f39c12');
   // DHC.setAttribute('cx', 0);
   // DHC.setAttribute('cy', 0);
  });

}

function calculate(data) {
  const value = data[3][0];
  console.log("計算結果:", value);
}