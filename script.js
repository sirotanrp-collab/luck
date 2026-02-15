/**
 * ラッキー・ロト・ライフ - ゲームロジック
 * 時間は「週」単位。4週=1ヶ月、12ヶ月=1年。
 */

(function () {
  'use strict';

  // ---------- 定数（年末ジャンボ準拠） ----------
  const LOTTERY_PRICES = [
    { grade: 1, name: '1等', amount: 700000000, baseProb: 0.00000005 },
    { grade: 2, name: '1等前後賞', amount: 150000000, baseProb: 0.0000001 },
    { grade: 3, name: '2等', amount: 10000000, baseProb: 0.0000002 },
    { grade: 4, name: '3等', amount: 1000000, baseProb: 0.000005 },
    { grade: 5, name: '4等', amount: 50000, baseProb: 0.0001 },
    { grade: 6, name: '5等', amount: 10000, baseProb: 0.001 },
    { grade: 7, name: '6等', amount: 3000, baseProb: 0.01 },
    { grade: 8, name: '7等', amount: 300, baseProb: 0.1 }
  ];

  const TICKET_OPTIONS = [
    { count: 1, price: 300 },
    { count: 10, price: 3000 },
    { count: 100, price: 30000 },
    { count: 1000, price: 300000 }
  ];

  // 運気ランク（表示用）。小吉=0倍、内部確率は -3倍～5倍
  const LUCK_RANKS = [
    { name: '大凶', minLuck: 0, multiplier: -3 },
    { name: '凶', minLuck: 0.5, multiplier: -2 },
    { name: '小吉', minLuck: 0.8, multiplier: 0 },
    { name: '中吉', minLuck: 1.1, multiplier: 1 },
    { name: '吉', minLuck: 1.5, multiplier: 3 },
    { name: '大吉', minLuck: 2.0, multiplier: 5 }
  ];

  // 家具アイテム（id, 名前, 価格, 運気上昇倍率, スプライト12x12: 0=透明 1=主色 2=副色）
  const FURNITURE_SPRITES = {
    plant: { colors: ['#4a7c59', '#8b7355'], rows: ['000001110000', '000011111000', '000111111100', '001111111110', '001111111110', '000111111100', '000011111000', '000001110000', '000022222200', '000222222220', '002222222222', '002222222222'] },
    candle: { colors: ['#f5e6c8', '#e85a3a'], rows: ['000000110000', '000001111000', '000001111000', '000000110000', '000011111100', '000011111100', '000011111100', '000011111100', '000011111100', '000011111100', '000011111100', '000022222200'] },
    goldfig: { colors: ['#d4a84b', '#8b6914'], rows: ['000001111000', '000011111100', '000111111110', '001111111111', '001111111111', '000111111110', '000011111100', '000001111000', '000002222200', '000022222220', '000222222222', '000222222222'] },
    carpet: { colors: ['#8b4513', '#a0522d'], rows: ['111111111111', '122121212121', '111111111111', '212121212122', '111111111111', '122121212121', '111111111111', '212121212122', '111111111111', '122121212121', '111111111111', '212121212122'] },
    painting: { colors: ['#87ceeb', '#5c4033'], rows: ['222222222222', '211111111112', '211111111112', '211111111112', '211111111112', '211111111112', '211111111112', '211111111112', '211111111112', '211111111112', '211111111112', '222222222222'] },
    crystalshelf: { colors: ['#9b59b6', '#5c4033'], rows: ['222222222222', '222222222222', '201020102010', '210201020102', '201020102010', '222222222222', '222222222222', '201020102010', '210201020102', '201020102010', '222222222222', '222222222222'] },
    luxuryclock: { colors: ['#d4a84b', '#2c1810'], rows: ['000022222200', '002222222220', '022211111222', '022111111122', '221111111112', '221111111112', '221111111112', '221111111112', '022111111122', '022211111222', '002222222220', '000022222200'] }
  };
  const FURNITURE_ITEMS = [
    { id: 'plant', name: '小さな観葉植物', price: 1000, bonus: 0.5 },
    { id: 'candle', name: 'ラッキーキャンドル', price: 3000, bonus: 1 },
    { id: 'goldfig', name: '金の置物', price: 8000, bonus: 2 },
    { id: 'carpet', name: '高級じゅうたん', price: 20000, bonus: 4 },
    { id: 'painting', name: '幸運の絵画', price: 50000, bonus: 6 },
    { id: 'crystalshelf', name: 'パワーストーン棚', price: 120000, bonus: 10 },
    { id: 'luxuryclock', name: '超高級時計', price: 500000, bonus: 20 }
  ];

  // ---------- 競馬：マスタデータ ----------
  const HORSE_NAMES = ['ゴールドフェザー', 'アビスシャドウ', 'サイレントスカイ', 'トウカイオー', 'オグリパンチ', 'メジロクイーン', 'ダイワスター', 'ライスヒーロー', 'テイエムビクトリー', 'エルコンドル', 'アグネスオーロラ', 'マンハッタンボス', 'スマートランナー', 'カレンベル', 'ジェンティルハート', 'キタサンメテオ', 'サトノティアラ', 'シンボリエンペラー', 'マルゼンスピード', 'ヒシクイーン', 'タイキワールド', 'グラスドリーム', 'スペシャルウィークリー', 'セイウンクラウド', 'サクラアクセル', 'マヤノフェニックス', 'スーパークリーナー', 'ナリタタイガー', 'ビワホワイト', 'チケットホルダー', 'エアクイーン', 'タマモストーム', 'イナリウルフ', 'ミスターロード', 'カツラギエース', 'ニホンピロスター', 'ホクトベガスター', 'クロフネジェット', 'キングエンペラー', 'ウオッカショット', 'ハープソング', 'ゴールドシップマン', 'オルフェーヴルノ', 'ロードエース', 'モーリスゴールド', 'エピファキング', 'ドゥラメンテオー', 'キタサンキング', 'アーモンドアイリス', 'ハルウララッキー'];
  const JOCKEY_NAMES = ['竹原豊', 'C.ルメートル', 'M.デムーア', '川田将', '福永祐', '横山典', '岩田康', '戸崎圭', '内田博', '鮫島克', '坂井瑠', '松山弘', '田辺裕', '藤田菜', '団野大', '菅原明', '浜中俊', '池添謙', '幸英明', '和田竜', '三浦皇', '北村友', '荻野極', '津村明', '大野拓', '丹内祐', '柴田大', '菱田裕', '西村淳', '永島ま'];

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function createHorseMaster() {
    var horses = [];
    var strategies = [1, 2, 3, 4];
    var surfaces = ['芝', 'ダート'];
    for (var i = 0; i < HORSE_NAMES.length; i++) {
      horses.push({
        id: i,
        name: HORSE_NAMES[i],
        stats: {
          speed: 1 + (i * 7) % 91 / 10,
          stamina: 1 + (i * 13) % 91 / 10,
          power: 1 + (i * 19) % 91 / 10,
          sharpness: 1 + (i * 23) % 91 / 10
        },
        strategy: strategies[i % 4],
        apt: {
          distance: 1000 + Math.floor((i * 37) % 27) * 100,
          surface: surfaces[i % 2]
        }
      });
    }
    return horses;
  }
  function createJockeyMaster() {
    var jockeys = [];
    for (var i = 0; i < JOCKEY_NAMES.length; i++) {
      jockeys.push({
        id: i,
        name: JOCKEY_NAMES[i],
        stats: {
          skill: 1 + (i * 11) % 91 / 10,
          stamina: 1 + (i * 29) % 91 / 10
        }
      });
    }
    return jockeys;
  }

  var HORSE_MASTER = createHorseMaster();
  var JOCKEY_MASTER = createJockeyMaster();

  var RACE_VENUES = ['東京', '阪神', '中京', '新潟', '福島'];
  var RACE_WEATHER = ['晴', '曇', '小雨', '雨'];
  var RACE_TRACK = ['良', '稍重', '重', '不良'];

  var STRATEGY_NAMES = { 1: '逃げ', 2: '先行', 3: '差し', 4: '追込' };
  var CONDITION_NAMES = { 1: '絶好調', 2: '好調', 3: '普通', 4: '不調', 5: '絶不調' };
  var CONDITION_MOD = { 1: 2.0, 2: 1.0, 3: 0, 4: -1.0, 5: -2.0 };
  var FRAME_COLORS = ['#ffffff', '#2d2d2d', '#c0392b', '#2980b9', '#f1c40f', '#27ae60', '#e67e22', '#e91e8c'];

  // ---------- 状態 ----------
  let state = {
    money: 1000000,
    luck: 1.0,
    year: 2026,
    month: 1,
    week: 1,
    inventory: [],
    placedFurniture: {},
    screen: 'main', // 'main' | 'race'
    currentRace: null, // { venue, course, distance, weather, trackCondition, entries[], generatedAt }
    raceTickets: [] // { type, selections[], points, totalYen }
  };

  const messages = {
    default: '運気を高めて、宝くじに挑戦しよう！',
    training: 'トレーニングで運気が変動した…！',
    trainingUp: '運気が上がった！いい感じ！',
    trainingDown: '少し運気が下がった…またトレーニングしよう。',
    buyLottery: '宝くじを買った。結果はどうなる…？',
    noWin: '今回はハズレ。次こそ！',
    win: '当たった！おめでとう！'
  };

  // ---------- DOM ----------
  const el = {
    dateDisplay: document.getElementById('date-display'),
    moneyDisplay: document.getElementById('money-display'),
    luckDisplay: document.getElementById('luck-display'),
    situationMessage: document.getElementById('situation-message'),
    btnTraining: document.getElementById('btn-training'),
    btnLottery: document.getElementById('btn-lottery'),
    btnShop: document.getElementById('btn-shop'),
    btnInventory: document.getElementById('btn-inventory'),
    lotteryModal: document.getElementById('lottery-modal'),
    resultModal: document.getElementById('result-modal'),
    shopModal: document.getElementById('shop-modal'),
    shopList: document.getElementById('shop-list'),
    shopBack: document.getElementById('btn-shop-back'),
    inventoryModal: document.getElementById('inventory-modal'),
    inventoryList: document.getElementById('inventory-list'),
    inventoryTotal: document.getElementById('inventory-total'),
    btnInventoryBack: document.getElementById('btn-inventory-back'),
    drawingOverlay: document.getElementById('drawing-overlay'),
    drawingText: document.getElementById('drawing-text'),
    drawingDots: document.getElementById('drawing-dots'),
    btnLotteryBack: document.getElementById('btn-lottery-back'),
    ticketOptions: document.querySelectorAll('.ticket-btn'),
    resultTitle: document.getElementById('result-title'),
    resultSummary: document.getElementById('result-summary'),
    resultDetails: document.getElementById('result-details'),
    btnCloseResult: document.getElementById('btn-close-result'),
    room: document.getElementById('room'),
    hero: document.getElementById('hero'),
    roomSlotsContainer: document.getElementById('room-slots'),
    placeModal: document.getElementById('place-modal'),
    placeModalTitle: document.getElementById('place-modal-title'),
    placeSlotsContainer: document.getElementById('place-slots-container'),
    btnPlaceBack: document.getElementById('btn-place-back'),
    mainScreen: document.getElementById('main-screen'),
    raceScreen: document.getElementById('race-screen'),
    btnGoRace: document.getElementById('btn-go-race'),
    raceHeader: document.getElementById('race-header'),
    raceTableWrap: document.getElementById('race-table-wrap'),
    raceTable: document.getElementById('race-table'),
    btnBuyTickets: document.getElementById('btn-buy-tickets'),
    btnBackFromRace: document.getElementById('btn-back-from-race'),
    btnStartRace: document.getElementById('btn-start-race'),
    ticketModal: document.getElementById('ticket-modal'),
    ticketTabs: document.getElementById('ticket-tabs'),
    ticketPlace1: document.getElementById('ticket-place1'),
    ticketPlace2: document.getElementById('ticket-place2'),
    ticketPlace3: document.getElementById('ticket-place3'),
    ticketPoints: document.getElementById('ticket-points'),
    ticketTotalYen: document.getElementById('ticket-total-yen'),
    btnTicketConfirm: document.getElementById('btn-ticket-confirm'),
    btnTicketModalBack: document.getElementById('btn-ticket-modal-back'),
    raceResultModal: document.getElementById('race-result-modal'),
    raceResultTable: document.getElementById('race-result-table'),
    raceResultTbody: document.getElementById('race-result-tbody'),
    payoutTbody: document.getElementById('payout-tbody'),
    raceResultTotalPayout: document.getElementById('race-result-total-payout'),
    btnRaceResultClose: document.getElementById('btn-race-result-close'),
    ticketYenInput: document.getElementById('ticket-yen-input'),
    ticketYenPerPointDisplay: document.getElementById('ticket-yen-per-point-display'),
    racePurchasedWrap: document.getElementById('race-purchased-wrap'),
    racePurchasedList: document.getElementById('race-purchased-list'),
    racePurchasedSummary: document.getElementById('race-purchased-summary'),
    userTicketsList: document.getElementById('user-tickets-list'),
    raceAnimOverlay: document.getElementById('race-anim-overlay'),
    raceAnimHeader: document.getElementById('race-anim-header'),
    raceAnimPhase: document.getElementById('race-anim-phase')
  };

  // ---------- 時間進行 ----------
  function advanceWeek() {
    state.week += 1;
    if (state.week > 4) {
      state.week = 1;
      state.month += 1;
    }
    if (state.month > 12) {
      state.month = 1;
      state.year += 1;
    }
    generateCurrentRace();
  }

  // JRA実際の控除率に基づく返還率（券種別）
  var TAKEOUT_RATES = {
    tansho: 0.80,      // 単勝: 控除20%
    fukusho: 0.80,     // 複勝: 控除20%
    umaren: 0.775,     // 馬連: 控除22.5%
    wide: 0.775,       // ワイド: 控除22.5%
    umatan: 0.75,      // 馬単: 控除25%
    sanrenpuku: 0.75,  // 3連複: 控除25%
    sanrentan: 0.725   // 3連単: 控除27.5%
  };

  function harvilleUmatan(P, a, b) {
    if (a === b || P[a] >= 1) return 0;
    return P[a] * (P[b] / (1 - P[a]));
  }
  function harvilleUmaren(P, a, b) {
    if (a === b) return 0;
    return harvilleUmatan(P, a, b) + harvilleUmatan(P, b, a);
  }
  function harvilleSanrentan(P, a, b, c) {
    if (a === b || a === c || b === c) return 0;
    var denom1 = 1 - P[a];
    if (denom1 <= 0) return 0;
    var denom2 = denom1 - P[b];
    if (denom2 <= 0) return 0;
    return P[a] * (P[b] / denom1) * (P[c] / denom2);
  }
  function harvilleSanrenpuku(P, a, b, c) {
    var perm = [[a,b,c],[a,c,b],[b,a,c],[b,c,a],[c,a,b],[c,b,a]];
    var sum = 0;
    for (var i = 0; i < 6; i++) sum += harvilleSanrentan(P, perm[i][0], perm[i][1], perm[i][2]);
    return sum;
  }
  function harvilleFukushoProb(P, i) {
    var p1 = P[i];
    var p2 = 0;
    for (var j = 0; j < 8; j++) {
      if (j === i) continue;
      p2 += P[j] * (P[i] / (1 - P[j]));
    }
    var p3 = 0;
    for (var j = 0; j < 8; j++) {
      if (j === i) continue;
      for (var k = 0; k < 8; k++) {
        if (k === i || k === j) continue;
        var d1 = 1 - P[j];
        if (d1 <= 0) continue;
        var d2 = d1 - P[k];
        if (d2 <= 0) continue;
        p3 += P[j] * (P[k] / d1) * (P[i] / d2);
      }
    }
    return p1 + p2 + p3;
  }
  function harvilleWideProb(P, a, b) {
    // a,bが共にtop3に入る確率 = 3番目の馬cを全通り試し、{a,b,c}がtop3になる確率の合計
    if (a === b) return 0;
    var prob = 0;
    for (var c = 0; c < P.length; c++) {
      if (c === a || c === b) continue;
      prob += harvilleSanrenpuku(P, a, b, c);
    }
    return prob;
  }
  function probToOdds(prob, takeout) {
    if (takeout == null) takeout = TAKEOUT_RATES.tansho;
    if (prob <= 0) return 999.9;
    return Math.max(1.1, Math.round((takeout / prob) * 10) / 10);
  }

  // ---------- 競馬：週送り時にレース生成（Harvilleオッズ付き） ----------
  function generateCurrentRace() {
    var course = pick(['芝', 'ダート']);
    var distance = 1000 + Math.floor(Math.random() * 27) * 100;
    var venue = pick(RACE_VENUES);
    var weather = pick(RACE_WEATHER);
    var trackCondition = pick(RACE_TRACK);
    var horseIndices = shuffle(HORSE_MASTER.map(function (_, i) { return i; })).slice(0, 8);
    var jockeyIndices = shuffle(JOCKEY_MASTER.map(function (_, i) { return i; })).slice(0, 8);
    var entries = [];
    for (var i = 0; i < 8; i++) {
      var horse = HORSE_MASTER[horseIndices[i]];
      var jockey = JOCKEY_MASTER[jockeyIndices[i]];
      var condition = 1 + Math.floor(Math.random() * 5);
      var speed = horse.stats.speed;
      var stamina = horse.stats.stamina;
      var skill = jockey.stats.skill;
      var conditionMod = CONDITION_MOD[condition];
      var aptDist = (Math.abs(distance - horse.apt.distance) <= 200) ? 1.0 : 0;
      var aptSurface = (course === horse.apt.surface) ? 1.0 : 0;
      var score = (speed * 0.35 + stamina * 0.35 + skill * 0.3) + conditionMod + aptDist + aptSurface;
      entries.push({
        frame: i + 1,
        horse: horse,
        jockey: jockey,
        condition: condition,
        conditionMod: conditionMod,
        speed: speed,
        stamina: stamina,
        skill: skill,
        oddsScore: score
      });
    }
    var sumE = 0;
    var eValues = entries.map(function (e) {
      var ev = Math.exp(e.oddsScore * 0.8);
      sumE += ev;
      return ev;
    });
    var P = eValues.map(function (ev) { return ev / sumE; });
    for (var k = 0; k < 8; k++) {
      entries[k].P = P[k];
      entries[k].odds = probToOdds(P[k], TAKEOUT_RATES.tansho);
      entries[k].fukushoOdds = probToOdds(harvilleFukushoProb(P, k), TAKEOUT_RATES.fukusho);
    }
    state.currentRace = {
      venue: venue,
      course: course,
      distance: distance,
      weather: weather,
      trackCondition: trackCondition,
      entries: entries,
      P: P,
      generatedAt: state.year + '-' + state.month + '-' + state.week
    };
    // 未使用の馬券があれば返金
    if (state.raceTickets && state.raceTickets.length > 0) {
      var refund = 0;
      state.raceTickets.forEach(function (t) { refund += t.totalYen; });
      if (refund > 0) {
        state.money += refund;
      }
    }
    state.raceTickets = [];
  }

  function rankMarkStrict(rank) {
    if (rank === 1) return '◎';
    if (rank === 2) return '○';
    if (rank === 3) return '▲';
    if (rank === 4) return '△';
    return '-';
  }

  function strictRank(values) {
    var n = values.length;
    var order = values.map(function (v, i) { return { i: i, v: v }; });
    order.sort(function (a, b) {
      if (b.v !== a.v) return b.v - a.v;
      return a.i - b.i;
    });
    var rank = [];
    for (var r = 0; r < n; r++) rank[order[r].i] = r + 1;
    return rank;
  }

  function computeRaceEvaluations(entries) {
    var totalRank = strictRank(entries.map(function (e) { return e.oddsScore; }));
    var speedRank = strictRank(entries.map(function (e) { return e.speed; }));
    var staminaRank = strictRank(entries.map(function (e) { return e.stamina; }));
    var developRank = strictRank(entries.map(function (e) {
      return e.skill + e.jockey.stats.stamina + e.conditionMod;
    }));
    return {
      total: totalRank,
      speed: speedRank,
      stamina: staminaRank,
      develop: developRank
    };
  }

  function runRace(entries) {
    var results = entries.map(function (e, i) {
      var score = (e.speed + e.stamina + e.skill) + e.conditionMod + rand(0, 10);
      return { entryIndex: i, score: score };
    });
    results.sort(function (a, b) { return b.score - a.score; });
    var order = results.map(function (r) { return r.entryIndex; });
    var scoresByOrder = results.map(function (r) { return r.score; });
    var scoresOriginal = [];
    order.forEach(function (idx, pos) { scoresOriginal[idx] = scoresByOrder[pos]; });
    return { order: order, scores: scoresOriginal };
  }

  var MARGIN_LABELS = ['ハナ', 'クビ', 'アタマ', '1/2', '1', '2', '3', '4'];
  function scoreDiffToMargin(diff) {
    if (diff <= 0) return '同';
    if (diff < 0.25) return 'ハナ';
    if (diff < 0.5) return 'クビ';
    if (diff < 0.8) return 'アタマ';
    if (diff < 1.2) return '1/2';
    if (diff < 2) return '1';
    if (diff < 3) return '2';
    if (diff < 4) return '3';
    return '4';
  }

  function buildRaceResultTable(race, runResult) {
    var entries = race.entries;
    var order = runResult.order;
    var scores = runResult.scores;
    var baseTimeSec = 60 + (race.distance / 1200) * 30 + Math.random() * 5;
    var rows = [];
    var sortedByOdds = entries.map(function (e, i) { return { i: i, o: e.odds }; }).sort(function (a, b) { return a.o - b.o; });
    var ninki = [];
    sortedByOdds.forEach(function (x, r) { ninki[x.i] = r + 1; });
    for (var pos = 0; pos < 8; pos++) {
      var idx = order[pos];
      var e = entries[idx];
      var margin = (pos === 0) ? '' : scoreDiffToMargin(scores[order[pos - 1]] - scores[idx]);
      var timeSec = (pos === 0) ? baseTimeSec : (rows[pos - 1].timeSec + (scores[order[pos - 1]] - scores[idx]) * 0.5);
      var secPart = (timeSec % 60);
      var timeStr = Math.floor(timeSec / 60) + ':' + (secPart < 10 ? '0' : '') + secPart.toFixed(1);
      var agari = (33 + Math.random() * 3).toFixed(1);
      rows.push({
        pos: pos + 1,
        frame: e.frame,
        horseNum: e.frame,
        name: e.horse.name,
        jockey: e.jockey.name,
        timeSec: timeSec,
        timeStr: timeStr,
        margin: margin,
        agari: agari,
        odds: e.odds,
        ninki: ninki[idx]
      });
    }
    return rows;
  }

  function showMainScreen() {
    state.screen = 'main';
    if (el.mainScreen) el.mainScreen.classList.remove('hidden');
    if (el.raceScreen) el.raceScreen.classList.add('hidden');
  }

  function showRaceScreen() {
    state.screen = 'race';
    if (el.mainScreen) el.mainScreen.classList.add('hidden');
    if (el.raceScreen) el.raceScreen.classList.remove('hidden');
    renderRaceTable();
    renderPurchasedTickets();
  }

  // 馬券の選択内容をテキスト表現に変換
  function ticketSelectionsText(t) {
    var bt = BET_TYPES.find(function (x) { return x.id === t.type; });
    if (!bt) return '';
    if (bt.cols === 1) {
      return t.place1.join(',');
    } else if (bt.cols === 2) {
      return t.place1.join(',') + ' - ' + t.place2.join(',');
    } else {
      return t.place1.join(',') + ' - ' + t.place2.join(',') + ' - ' + t.place3.join(',');
    }
  }

  // 購入済み馬券一覧をレース画面に描画
  function renderPurchasedTickets() {
    if (!el.racePurchasedList) return;
    el.racePurchasedList.innerHTML = '';
    var totalYen = 0;
    var totalPoints = 0;
    if (state.raceTickets.length === 0) {
      el.racePurchasedList.innerHTML = '<p class="purchased-empty">まだ馬券を購入していません</p>';
    } else {
      state.raceTickets.forEach(function (t, idx) {
        totalYen += t.totalYen;
        totalPoints += t.points;
        var row = document.createElement('div');
        row.className = 'purchased-ticket-row';
        row.innerHTML =
          '<span class="purchased-type">' + getBetTypeName(t.type) + '</span>' +
          '<span class="purchased-sel">' + ticketSelectionsText(t) + '</span>' +
          '<span class="purchased-pts">' + t.points + '点</span>' +
          '<span class="purchased-yen">¥' + t.totalYen.toLocaleString() + '</span>' +
          '<button type="button" class="btn-del-ticket" data-idx="' + idx + '" title="取消">×</button>';
        el.racePurchasedList.appendChild(row);
      });
      // 削除ボタンのイベント登録
      el.racePurchasedList.querySelectorAll('.btn-del-ticket').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var i = parseInt(this.dataset.idx, 10);
          if (i >= 0 && i < state.raceTickets.length) {
            var removed = state.raceTickets.splice(i, 1)[0];
            state.money += removed.totalYen;
            updateUI();
            renderPurchasedTickets();
            setMessage(getBetTypeName(removed.type) + 'を取り消した (¥' + removed.totalYen.toLocaleString() + ' 返金)');
          }
        });
      });
    }
    if (el.racePurchasedSummary) {
      if (totalYen > 0) {
        el.racePurchasedSummary.textContent = '（' + totalPoints + '点 / ¥' + totalYen.toLocaleString() + '）';
      } else {
        el.racePurchasedSummary.textContent = '';
      }
    }
  }

  function renderRaceTable() {
    if (!state.currentRace || !el.raceTable) return;
    var race = state.currentRace;
    var entries = race.entries;
    var ev = computeRaceEvaluations(entries);
    if (el.raceHeader) {
      el.raceHeader.textContent = race.venue + ' ' + race.course + ' ' + race.distance + 'm ' + race.weather + ' 馬場' + race.trackCondition;
    }
    el.raceTable.innerHTML = '';
    var headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>枠</th><th>オッズ</th><th>馬名</th><th>脚質</th><th>調子</th><th>騎手</th><th>総合</th><th>スピ</th><th>スタ</th><th>展開</th>';
    el.raceTable.appendChild(headerRow);
    entries.forEach(function (e, i) {
      var tr = document.createElement('tr');
      var fg = (e.frame === 2) ? '#fff' : '#333';
      tr.innerHTML =
        '<td class="frame-cell" style="background:' + FRAME_COLORS[e.frame - 1] + ';color:' + fg + '">' + e.frame + '</td>' +
        '<td style="color:' + (e.odds < 10 ? '#c0392b' : 'inherit') + ';font-weight:' + (e.odds < 10 ? 'bold' : 'normal') + '">' + (typeof e.odds === 'number' ? e.odds.toFixed(1) : e.odds) + '</td>' +
        '<td>' + e.horse.name + '</td>' +
        '<td>' + STRATEGY_NAMES[e.horse.strategy] + '</td>' +
        '<td>' + CONDITION_NAMES[e.condition] + '</td>' +
        '<td>' + e.jockey.name + '</td>' +
        '<td>' + rankMarkStrict(ev.total[i]) + '</td>' +
        '<td>' + rankMarkStrict(ev.speed[i]) + '</td>' +
        '<td>' + rankMarkStrict(ev.stamina[i]) + '</td>' +
        '<td>' + rankMarkStrict(ev.develop[i]) + '</td>';
      el.raceTable.appendChild(tr);
    });
  }

  var BET_TYPES = [
    { id: 'tansho', name: '単勝', cols: 1, labels: ['馬番'] },
    { id: 'fukusho', name: '複勝', cols: 1, labels: ['馬番'] },
    { id: 'wide', name: 'ワイド', cols: 2, labels: ['1頭目', '2頭目'] },
    { id: 'umaren', name: '馬連', cols: 2, labels: ['1頭目', '2頭目'] },
    { id: 'umatan', name: '馬単', cols: 2, labels: ['1着', '2着'] },
    { id: 'sanrenpuku', name: '3連複', cols: 3, labels: ['1頭目', '2頭目', '3頭目'] },
    { id: 'sanrentan', name: '3連単', cols: 3, labels: ['1着', '2着', '3着'] }
  ];
  function getBetTypeName(id) {
    var bt = BET_TYPES.find(function (x) { return x.id === id; });
    return bt ? bt.name : id;
  }
  var TICKET_PRICE_PER_POINT = 100;
  var ticketSelection = { place1: [], place2: [], place3: [], betType: 'tansho' };

  function getTicketOddsRange() {
    if (!state.currentRace || !state.currentRace.P) return { min: 0, max: 0 };
    var P = state.currentRace.P;
    var t = ticketSelection.betType;
    var p1 = ticketSelection.place1.slice();
    var p2 = ticketSelection.place2.slice();
    var p3 = ticketSelection.place3.slice();
    var minO = 9999;
    var maxO = 0;
    function addOdds(o) {
      if (o > 0 && o < 9999) { if (o < minO) minO = o; if (o > maxO) maxO = o; }
    }
    if (t === 'tansho') {
      p1.forEach(function (h) { addOdds(state.currentRace.entries[h - 1].odds); });
    } else if (t === 'fukusho') {
      p1.forEach(function (h) { addOdds(state.currentRace.entries[h - 1].fukushoOdds); });
    } else if (t === 'wide') {
      p1.forEach(function (a) {
        p2.forEach(function (b) {
          if (a !== b) addOdds(probToOdds(harvilleWideProb(P, a - 1, b - 1), TAKEOUT_RATES.wide));
        });
      });
    } else if (t === 'umaren') {
      p1.forEach(function (a) {
        p2.forEach(function (b) {
          if (a !== b) addOdds(probToOdds(harvilleUmaren(P, a - 1, b - 1), TAKEOUT_RATES.umaren));
        });
      });
    } else if (t === 'umatan') {
      p1.forEach(function (a) {
        p2.forEach(function (b) {
          if (a !== b) addOdds(probToOdds(harvilleUmatan(P, a - 1, b - 1), TAKEOUT_RATES.umatan));
        });
      });
    } else if (t === 'sanrenpuku') {
      p1.forEach(function (a) {
        p2.forEach(function (b) {
          p3.forEach(function (c) {
            if (a !== b && b !== c && a !== c) {
              var arr = [a - 1, b - 1, c - 1];
              addOdds(probToOdds(harvilleSanrenpuku(P, arr[0], arr[1], arr[2]), TAKEOUT_RATES.sanrenpuku));
            }
          });
        });
      });
    } else if (t === 'sanrentan') {
      p1.forEach(function (a) {
        p2.forEach(function (b) {
          p3.forEach(function (c) {
            if (a !== b && b !== c && a !== c)
              addOdds(probToOdds(harvilleSanrentan(P, a - 1, b - 1, c - 1), TAKEOUT_RATES.sanrentan));
          });
        });
      });
    }
    return { min: minO === 9999 ? 0 : minO, max: maxO };
  }

  function countTicketPoints() {
    var t = ticketSelection.betType;
    var p1 = ticketSelection.place1.slice();
    var p2 = ticketSelection.place2.slice();
    var p3 = ticketSelection.place3.slice();
    if (t === 'tansho' || t === 'fukusho') return p1.length;
    if (t === 'wide') {
      var wide = [];
      p1.forEach(function (a) {
        p2.forEach(function (b) {
          if (a !== b) {
            var key = a < b ? a + '-' + b : b + '-' + a;
            if (wide.indexOf(key) === -1) wide.push(key);
          }
        });
      });
      return wide.length;
    }
    if (t === 'umaren') {
      var ur = [];
      p1.forEach(function (a) {
        p2.forEach(function (b) {
          if (a !== b) {
            var key = a < b ? a + '-' + b : b + '-' + a;
            if (ur.indexOf(key) === -1) ur.push(key);
          }
        });
      });
      return ur.length;
    }
    if (t === 'umatan') {
      var count = 0;
      p1.forEach(function (a) {
        p2.forEach(function (b) { if (a !== b) count++; });
      });
      return count;
    }
    if (t === 'sanrenpuku') {
      var keys = [];
      p1.forEach(function (a) {
        p2.forEach(function (b) {
          p3.forEach(function (c) {
            if (a !== b && b !== c && a !== c) {
              var arr = [a, b, c].sort(function (x, y) { return x - y; });
              var key = arr.join('-');
              if (keys.indexOf(key) === -1) keys.push(key);
            }
          });
        });
      });
      return keys.length;
    }
    if (t === 'sanrentan') {
      var count = 0;
      p1.forEach(function (a) {
        p2.forEach(function (b) {
          p3.forEach(function (c) {
            if (a !== b && b !== c && a !== c) count++;
          });
        });
      });
      return count;
    }
    return 0;
  }

  function openTicketModal() {
    ticketSelection = { place1: [], place2: [], place3: [], betType: ticketSelection.betType };
    renderTicketModal();
    if (el.ticketModal) {
      el.ticketModal.classList.add('is-open');
      el.ticketModal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeTicketModal() {
    if (el.ticketModal) {
      el.ticketModal.classList.remove('is-open');
      el.ticketModal.setAttribute('aria-hidden', 'true');
    }
    renderPurchasedTickets();
  }

  function renderTicketModal() {
    if (!el.ticketTabs) return;
    el.ticketTabs.innerHTML = '';
    BET_TYPES.forEach(function (bt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ticket-tab' + (ticketSelection.betType === bt.id ? ' active' : '');
      btn.textContent = bt.name;
      btn.dataset.type = bt.id;
      btn.addEventListener('click', function () {
        ticketSelection.betType = bt.id;
        renderTicketModal();
      });
      el.ticketTabs.appendChild(btn);
    });
    if (el.ticketPlace1) {
      el.ticketPlace1.innerHTML = '';
      renderPlaceColumn(el.ticketPlace1, 1);
      el.ticketPlace1.style.opacity = (BET_TYPES.find(function (x) { return x.id === ticketSelection.betType; }).cols >= 1) ? '1' : '0.4';
      el.ticketPlace1.style.pointerEvents = (BET_TYPES.find(function (x) { return x.id === ticketSelection.betType; }).cols >= 1) ? 'auto' : 'none';
    }
    if (el.ticketPlace2) {
      el.ticketPlace2.innerHTML = '';
      renderPlaceColumn(el.ticketPlace2, 2);
      el.ticketPlace2.style.opacity = (BET_TYPES.find(function (x) { return x.id === ticketSelection.betType; }).cols >= 2) ? '1' : '0.4';
      el.ticketPlace2.style.pointerEvents = (BET_TYPES.find(function (x) { return x.id === ticketSelection.betType; }).cols >= 2) ? 'auto' : 'none';
    }
    if (el.ticketPlace3) {
      el.ticketPlace3.innerHTML = '';
      renderPlaceColumn(el.ticketPlace3, 3);
      el.ticketPlace3.style.opacity = (BET_TYPES.find(function (x) { return x.id === ticketSelection.betType; }).cols >= 3) ? '1' : '0.4';
      el.ticketPlace3.style.pointerEvents = (BET_TYPES.find(function (x) { return x.id === ticketSelection.betType; }).cols >= 3) ? 'auto' : 'none';
    }
    var yenPerPoint = 100;
    if (el.ticketYenInput) {
      var v = parseInt(el.ticketYenInput.value, 10);
      if (!isNaN(v) && v >= 100 && v <= 10000) yenPerPoint = v;
    }
    if (el.ticketYenPerPointDisplay) el.ticketYenPerPointDisplay.textContent = yenPerPoint;
    var pts = countTicketPoints();
    var yen = pts * yenPerPoint;
    if (el.ticketPoints) el.ticketPoints.textContent = pts + ' 点';
    if (el.ticketTotalYen) {
      var range = getTicketOddsRange();
      if (pts > 0 && range.min > 0) {
        var rangeStr = (range.min === range.max) ? range.min.toFixed(1) : range.min.toFixed(1) + ' - ' + range.max.toFixed(1);
        el.ticketTotalYen.textContent = '¥ ' + yen.toLocaleString() + ' （オッズ ' + rangeStr + '）';
      } else {
        el.ticketTotalYen.textContent = '¥ ' + yen.toLocaleString();
      }
    }
  }

  function renderPlaceColumn(container, placeNum) {
    var key = 'place' + placeNum;
    var arr = ticketSelection[key];
    var bt = BET_TYPES.find(function (x) { return x.id === ticketSelection.betType; });
    var label = (bt && bt.labels && bt.labels[placeNum - 1]) ? bt.labels[placeNum - 1] : (placeNum + '着');
    var title = document.createElement('div');
    title.className = 'place-col-title';
    title.textContent = label;
    container.appendChild(title);
    for (var n = 1; n <= 8; n++) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'place-num-btn' + (arr.indexOf(n) >= 0 ? ' selected' : '');
      btn.textContent = n;
      btn.dataset.place = String(placeNum);
      btn.dataset.num = String(n);
      btn.addEventListener('click', function () {
        var p = parseInt(this.dataset.place, 10);
        var num = parseInt(this.dataset.num, 10);
        var k = 'place' + p;
        var idx = ticketSelection[k].indexOf(num);
        if (idx >= 0) ticketSelection[k].splice(idx, 1);
        else ticketSelection[k].push(num);
        ticketSelection[k].sort(function (a, b) { return a - b; });
        renderTicketModal();
      });
      container.appendChild(btn);
    }
    var allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'place-all-btn';
    allBtn.textContent = '全';
    allBtn.dataset.place = String(placeNum);
    allBtn.addEventListener('click', function () {
      var p = parseInt(this.dataset.place, 10);
      var k = 'place' + p;
      if (ticketSelection[k].length === 8) ticketSelection[k] = [];
      else ticketSelection[k] = [1, 2, 3, 4, 5, 6, 7, 8];
      renderTicketModal();
    });
    container.appendChild(allBtn);
  }

  function confirmTickets() {
    var pts = countTicketPoints();
    if (pts <= 0) return;
    var yenPerPoint = 100;
    if (el.ticketYenInput) {
      var v = parseInt(el.ticketYenInput.value, 10);
      if (!isNaN(v) && v >= 100 && v <= 10000) yenPerPoint = v;
    }
    var yen = pts * yenPerPoint;
    if (state.money < yen) {
      setMessage('所持金が足りません');
      return;
    }
    state.raceTickets.push({
      type: ticketSelection.betType,
      place1: ticketSelection.place1.slice(),
      place2: ticketSelection.place2.slice(),
      place3: ticketSelection.place3.slice(),
      points: pts,
      yenPerPoint: yenPerPoint,
      totalYen: yen
    });
    state.money -= yen;
    updateUI();
    // モーダルを閉じずに選択をリセット → 続けて購入可能
    ticketSelection.place1 = [];
    ticketSelection.place2 = [];
    ticketSelection.place3 = [];
    renderTicketModal();
    renderPurchasedTickets();
    setMessage(getBetTypeName(ticketSelection.betType) + ' ' + pts + '点 (¥' + yen.toLocaleString() + ') を購入した');
  }

  // ---------- レースアニメーション ----------
  function playRaceAnimation(race, runResult, callback) {
    var entries = race.entries;
    var order = runResult.order;
    var scores = runResult.scores;
    var overlay = el.raceAnimOverlay;
    if (!overlay) { callback(); return; }

    // オーバーレイ表示
    overlay.setAttribute('aria-hidden', 'false');

    var viewport = document.getElementById('race-anim-viewport');
    var fenceInner = document.getElementById('race-anim-fence-inner');
    var sceneCut = document.getElementById('race-anim-scene-cut');
    var sceneText = document.getElementById('race-anim-scene-text');
    var boardEl = document.getElementById('race-anim-board');
    var goalEl = document.getElementById('race-anim-goal');
    var weatherEl = document.getElementById('race-anim-weather');
    var ticketsEl = document.getElementById('race-anim-tickets');
    var phaseEl = el.raceAnimPhase;

    if (!viewport) { overlay.setAttribute('aria-hidden', 'true'); callback(); return; }

    // --- コース種別をビューポートに反映 ---
    viewport.classList.remove('course-turf', 'course-dirt');
    var isDirt = race.course && race.course.indexOf('ダート') >= 0;
    viewport.classList.add(isDirt ? 'course-dirt' : 'course-turf');

    // --- 天候エフェクト ---
    if (weatherEl) {
      weatherEl.className = 'race-anim-weather';
      var w = race.weather || '';
      if (w.indexOf('雪') >= 0) weatherEl.classList.add('weather-snow');
      else if (w.indexOf('大雨') >= 0 || w.indexOf('豪雨') >= 0) weatherEl.classList.add('weather-heavy-rain');
      else if (w.indexOf('雨') >= 0) weatherEl.classList.add('weather-rain');
      else if (w.indexOf('曇') >= 0) weatherEl.classList.add('weather-cloudy');
    }

    // --- ヘッダー ---
    if (el.raceAnimHeader) {
      var weatherIcon = '';
      var wh = race.weather || '';
      if (wh.indexOf('雪') >= 0) weatherIcon = '🌨';
      else if (wh.indexOf('雨') >= 0) weatherIcon = '🌧';
      else if (wh.indexOf('曇') >= 0) weatherIcon = '☁';
      else weatherIcon = '☀';
      el.raceAnimHeader.textContent = race.venue + ' ' + race.course + ' ' + race.distance + 'm  ' + weatherIcon + race.weather;
    }
    if (phaseEl) phaseEl.textContent = '';
    if (boardEl) boardEl.innerHTML = '';

    // --- 購入馬券表示 ---
    if (ticketsEl) {
      ticketsEl.innerHTML = '';
      if (state.raceTickets && state.raceTickets.length > 0) {
        state.raceTickets.forEach(function (t) {
          var span = document.createElement('span');
          span.className = 'race-anim-ticket-item';
          span.innerHTML =
            '<span class="race-anim-ticket-type">' + getBetTypeName(t.type) + '</span>' +
            '<span>' + ticketSelectionsText(t) + '</span>' +
            '<span>¥' + t.totalYen.toLocaleString() + '</span>';
          ticketsEl.appendChild(span);
        });
      }
    }

    // --- 寸法 ---
    var trackW = viewport.clientWidth;
    var trackH = viewport.clientHeight;
    var fenceH = 32; // top:10px + fence:18px + border:2px + pad:2px
    var laneH = (trackH - fenceH - 12) / 8;

    // --- ゴール板（最初は非表示、最後の直線で流れてくる） ---
    var goalStopX = Math.round(trackW * 0.30);
    if (goalEl) {
      goalEl.style.left = '-60px';
      goalEl.style.display = 'none';
    }

    // 古い馬要素クリア
    viewport.querySelectorAll('.race-anim-horse').forEach(function (h) { h.remove(); });

    // スコア正規化
    var maxScore = -Infinity, minScore = Infinity;
    for (var i = 0; i < 8; i++) {
      if (scores[i] > maxScore) maxScore = scores[i];
      if (scores[i] < minScore) minScore = scores[i];
    }
    var scoreRange = maxScore - minScore || 1;

    // pos→画面X変換（左向き走行: pos大 = 画面左 = 先頭）
    var usableW = trackW - 80;
    function posToX(pos) {
      return (1 - pos) * usableW + 4;
    }

    // ゴール停止位置に対応するpos値
    var goalPos = 1 - (goalStopX - 4) / usableW;

    // 馬データ構築
    var horses = [];
    for (var i = 0; i < 8; i++) {
      var e = entries[i];
      var normalized = (scores[i] - minScore) / scoreRange;
      var strategy = e.horse.strategy;
      var rank = order.indexOf(i);

      var laneY = fenceH + 6 + i * laneH;
      var depthScale = 0.78 + (i / 7) * 0.44;

      var div = document.createElement('div');
      div.className = 'race-anim-horse';
      div.style.top = laneY + 'px';
      div.style.transform = 'scale(' + depthScale.toFixed(2) + ')';
      div.style.transformOrigin = 'center center';
      div.style.zIndex = String(i + 2);

      // 🏇はWindows上で左向き → 左向き走行に合致
      // アイコン(左=頭) → バッジ(右=ゼッケン)
      var fg = (e.frame === 2) ? '#fff' : '#333';
      div.innerHTML =
        '<span class="race-horse-icon">🏇</span>' +
        '<span class="race-horse-badge" style="background:' + FRAME_COLORS[e.frame - 1] + ';color:' + fg + '">' + e.frame + '</span>';
      viewport.appendChild(div);

      // 道中の位置（脚質ベース + 能力少々）
      var stratMid;
      if (strategy === 1) stratMid = 0.82 + Math.random() * 0.08;
      else if (strategy === 2) stratMid = 0.62 + Math.random() * 0.08;
      else if (strategy === 3) stratMid = 0.38 + Math.random() * 0.08;
      else stratMid = 0.16 + Math.random() * 0.08;
      var midPos = stratMid * 0.65 + normalized * 0.35;

      // ゴール到達時のpos（先頭がゴール位置に来るように）
      var endPos = goalPos - rank * 0.052;

      horses.push({
        idx: i, el: div, frame: e.frame, strategy: strategy,
        normalized: normalized, rank: rank,
        startPos: 0.46 + Math.random() * 0.04,
        midPos: midPos,
        endPos: endPos,
        pos: 0.46
      });
    }

    // --- シーン定義 ---
    var SCENES = [
      { name: 'スタート！', dur: 3000 },
      { name: '～ 道中 ～', dur: 3000 },
      { name: '最後の直線！', dur: 10000 }
    ];

    var sceneIdx = -1;
    var sceneTime = 0;
    var groundX = 0;
    var fenceX = 0;
    var inCut = false;
    var done = false;
    var lastTs = 0;
    var raf = null;
    var finishPhase = false;
    var finishTime = 0;
    var FINISH_DUR = 2200;

    // 馬の画面位置を更新
    function renderHorses() {
      horses.forEach(function (h) {
        h.el.style.left = posToX(h.pos) + 'px';
      });
    }

    // 順位ボード更新
    function renderBoard() {
      if (!boardEl) return;
      var sorted = horses.slice().sort(function (a, b) { return b.pos - a.pos; });
      boardEl.innerHTML = '';
      sorted.forEach(function (h, r) {
        var e = entries[h.idx];
        var fg = (e.frame === 2) ? '#fff' : '#333';
        var s = document.createElement('span');
        s.className = 'race-board-item';
        s.innerHTML =
          '<span class="race-board-rank">' + (r + 1) + '</span>' +
          '<span class="race-board-badge" style="background:' + FRAME_COLORS[e.frame - 1] + ';color:' + fg + '">' + e.frame + '</span>';
        boardEl.appendChild(s);
        if (r === 2) {
          var sep = document.createElement('span');
          sep.className = 'race-board-sep';
          boardEl.appendChild(sep);
        }
      });
    }

    // 地面・柵スクロール（左向き走行 → 地面は右にスクロール）
    function scrollGround(px) {
      groundX += px;
      fenceX += px;
      viewport.style.backgroundPosition = groundX + 'px 0, 0 0';
      if (fenceInner) fenceInner.style.backgroundPositionX = fenceX + 'px';
    }

    // 場面転換カット演出
    function doSceneCut(name, cb) {
      inCut = true;
      if (sceneCut && sceneText) {
        sceneText.textContent = name;
        sceneCut.classList.add('active');
      }
      setTimeout(function () {
        if (sceneCut) sceneCut.classList.remove('active');
        setTimeout(function () {
          inCut = false;
          cb();
        }, 220);
      }, 780);
    }

    function beginScene(idx) {
      sceneIdx = idx;
      sceneTime = 0;
    }

    // 直線用イージング
    function stretchEase(t) {
      if (t < 0.35) return t * 0.15 / 0.35;
      if (t < 0.75) return 0.15 + (t - 0.35) * 0.65 / 0.40;
      return 0.80 + (t - 0.75) * 0.20 / 0.25;
    }

    // --- メインアニメーションループ ---
    function loop(ts) {
      if (done) return;
      raf = requestAnimationFrame(loop);

      if (!lastTs) { lastTs = ts; return; }
      var dt = Math.min(ts - lastTs, 80);
      lastTs = ts;

      // === ゴール通過フェーズ ===
      if (finishPhase) {
        finishTime += dt;
        var fp = Math.min(finishTime / FINISH_DUR, 1);
        var fpEased = fp * fp * (3 - 2 * fp); // smoothstep
        // カメラ停止（地面スクロールなし）、馬だけゴール板を通過して左へ
        horses.forEach(function (h) {
          h.pos = h.endPos + fpEased * 0.45;
        });
        renderHorses();

        if (fp >= 1) {
          done = true;
          cancelAnimationFrame(raf);
          setTimeout(function () {
            overlay.setAttribute('aria-hidden', 'true');
            callback();
          }, 1200);
        }
        return;
      }

      // === 地面スクロール ===
      var gSpeed;
      if (inCut) {
        gSpeed = dt * 0.06;
      } else if (sceneIdx === 0) {
        var sp = Math.min(sceneTime / SCENES[0].dur, 1);
        gSpeed = dt * (0.06 + sp * 0.22);
      } else if (sceneIdx === 1) {
        gSpeed = dt * 0.30;
      } else {
        var sp = Math.min(sceneTime / SCENES[2].dur, 1);
        gSpeed = dt * (0.34 + Math.sin(sp * Math.PI) * 0.18);
      }
      scrollGround(gSpeed);

      if (inCut) return;

      sceneTime += dt;
      var scene = SCENES[sceneIdx];
      if (!scene) return;
      var progress = Math.min(sceneTime / scene.dur, 1);

      if (phaseEl) phaseEl.textContent = scene.name;

      // --- 各シーンの馬位置計算 ---
      if (sceneIdx === 0) {
        var e2 = progress * progress;
        horses.forEach(function (h) {
          var target = h.startPos + (h.midPos - h.startPos) * e2 * 0.35;
          h.pos = target + Math.sin(ts * 0.003 + h.idx * 1.7) * 0.007;
        });
      } else if (sceneIdx === 1) {
        horses.forEach(function (h) {
          var prev = h.startPos + (h.midPos - h.startPos) * 0.35;
          h.pos = prev + (h.midPos - prev) * progress;
          h.pos += Math.sin(ts * 0.004 + h.idx * 2.1) * 0.005;
        });
      } else if (sceneIdx === 2) {
        var eased = stretchEase(progress);
        horses.forEach(function (h) {
          h.pos = h.midPos + (h.endPos - h.midPos) * eased;
          h.pos += Math.sin(ts * 0.005 + h.idx * 2.5) * 0.004 * (1 - progress * 0.85);
        });
      }

      renderHorses();
      renderBoard();

      // --- ゴール板のスクロール表示（最後の直線の終盤に流れてくる） ---
      if (sceneIdx === 2 && goalEl) {
        // 最後の直線の残り20%（≒2秒）でゴール板が左から流れてくる
        if (progress > 0.80) {
          var gp = (progress - 0.80) / 0.20;
          goalEl.style.display = '';
          goalEl.style.left = (-40 + (goalStopX + 40) * gp) + 'px';
        } else {
          goalEl.style.display = 'none';
        }
      }

      // シーン終了チェック
      if (progress >= 1) {
        if (sceneIdx < SCENES.length - 1) {
          var next = sceneIdx + 1;
          doSceneCut(SCENES[next].name, function () { beginScene(next); });
        } else {
          // レース終了 → ゴール板を確定位置に固定 → 通過フェーズへ
          if (goalEl) {
            goalEl.style.display = '';
            goalEl.style.left = goalStopX + 'px';
          }
          horses.forEach(function (h) { h.pos = h.endPos; });
          renderHorses();
          renderBoard();

          var top3 = order.slice(0, 3).map(function (idx) { return entries[idx].frame; });
          if (phaseEl) phaseEl.textContent = '確定！  ' + top3[0] + ' → ' + top3[1] + ' → ' + top3[2];

          finishPhase = true;
          finishTime = 0;
        }
      }
    }

    // 最初のシーンカットから開始
    doSceneCut(SCENES[0].name, function () {
      beginScene(0);
      raf = requestAnimationFrame(loop);
    });
  }

  var raceAnimRunning = false;
  function executeRaceAndResult() {
    if (!state.currentRace || raceAnimRunning) return;
    raceAnimRunning = true;
    var race = state.currentRace;
    var entries = race.entries;
    var P = race.P;
    var runResult = runRace(entries);
    // アニメーションを再生してから結果表示
    playRaceAnimation(race, runResult, function () {
      raceAnimRunning = false;
      showRaceResult(race, runResult);
    });
  }

  function showRaceResult(race, runResult) {
    var entries = race.entries;
    var P = race.P;
    var order = runResult.order;
    var a0 = order[0];
    var a1 = order[1];
    var a2 = order[2];
    var first = a0 + 1;
    var second = a1 + 1;
    var third = a2 + 1;
    var resultRows = buildRaceResultTable(race, runResult);
    var sortedByOdds = entries.map(function (e, i) { return { i: i, o: e.odds }; }).sort(function (a, b) { return a.o - b.o; });
    var ninki = [];
    sortedByOdds.forEach(function (x, r) { ninki[x.i] = r + 1; });
    // --- 各券種のオッズ・人気一覧（券種別控除率を適用） ---
    var umarenList = [];
    for (var a = 0; a < 8; a++) {
      for (var b = a + 1; b < 8; b++) {
        umarenList.push({ key: (a + 1) + '-' + (b + 1), odds: probToOdds(harvilleUmaren(P, a, b), TAKEOUT_RATES.umaren) });
      }
    }
    umarenList.sort(function (x, y) { return x.odds - y.odds; });
    var umarenNinki = {};
    umarenList.forEach(function (x, r) { umarenNinki[x.key] = r + 1; });

    var umatanList = [];
    for (var a = 0; a < 8; a++) {
      for (var b = 0; b < 8; b++) {
        if (a === b) continue;
        umatanList.push({ key: (a + 1) + '>' + (b + 1), odds: probToOdds(harvilleUmatan(P, a, b), TAKEOUT_RATES.umatan) });
      }
    }
    umatanList.sort(function (x, y) { return x.odds - y.odds; });
    var umatanNinki = {};
    umatanList.forEach(function (x, r) { umatanNinki[x.key] = r + 1; });

    var wideList = [];
    var w1 = first < second ? first + '-' + second : second + '-' + first;
    var w2 = first < third ? first + '-' + third : third + '-' + first;
    var w3 = second < third ? second + '-' + third : third + '-' + second;
    var wkeys = [w1, w2, w3];
    for (var wa = 0; wa < 8; wa++) {
      for (var wb = wa + 1; wb < 8; wb++) {
        wideList.push({ key: (wa+1)+'-'+(wb+1), odds: probToOdds(harvilleWideProb(P, wa, wb), TAKEOUT_RATES.wide) });
      }
    }
    wideList.sort(function (x, y) { return x.odds - y.odds; });
    var wideNinki = {};
    wideList.forEach(function (x, r) { wideNinki[x.key] = r + 1; });

    var sanrenpukuKey = [first, second, third].sort(function (x,y){return x-y;}).join('-');
    var sanrenpukuList = [];
    for (var sa = 0; sa < 8; sa++) {
      for (var sb = sa + 1; sb < 8; sb++) {
        for (var sc = sb + 1; sc < 8; sc++) {
          sanrenpukuList.push({ key: (sa+1)+'-'+(sb+1)+'-'+(sc+1), odds: probToOdds(harvilleSanrenpuku(P, sa, sb, sc), TAKEOUT_RATES.sanrenpuku) });
        }
      }
    }
    sanrenpukuList.sort(function (x, y) { return x.odds - y.odds; });
    var sanrenpukuNinki = {};
    sanrenpukuList.forEach(function (x, r) { sanrenpukuNinki[x.key] = r + 1; });

    var sanrentanList = [];
    for (var ta = 0; ta < 8; ta++) {
      for (var tb = 0; tb < 8; tb++) {
        for (var tc = 0; tc < 8; tc++) {
          if (ta === tb || tb === tc || ta === tc) continue;
          sanrentanList.push({ key: (ta+1)+'>'+(tb+1)+'>'+(tc+1), odds: probToOdds(harvilleSanrentan(P, ta, tb, tc), TAKEOUT_RATES.sanrentan) });
        }
      }
    }
    sanrentanList.sort(function (x, y) { return x.odds - y.odds; });
    var sanrentanNinki = {};
    sanrentanList.forEach(function (x, r) { sanrentanNinki[x.key] = r + 1; });

    // --- 結果画面用のオッズ値（100円あたり払戻）---
    var tanshoYen = Math.round(entries[a0].odds * 100);
    var fukushoYens = [
      Math.round(entries[a0].fukushoOdds * 100),
      Math.round(entries[a1].fukushoOdds * 100),
      Math.round(entries[a2].fukushoOdds * 100)
    ];
    var umarenKey = first < second ? first + '-' + second : second + '-' + first;
    var umarenOdds = probToOdds(harvilleUmaren(P, a0, a1), TAKEOUT_RATES.umaren);
    var wideOdds = [
      probToOdds(harvilleWideProb(P, a0, a1), TAKEOUT_RATES.wide),
      probToOdds(harvilleWideProb(P, a0, a2), TAKEOUT_RATES.wide),
      probToOdds(harvilleWideProb(P, a1, a2), TAKEOUT_RATES.wide)
    ];
    var umatanOdds = probToOdds(harvilleUmatan(P, a0, a1), TAKEOUT_RATES.umatan);
    var sanrenpukuOdds = probToOdds(harvilleSanrenpuku(P, a0, a1, a2), TAKEOUT_RATES.sanrenpuku);
    var sanrentanOdds = probToOdds(harvilleSanrentan(P, a0, a1, a2), TAKEOUT_RATES.sanrentan);

    // --- ユーザーの馬券に対する払戻計算（当選1点ずつ） ---
    var top3 = [first, second, third];
    var payout = 0;
    var yenPerPointDefault = 100;
    var ticketResults = []; // { ticket, hit: bool, payoutYen: number }
    state.raceTickets.forEach(function (t) {
      var ypp = (t.yenPerPoint != null) ? t.yenPerPoint : yenPerPointDefault;
      var ticketPayout = 0;

      if (t.type === 'tansho') {
        if (t.place1.indexOf(first) >= 0) {
          ticketPayout += entries[a0].odds * ypp;
        }
      } else if (t.type === 'fukusho') {
        if (t.place1.indexOf(first) >= 0) ticketPayout += entries[a0].fukushoOdds * ypp;
        if (t.place1.indexOf(second) >= 0) ticketPayout += entries[a1].fukushoOdds * ypp;
        if (t.place1.indexOf(third) >= 0) ticketPayout += entries[a2].fukushoOdds * ypp;
      } else if (t.type === 'wide') {
        var checkedWide = [];
        t.place1.forEach(function (pa) {
          t.place2.forEach(function (pb) {
            if (pa === pb) return;
            var wkey = pa < pb ? pa + '-' + pb : pb + '-' + pa;
            if (checkedWide.indexOf(wkey) >= 0) return;
            checkedWide.push(wkey);
            if (top3.indexOf(pa) >= 0 && top3.indexOf(pb) >= 0) {
              ticketPayout += probToOdds(harvilleWideProb(P, pa - 1, pb - 1), TAKEOUT_RATES.wide) * ypp;
            }
          });
        });
      } else if (t.type === 'umaren') {
        var uKey = first < second ? first + '-' + second : second + '-' + first;
        var checked = [];
        t.place1.forEach(function (pa) {
          t.place2.forEach(function (pb) {
            if (pa === pb) return;
            var k = pa < pb ? pa + '-' + pb : pb + '-' + pa;
            if (checked.indexOf(k) >= 0) return;
            checked.push(k);
            if (k === uKey) {
              ticketPayout += umarenOdds * ypp;
            }
          });
        });
      } else if (t.type === 'umatan') {
        if (t.place1.indexOf(first) >= 0 && t.place2.indexOf(second) >= 0) {
          ticketPayout += umatanOdds * ypp;
        }
      } else if (t.type === 'sanrenpuku') {
        var setKey = [first, second, third].sort(function (x, y) { return x - y; }).join('-');
        var found = false;
        for (var si = 0; si < t.place1.length && !found; si++) {
          for (var sj = 0; sj < t.place2.length && !found; sj++) {
            for (var sk = 0; sk < t.place3.length && !found; sk++) {
              var arr = [t.place1[si], t.place2[sj], t.place3[sk]];
              if (arr[0] === arr[1] || arr[1] === arr[2] || arr[0] === arr[2]) continue;
              var k = arr.sort(function (x, y) { return x - y; }).join('-');
              if (k === setKey) {
                ticketPayout += sanrenpukuOdds * ypp;
                found = true;
              }
            }
          }
        }
      } else if (t.type === 'sanrentan') {
        if (t.place1.indexOf(first) >= 0 && t.place2.indexOf(second) >= 0 && t.place3.indexOf(third) >= 0) {
          ticketPayout += sanrentanOdds * ypp;
        }
      }
      payout += ticketPayout;
      ticketResults.push({ ticket: t, hit: ticketPayout > 0, payoutYen: Math.floor(ticketPayout) });
    });
    state.money += Math.floor(payout);
    updateUI();

    // --- 着順表描画 ---
    if (el.raceResultTbody) {
      el.raceResultTbody.innerHTML = '';
      resultRows.forEach(function (r) {
        var tr = document.createElement('tr');
        var fg = (r.frame === 2) ? '#fff' : '#333';
        tr.innerHTML =
          '<td class="result-chakujun">' + r.pos + '<span class="chakujun-suffix">着</span></td>' +
          '<td class="result-frame" style="background:' + FRAME_COLORS[r.frame - 1] + ';color:' + fg + '">' + r.frame + '</td>' +
          '<td class="result-baban" style="background:' + FRAME_COLORS[r.frame - 1] + ';color:' + fg + '">' + r.horseNum + '</td>' +
          '<td class="result-name"><span class="horse-name">' + r.name + '</span><span class="jockey-name">' + r.jockey + '</span></td>' +
          '<td class="result-time"><span class="time-main">' + r.timeStr + '</span><span class="time-margin">' + r.margin + '</span><span class="time-agari">(' + r.agari + ')</span></td>' +
          '<td class="result-odds"><span class="odds-val" style="color:' + (r.odds < 10 ? '#c0392b' : 'inherit') + '">' + r.odds.toFixed(1) + '倍</span><span class="odds-ninki">' + r.ninki + '人気</span></td>';
        el.raceResultTbody.appendChild(tr);
      });
    }

    // --- 払戻金表描画 ---
    var payoutRows = [
      { type: '単勝', typeClass: 'payout-tansho', combi: String(first), yen: tanshoYen, ninki: ninki[a0] },
      { type: '複勝', typeClass: 'payout-fukusho', combi: String(first), yen: fukushoYens[0], ninki: ninki[a0] },
      { type: '複勝', typeClass: 'payout-fukusho', combi: String(second), yen: fukushoYens[1], ninki: ninki[a1] },
      { type: '複勝', typeClass: 'payout-fukusho', combi: String(third), yen: fukushoYens[2], ninki: ninki[a2] },
      { type: '馬連', typeClass: 'payout-umaren', combi: umarenKey, yen: Math.round(umarenOdds * 100), ninki: umarenNinki[umarenKey] },
      { type: 'ワイド', typeClass: 'payout-wide', combi: wkeys[0], yen: Math.round(wideOdds[0] * 100), ninki: wideNinki[wkeys[0]] },
      { type: 'ワイド', typeClass: 'payout-wide', combi: wkeys[1], yen: Math.round(wideOdds[1] * 100), ninki: wideNinki[wkeys[1]] },
      { type: 'ワイド', typeClass: 'payout-wide', combi: wkeys[2], yen: Math.round(wideOdds[2] * 100), ninki: wideNinki[wkeys[2]] },
      { type: '馬単', typeClass: 'payout-umatan', combi: first + '>' + second, yen: Math.round(umatanOdds * 100), ninki: umatanNinki[first + '>' + second] },
      { type: '3連複', typeClass: 'payout-sanrenpuku', combi: sanrenpukuKey, yen: Math.round(sanrenpukuOdds * 100), ninki: sanrenpukuNinki[sanrenpukuKey] },
      { type: '3連単', typeClass: 'payout-sanrentan', combi: first + '>' + second + '>' + third, yen: Math.round(sanrentanOdds * 100), ninki: sanrentanNinki[first + '>' + second + '>' + third] }
    ];
    if (el.payoutTbody) {
      el.payoutTbody.innerHTML = '';
      payoutRows.forEach(function (pr) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td class="payout-type ' + pr.typeClass + '">' + pr.type + '</td><td class="payout-combi">' + pr.combi + '</td><td class="payout-yen">' + pr.yen.toLocaleString() + '円</td><td class="payout-ninki">' + pr.ninki + '人気</td>';
        el.payoutTbody.appendChild(tr);
      });
    }
    // --- ユーザー馬券の的中/ハズレ内訳を描画 ---
    if (el.userTicketsList) {
      el.userTicketsList.innerHTML = '';
      if (ticketResults.length === 0) {
        el.userTicketsList.innerHTML = '<p class="user-ticket-empty">馬券の購入なし</p>';
      } else {
        var totalInvest = 0;
        ticketResults.forEach(function (tr) {
          totalInvest += tr.ticket.totalYen;
          var row = document.createElement('div');
          row.className = 'user-ticket-row' + (tr.hit ? ' user-ticket-hit' : ' user-ticket-miss');
          row.innerHTML =
            '<span class="ut-result">' + (tr.hit ? '的中' : 'ハズレ') + '</span>' +
            '<span class="ut-type">' + getBetTypeName(tr.ticket.type) + '</span>' +
            '<span class="ut-sel">' + ticketSelectionsText(tr.ticket) + '</span>' +
            '<span class="ut-cost">投資¥' + tr.ticket.totalYen.toLocaleString() + '</span>' +
            '<span class="ut-payout">' + (tr.hit ? '払戻¥' + tr.payoutYen.toLocaleString() : '-') + '</span>';
          el.userTicketsList.appendChild(row);
        });
        // 収支サマリー
        var profit = Math.floor(payout) - totalInvest;
        var profitClass = profit >= 0 ? 'profit-plus' : 'profit-minus';
        var summaryDiv = document.createElement('div');
        summaryDiv.className = 'user-ticket-summary';
        summaryDiv.innerHTML =
          '<span>投資合計: ¥' + totalInvest.toLocaleString() + '</span>' +
          '<span>払戻合計: ¥' + Math.floor(payout).toLocaleString() + '</span>' +
          '<span class="' + profitClass + '">収支: ' + (profit >= 0 ? '+' : '') + '¥' + profit.toLocaleString() + '</span>';
        el.userTicketsList.appendChild(summaryDiv);
      }
    }
    // レース清算完了。馬券を消化済みにする（次のgenerateCurrentRaceで返金されないように）
    state.raceTickets = [];
    if (el.raceResultTotalPayout) el.raceResultTotalPayout.textContent = '';
    if (el.raceResultModal) {
      el.raceResultModal.classList.add('is-open');
      el.raceResultModal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeRaceResultAndBack() {
    if (el.raceResultModal) {
      el.raceResultModal.classList.remove('is-open');
      el.raceResultModal.setAttribute('aria-hidden', 'true');
    }
    advanceWeek(); // advanceWeek内でgenerateCurrentRaceも呼ばれる
    updateUI();
    showMainScreen();
    setMessage('1週間が過ぎた');
  }

  function formatDate() {
    return state.year + '年目 ' + state.month + '月 ' + state.week + '週';
  }

  // 運気の数値 → 表示用ランク名（アイテムは連動しない）
  function getLuckRank(luck) {
    var rank = LUCK_RANKS[0];
    for (var i = LUCK_RANKS.length - 1; i >= 0; i--) {
      if (luck >= LUCK_RANKS[i].minLuck) {
        rank = LUCK_RANKS[i];
        break;
      }
    }
    return rank;
  }

  // 抽選用の実効倍率（ランク倍率 + アイテム合計）。運気表示とは別。
  function getEffectiveMultiplier() {
    var rank = getLuckRank(state.luck);
    var itemTotal = state.inventory.reduce(function (sum, it) { return sum + it.bonus; }, 0);
    return rank.multiplier + itemTotal;
  }

  // ---------- 表示更新 ----------
  function updateUI() {
    el.dateDisplay.textContent = formatDate();
    el.moneyDisplay.textContent = '¥ ' + state.money.toLocaleString();
    el.luckDisplay.textContent = '運気 ' + getLuckRank(state.luck).name;
  }

  function setMessage(text) {
    el.situationMessage.textContent = text;
  }

  // ---------- 運気トレーニング ----------
  function doTraining() {
    const delta = (Math.random() * 3 - 1); // -1.0 〜 +2.0
    state.luck = Math.max(0.2, state.luck + delta); // 下限のみ（上限はアイテム等で考慮しない）
    advanceWeek();
    updateUI();
    if (delta >= 0) {
      setMessage(messages.trainingUp);
    } else {
      setMessage(messages.trainingDown);
    }
  }

  // ---------- 宝くじ：実効倍率（ランク+アイテム）で確率補正、1枚ごとに1回くじ ----------
  function drawOneTicket() {
    const mult = getEffectiveMultiplier();
    const rate = Math.max(0, 1 + mult); // -3のとき0倍、5のとき6倍
    const effectiveProbs = LOTTERY_PRICES.map(function (p) {
      return Math.min(1, p.baseProb * rate);
    });
    const totalWin = effectiveProbs.reduce(function (a, b) { return a + b; }, 0);
    const noWin = Math.max(0, 1 - totalWin);
    const u = Math.random();
    if (u < noWin) return 0;
    if (totalWin <= 0) return 0;
    const v = (u - noWin) / totalWin;
    let cum = 0;
    for (let i = 0; i < effectiveProbs.length; i++) {
      cum += effectiveProbs[i] / totalWin;
      if (v < cum) return i + 1;
    }
    return 0;
  }

  function runLottery(count) {
    const results = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < count; i++) {
      const grade = drawOneTicket();
      results[grade] = (results[grade] || 0) + 1;
    }
    return results;
  }

  function calcTotalWin(results) {
    let total = 0;
    for (let i = 1; i <= 8; i++) {
      const n = results[i] || 0;
      total += LOTTERY_PRICES[i - 1].amount * n;
    }
    return total;
  }

  function showResult(count, results, totalWin) {
    const rows = [];
    for (let i = 1; i <= 8; i++) {
      const n = results[i] || 0;
      if (n === 0) continue;
      const info = LOTTERY_PRICES[i - 1];
      rows.push({ name: info.name, count: n, amount: info.amount });
    }
    el.resultTitle.textContent = '抽選結果';
    el.resultSummary.textContent = totalWin > 0
      ? `合計当選金額: ¥ ${totalWin.toLocaleString()}`
      : `今回の${count}枚はすべてハズレでした…`;
    el.resultDetails.innerHTML = '';
    rows.forEach(function (r) {
      const row = document.createElement('div');
      row.className = 'grade-row';
      row.textContent = r.name + ': ' + String(r.count) + '枚 × ¥' + r.amount.toLocaleString();
      el.resultDetails.appendChild(row);
    });
    el.resultModal.classList.add('is-open');
    el.resultModal.setAttribute('aria-hidden', 'false');
  }

  function showDrawingAnimation(count, price, onDone) {
    if (el.drawingOverlay) {
      el.drawingOverlay.classList.add('is-open');
      el.drawingOverlay.setAttribute('aria-hidden', 'false');
      if (el.drawingText) el.drawingText.textContent = count + '枚 抽選中…';
    }
    const duration = count <= 10 ? 1200 : count <= 100 ? 1800 : 2200;
    setTimeout(function () {
      if (el.drawingOverlay) {
        el.drawingOverlay.classList.remove('is-open');
        el.drawingOverlay.setAttribute('aria-hidden', 'true');
      }
      onDone();
    }, duration);
  }

  function purchaseLottery(count, price) {
    if (state.money < price) {
      setMessage('所持金が足りないよ…');
      return;
    }
    state.money -= price;
    advanceWeek();
    updateUI();
    setMessage(messages.buyLottery);
    closeLotteryModal();

    showDrawingAnimation(count, price, function () {
      const results = runLottery(count);
      const totalWin = calcTotalWin(results);
      state.money += totalWin;
      updateUI();
      showResult(count, results, totalWin);
    });
  }

  // ---------- モーダル ----------
  function openLotteryModal() {
    el.lotteryModal.classList.add('is-open');
    el.lotteryModal.setAttribute('aria-hidden', 'false');
    el.ticketOptions.forEach(function (btn) {
      var price = parseInt(btn.dataset.price, 10);
      btn.disabled = state.money < price;
    });
  }

  function closeLotteryModal() {
    el.lotteryModal.classList.remove('is-open');
    el.lotteryModal.setAttribute('aria-hidden', 'true');
  }

  function closeResultModal() {
    el.resultModal.classList.remove('is-open');
    el.resultModal.setAttribute('aria-hidden', 'true');
  }

  function openShopModal() {
    renderShop();
    if (el.shopModal) {
      el.shopModal.classList.add('is-open');
      el.shopModal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeShopModal() {
    if (el.shopModal) {
      el.shopModal.classList.remove('is-open');
      el.shopModal.setAttribute('aria-hidden', 'true');
    }
  }

  function openInventoryModal() {
    renderInventory();
    if (el.inventoryModal) {
      el.inventoryModal.classList.add('is-open');
      el.inventoryModal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeInventoryModal() {
    if (el.inventoryModal) {
      el.inventoryModal.classList.remove('is-open');
      el.inventoryModal.setAttribute('aria-hidden', 'true');
    }
  }

  function hasItem(id) {
    return state.inventory.some(function (it) { return it.id === id; });
  }

  function getPlacedSlotForItem(itemId) {
    for (var s = 0; s < 6; s++) {
      if (state.placedFurniture[s] === itemId) return s;
    }
    return -1;
  }

  function createFurnitureSpriteEl(itemId, cellPx) {
    var data = FURNITURE_SPRITES[itemId];
    if (!data) return document.createElement('div');
    var wrap = document.createElement('div');
    wrap.className = 'furniture-sprite-wrap';
    var grid = document.createElement('div');
    grid.className = 'furniture-grid';
    grid.style.gridTemplateColumns = 'repeat(12, ' + cellPx + 'px)';
    grid.style.gridTemplateRows = 'repeat(12, ' + cellPx + 'px)';
    grid.style.width = (12 * cellPx) + 'px';
    grid.style.height = (12 * cellPx) + 'px';
    data.rows.forEach(function (row) {
      for (var i = 0; i < 12; i++) {
        var c = document.createElement('span');
        c.className = 'fp';
        var ch = row[i] || '0';
        if (ch === '1') c.style.background = data.colors[0];
        else if (ch === '2') c.style.background = data.colors[1];
        else c.style.background = 'transparent';
        grid.appendChild(c);
      }
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function renderRoomSlots() {
    if (!el.roomSlotsContainer) return;
    el.roomSlotsContainer.innerHTML = '';
    for (var slot = 0; slot < 6; slot++) {
      var slotEl = document.createElement('div');
      slotEl.className = 'room-slot' + (state.placedFurniture[slot] ? ' has-furniture' : '');
      slotEl.dataset.slot = String(slot);
      var placeholder = document.createElement('div');
      placeholder.className = 'room-slot-placeholder';
      if (state.placedFurniture[slot]) {
        var wrap = createFurnitureSpriteEl(state.placedFurniture[slot], 2);
        placeholder.appendChild(wrap);
      }
      slotEl.appendChild(placeholder);
      el.roomSlotsContainer.appendChild(slotEl);
    }
  }

  function renderShop() {
    if (!el.shopList) return;
    el.shopList.innerHTML = '';
    FURNITURE_ITEMS.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'shop-row';
      var owned = hasItem(item.id);
      var preview = createFurnitureSpriteEl(item.id, 2);
      preview.classList.add('shop-item-preview');
      row.appendChild(preview);
      var nameSpan = document.createElement('span');
      nameSpan.className = 'shop-item-name';
      nameSpan.textContent = item.name;
      row.appendChild(nameSpan);
      var priceSpan = document.createElement('span');
      priceSpan.className = 'shop-item-price';
      priceSpan.textContent = '¥' + item.price.toLocaleString();
      row.appendChild(priceSpan);
      var bonusSpan = document.createElement('span');
      bonusSpan.className = 'shop-item-bonus';
      bonusSpan.textContent = '+' + item.bonus + '倍';
      row.appendChild(bonusSpan);
      if (owned) {
        var ownedSpan = document.createElement('span');
        ownedSpan.className = 'shop-owned';
        ownedSpan.textContent = '所持済';
        row.appendChild(ownedSpan);
      } else {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-buy';
        btn.dataset.id = item.id;
        btn.dataset.price = String(item.price);
        if (state.money < item.price) btn.disabled = true;
        btn.textContent = '買う';
        btn.addEventListener('click', function () {
          buyItem(item.id, item.price);
        });
        row.appendChild(btn);
      }
      el.shopList.appendChild(row);
    });
  }

  function buyItem(id, price) {
    if (state.money < price || hasItem(id)) return;
    var item = FURNITURE_ITEMS.find(function (i) { return i.id === id; });
    if (!item) return;
    state.money -= price;
    state.inventory.push({ id: item.id, name: item.name, bonus: item.bonus });
    updateUI();
    setMessage(item.name + 'を買った！');
    renderShop();
    renderInventory();
  }

  function openPlaceModal(itemId) {
    var item = FURNITURE_ITEMS.find(function (i) { return i.id === itemId; });
    if (!item || !el.placeModal) return;
    el.placeModal.dataset.placingItemId = itemId;
    if (el.placeModalTitle) el.placeModalTitle.textContent = item.name + ' をどこに置く？';
    renderPlaceSlots();
    el.placeModal.classList.add('is-open');
    el.placeModal.setAttribute('aria-hidden', 'false');
  }

  function closePlaceModal() {
    if (el.placeModal) {
      el.placeModal.classList.remove('is-open');
      el.placeModal.setAttribute('aria-hidden', 'true');
      delete el.placeModal.dataset.placingItemId;
    }
  }

  function renderPlaceSlots() {
    if (!el.placeSlotsContainer) return;
    el.placeSlotsContainer.innerHTML = '';
    for (var slot = 0; slot < 6; slot++) {
      var slotEl = document.createElement('div');
      slotEl.className = 'room-slot' + (state.placedFurniture[slot] ? ' occupied' : '');
      slotEl.dataset.slot = String(slot);
      var placeholder = document.createElement('div');
      placeholder.className = 'room-slot-placeholder';
      if (state.placedFurniture[slot]) {
        var wrap = createFurnitureSpriteEl(state.placedFurniture[slot], 2);
        placeholder.appendChild(wrap);
      } else {
        placeholder.textContent = 'ここ';
      }
      slotEl.appendChild(placeholder);
      slotEl.addEventListener('click', function () {
        var s = parseInt(this.dataset.slot, 10);
        var placingId = el.placeModal.dataset.placingItemId;
        if (!placingId) return;
        state.placedFurniture[s] = placingId;
        renderRoomSlots();
        renderInventory();
        closePlaceModal();
        setMessage(placingId ? '部屋に置いた！' : '');
      });
      el.placeSlotsContainer.appendChild(slotEl);
    }
  }

  function storeItemFromSlot(slotIndex) {
    delete state.placedFurniture[slotIndex];
    renderRoomSlots();
    renderInventory();
    setMessage('家具をしまった');
  }

  function getTotalItemBonus() {
    return state.inventory.reduce(function (sum, it) { return sum + it.bonus; }, 0);
  }

  function renderInventory() {
    if (!el.inventoryList) return;
    el.inventoryList.innerHTML = '';
    if (state.inventory.length === 0) {
      el.inventoryList.innerHTML = '<p class="inventory-empty">持っているアイテムはありません</p>';
    } else {
      state.inventory.forEach(function (it) {
        var row = document.createElement('div');
        row.className = 'inventory-row';
        var preview = document.createElement('div');
        preview.className = 'inv-preview';
        preview.appendChild(createFurnitureSpriteEl(it.id, 2));
        row.appendChild(preview);
        var info = document.createElement('div');
        info.className = 'inv-info';
        info.textContent = it.name + ' … +' + it.bonus + '倍';
        row.appendChild(info);
        var actions = document.createElement('div');
        actions.className = 'inv-actions';
        var placedSlot = getPlacedSlotForItem(it.id);
        if (placedSlot >= 0) {
          var storeBtn = document.createElement('button');
          storeBtn.type = 'button';
          storeBtn.className = 'btn btn-store';
          storeBtn.textContent = 'しまう';
          storeBtn.addEventListener('click', function () {
            storeItemFromSlot(placedSlot);
          });
          actions.appendChild(storeBtn);
        } else {
          var placeBtn = document.createElement('button');
          placeBtn.type = 'button';
          placeBtn.className = 'btn btn-place';
          placeBtn.textContent = '部屋に置く';
          placeBtn.addEventListener('click', function () {
            closeInventoryModal();
            openPlaceModal(it.id);
          });
          actions.appendChild(placeBtn);
        }
        row.appendChild(actions);
        el.inventoryList.appendChild(row);
      });
    }
    var total = getTotalItemBonus();
    if (el.inventoryTotal) {
      el.inventoryTotal.textContent = '合計上昇倍率: +' + total + '倍';
    }
  }

  // ---------- イベント ----------
  el.btnTraining.addEventListener('click', function () {
    doTraining();
  });

  el.btnLottery.addEventListener('click', function () {
    openLotteryModal();
  });

  if (el.btnShop) el.btnShop.addEventListener('click', openShopModal);
  if (el.btnInventory) el.btnInventory.addEventListener('click', openInventoryModal);
  if (el.shopBack) el.shopBack.addEventListener('click', closeShopModal);
  if (el.btnInventoryBack) el.btnInventoryBack.addEventListener('click', closeInventoryModal);

  el.btnLotteryBack.addEventListener('click', closeLotteryModal);

  el.ticketOptions.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var count = parseInt(btn.dataset.count, 10);
      var price = parseInt(btn.dataset.price, 10);
      if (state.money < price) return;
      purchaseLottery(count, price);
    });
  });

  el.btnCloseResult.addEventListener('click', closeResultModal);

  el.lotteryModal.addEventListener('click', function (e) {
    if (e.target === el.lotteryModal) closeLotteryModal();
  });
  el.resultModal.addEventListener('click', function (e) {
    if (e.target === el.resultModal) closeResultModal();
  });
  if (el.shopModal) {
    el.shopModal.addEventListener('click', function (e) {
      if (e.target === el.shopModal) closeShopModal();
    });
  }
  if (el.inventoryModal) {
    el.inventoryModal.addEventListener('click', function (e) {
      if (e.target === el.inventoryModal) closeInventoryModal();
    });
  }

  // ---------- ホーム待機：家の中を歩く ----------
  function startIdleWalk() {
    var roomEl = el.room;
    var heroEl = el.hero;
    if (!roomEl || !heroEl) return;
    var heroWidth = 32;
    var heroHeight = 48;
    var padding = 24;
    var floorY = 52;
    var walkY = 90;

    function getRoomWidth() {
      return roomEl.offsetWidth || 280;
    }
    function setHeroPos(leftPx, bottomPx) {
      heroEl.style.left = leftPx + 'px';
      heroEl.style.bottom = bottomPx + 'px';
    }

    var step = 0;
    heroEl.classList.add('walking');
    function tick() {
      var w = getRoomWidth();
      var leftMin = padding;
      var leftMax = w - heroWidth - padding;
      if (step === 0) {
        setHeroPos(leftMin, floorY);
        step = 1;
        setTimeout(tick, 2200);
      } else if (step === 1) {
        setHeroPos(leftMax, floorY);
        step = 2;
        setTimeout(tick, 2200);
      } else if (step === 2) {
        setHeroPos(leftMax, walkY);
        step = 3;
        setTimeout(tick, 2200);
      } else if (step === 3) {
        setHeroPos(leftMin, walkY);
        step = 4;
        setTimeout(tick, 2200);
      } else {
        setHeroPos(leftMin, floorY);
        step = 0;
        setTimeout(tick, 2200);
      }
    }
    setTimeout(tick, 500);
  }

  if (el.placeModal) {
    el.placeModal.addEventListener('click', function (e) {
      if (e.target === el.placeModal) closePlaceModal();
    });
  }
  if (el.btnPlaceBack) el.btnPlaceBack.addEventListener('click', closePlaceModal);

  if (el.btnGoRace) el.btnGoRace.addEventListener('click', showRaceScreen);
  if (el.btnBackFromRace) el.btnBackFromRace.addEventListener('click', showMainScreen);
  if (el.btnBuyTickets) el.btnBuyTickets.addEventListener('click', openTicketModal);
  if (el.btnStartRace) el.btnStartRace.addEventListener('click', executeRaceAndResult);
  if (el.btnTicketConfirm) el.btnTicketConfirm.addEventListener('click', confirmTickets);
  if (el.btnTicketModalBack) el.btnTicketModalBack.addEventListener('click', closeTicketModal);
  if (el.btnRaceResultClose) el.btnRaceResultClose.addEventListener('click', closeRaceResultAndBack);
  if (el.ticketModal) {
    el.ticketModal.addEventListener('click', function (e) {
      if (e.target === el.ticketModal) closeTicketModal();
    });
  }
  if (el.ticketYenInput) {
    el.ticketYenInput.addEventListener('input', renderTicketModal);
    el.ticketYenInput.addEventListener('change', renderTicketModal);
  }
  if (el.raceResultModal) {
    el.raceResultModal.addEventListener('click', function (e) {
      if (e.target === el.raceResultModal) closeRaceResultAndBack();
    });
  }

  // ---------- 初期化 ----------
  updateUI();
  setMessage(messages.default);
  renderRoomSlots();
  startIdleWalk();
  generateCurrentRace();
})();
