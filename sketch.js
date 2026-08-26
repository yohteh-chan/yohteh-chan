

const craneMaster = {
    "13t クラス": [
        { id: "KRM-13H-F2H", name: "KRM-13H-F2H" }],
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
            // 遷移先：URLパラメータでIDを渡す
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
  // 他の機種が増えたらここに "B": "..." を追加するだけ
};

// 【追加】取得したスプレッドシートのデータを保存しておくキャッシュ用オブジェクト
const craneDataCache = {};

// 【変更】データを一括取得（またはキャッシュから復元）し、グリッド描画を行う関数
async function fetchCraneDataPreset(model, MaxHolizon, MaxHight, XsizeHolizon) {
  // --- 1. スプレッドシートデータの取得/キャッシュ処理 ---
  if (!craneDataCache[model]) {
    const url = BaseDataSheetUrls[model];
    if (!url) {
      console.error(`モデル ${model} のURLが設定されていません。`);
      return null;
    }
    const response = await fetch(url);
    craneDataCache[model] = await response.json();
  }

  // --- 2. グリッド描画（X軸・Y軸）の組み込み ---
  // 既存の描画を一旦クリア（重複描画の防止）
  const xlabelsGroup = document.getElementById('axis-labels-x');
  const xlinesGroup = document.getElementById('grid-lines-x');
  const ylabelsGroup = document.getElementById('axis-labels-y');
  const ylinesGroup = document.getElementById('grid-lines-y');

  xlabelsGroup.innerHTML = '';
  xlinesGroup.innerHTML = '';
  ylabelsGroup.innerHTML = '';
  ylinesGroup.innerHTML = '';

  const scale = 10; // 1単位あたりのピクセル数

  // X軸の描画
  const XmaxVal = MaxHolizon / 10;
  for (let i = 0; i <= XmaxVal; i += 1) {
    const isMultipleOfFive = (i % 5 === 0);
    const dashStyle = isMultipleOfFive ? '' : 'stroke-dasharray="2,2"';
    const xPos = i * scale;

    const xlineHTML = `<line x1="${xPos}" y1="0" x2="${xPos}" y2=${MaxHight} stroke="#444" stroke-width="1" ${dashStyle} />`;
    xlinesGroup.insertAdjacentHTML('beforeend', xlineHTML);

    const xtextHTML = isMultipleOfFive ? `<text id="x-label-${i}" x="${xPos}" y="0">${i}</text>` : '';
    xlabelsGroup.insertAdjacentHTML('beforeend', xtextHTML);
  }
  xlabelsGroup.setAttribute('transform', `translate(0, ${MaxHight})`);

  // Y軸の描画
  const ymaxVal = MaxHight / 10;
  for (let i = 0; i <= ymaxVal; i += 1) {
    const isMultipleOfFive = (i % 5 === 0);
    const isMultipleLastFive = (i < 5);

    const dashStyle = isMultipleOfFive ? '' : 'stroke-dasharray="2,2"';
    const dashStyle2 = isMultipleLastFive ? 0 : XsizeHolizon;
    const yPos = MaxHight - i * scale;

    const ylineHTML = `<line x1=${dashStyle2} y1="${yPos}" x2=${MaxHolizon} y2="${yPos}" stroke="#444" stroke-width="1" ${dashStyle} />`;
    ylinesGroup.insertAdjacentHTML('beforeend', ylineHTML);

    const ytextHTML = isMultipleOfFive ? `<text id="y-label-${i}" x="-30" y="${yPos}">${i}</text>` : '';
    ylabelsGroup.insertAdjacentHTML('beforeend', ytextHTML);
  }

  // 取得（または保存済み）のデータを返す
  return craneDataCache[model];
}


async function loadCraneBaseData(model) {
  // 最初におおまかなデータ取得処理を行うため仮呼出、または直接fetchCraneDataPresetを呼び出します
  // ※MaxHolizonなどの計算に必要なため、まずはスプレッドシートデータ自体を取得します
  if (!craneDataCache[model]) {
    const url = BaseDataSheetUrls[model];
    const res = await fetch(url);
    craneDataCache[model] = await res.json();
  }
  const data = craneDataCache[model];

  const BaseData = data["製品情報"];
  const DAData = data["危険角度"];
  const DDData = data["描画情報"];
  const J0Data = data["J0"];
  const J1Data = data["J1"];
  const J2Data = data["J2"];

  // 数値の計算
  let CW = BaseData[1][1];
  let CD = BaseData[3][1];
  let AD = BaseData[2][1];
  let BN = BaseData[1][15];
  let boom1st = BaseData[4][15];
  let boom2nd = BaseData[5][15];
  let boom3rd = BaseData[6][15];
  let boom4th = BaseData[7][15];
  let boom5th = BaseData[8][15];
  let boom6th = BaseData[9][15];

  let outrigger1st = BaseData[12][3];
  let outrigger2nd = BaseData[13][3];
  let outrigger3rd = BaseData[14][3];
  let outrigger4th = BaseData[15][3];
  let outrigger5th = BaseData[16][3];

  let MaxHight = Math.ceil(BaseData[10][1]/5000)*50+10;
  let MaxHolizon = Math.ceil(BaseData[12][1]/5000)*50+10;
  let XsizeHolizon = -1 * Math.ceil(BaseData[2][11]/1000)*8;

  // 【ここで呼び出し】グリッド描画と通信管理を一括処理
  await fetchCraneDataPreset(model, MaxHolizon, MaxHight, XsizeHolizon);

  let BoomWidth = BaseData[18][1];
  let tireD = DDData[2][20]/200;
  let tireY = DDData[8][20]/100;

  // タイヤ描画の更新
  const TireD = document.querySelectorAll('.Tire circle');
  TireD.forEach(circle => {
    circle.setAttribute('r', tireD);
    circle.setAttribute('cy', -tireY);
  });

  document.getElementById('crane-chart').setAttribute('viewBox', '0 0 ' + (MaxHolizon) + ' ' + (MaxHight));

  // テキスト情報の反映
  document.getElementById('All-Distance').innerText = "全長: " + AD.toLocaleString()+ "mm";
  document.getElementById('Carrier-Distance').innerText = "車体長: " + (CD).toLocaleString()+ "mm";
  document.getElementById('Carrier-width').innerText = "車体幅: " + (CW).toLocaleString()+ "mm";
  document.getElementById('Boom-1st.distance').innerText = "ブーム一段目: " + (boom1st).toLocaleString()+ "mm";
  document.getElementById('Boom-2nd.distance').innerText = "ブーム二段目: " + (boom2nd).toLocaleString()+ "mm";
  document.getElementById('Boom-3rd.distance').innerText = "ブーム三段目: " + (boom3rd).toLocaleString()+ "mm";
  document.getElementById('Boom-4th.distance').innerText = "ブーム四段目: " + (boom4th).toLocaleString()+ "mm";
  document.getElementById('Boom-5th.distance').innerText = "ブーム五段目: " + (boom5th).toLocaleString()+ "mm";
  document.getElementById('Boom-6th.distance').innerText = "ブーム六段目: " + (boom6th).toLocaleString()+ "mm";

  document.getElementById('Outrigger-1st.distance').innerText = "アウトリガー最小: " + (outrigger1st).toLocaleString()+ "mm";
  document.getElementById('Outrigger-2nd.distance').innerText = "アウトリガー二段目: " + (outrigger2nd).toLocaleString()+ "mm";
  document.getElementById('Outrigger-3rd.distance').innerText = "アウトリガー三段目: " + (outrigger3rd).toLocaleString()+ "mm";
  document.getElementById('Outrigger-4th.distance').innerText = "アウトリガー四段目: " + (outrigger4th).toLocaleString()+ "mm";
  document.getElementById('Outrigger-5th.distance').innerText = "アウトリガー五段目: " + (outrigger5th).toLocaleString()+ "mm";

  // --- ブームの生成処理 ---
  const boomLines = [];
  const boomContainer = document.getElementById('boom');
  boomContainer.innerHTML = ''; // クリア処理

  for (let i = BN; i >= 1; i--) {
    const BColor = i === 1 ? '#f39c12' : '#52504e';
    const groupHTML = `
      <line id="boom-line-${i}" x1="0" y1="0" y2="0" stroke="${BColor}" stroke-width=${BoomWidth/100*(10-i)/10} />
    `;
    boomContainer.insertAdjacentHTML('beforeend', groupHTML);
    boomLines[i] = document.getElementById(`boom-line-${i}`);
  }

  boomLines[1].setAttribute('x2', boom1st/100);

  // スライダー等のイベント設定
  const slider = document.getElementById('boom-slider');
  const boom = document.getElementById('boom');
  const angleVal = document.getElementById('angle-val');

  slider.addEventListener('input', (e) => {
    const angle = e.target.value;
    boom.setAttribute('transform', `translate(-13.2, 337.91) rotate(${-angle},0,-3.77)`);
    angleVal.textContent = Number(angle).toFixed(0);
  });

  const lengthSlider = document.getElementById('boom-length-slider');
  const lengthVal = document.getElementById('boom-length-val');

  lengthSlider.addEventListener('input', (e) => {
    const length = parseFloat(e.target.value);
    resetAllBoomLength();

    if(length <=127.8 ){
      const length1 = length - boom1st / 100;
      boomLines[2].setAttribute('x2', length1/2+53);
      boomLines[3].setAttribute('x2', length);
    } else if(length >127.8){
      const length1 = length - 127.8;
      boomLines[2].setAttribute('x2', 127.8);
      boomLines[3].setAttribute('x2', 127.8);
      boomLines[4].setAttribute('x2', length1/3+127.8);
      boomLines[5].setAttribute('x2', length1*2/3+127.8);
      boomLines[6].setAttribute('x2', length);
    }

    lengthVal.textContent = Number(length/10).toFixed(1);
  });


}

function resetAllBoomLength() {
  // #boom-line-1 以外の boom-line- で始まる要素を取得
  document.querySelectorAll('[id^="boom-line-"]:not(#boom-line-1)').forEach(line => {
    line.setAttribute('x2', 0);
  });


  
}







function calculate(data) {
  // ここでスプレッドシートのデータを使った計算を行います
  // 例: data[0][0] が取得したい値なら
  const value = data[3][0];
  console.log("計算結果:", value);
  
  // 計算結果をHTMLに反映させる処理（必要に応じて）
  // document.getElementById('result').innerText = value;
}

