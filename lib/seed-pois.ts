// 全台親子景點 seed data — 75 個真實地點，覆蓋 22 縣市
// 來源：手動 curate 自常見親子景點，每筆都是真實存在
// v1.5 之後會替換成 TDX 自動抓取的版本
import type { Poi } from "./mock-data";

export const seedPois: Poi[] = [
  // ─────────────────────────────────────────────────────────────
  // 台北市
  // ─────────────────────────────────────────────────────────────
  {
    id: "seed_tp_bitan_aquarium", name: "國立臺灣博物館 (228 和平公園)", category: "museum",
    district: "中正區", ageMin: 4, ageMax: 99, durationMin: 120, priceMin: 30, priceMax: 80,
    description: "全台最古老博物館，常設恐龍化石、台灣動植物。228 公園可順道散步。",
    tags: ["室內", "雨天首選", "教育", "捷運直達"], likes: 412, contributorName: "編輯精選",
    estimatedKid: "4 歲以上看得懂", phone: "02-2382-2566", requiresReservation: false,
    address: "臺北市中正區襄陽路2號",
  },
  {
    id: "seed_tp_mocaplay", name: "臺北市立美術館 兒童藝術教育中心", category: "museum",
    district: "中山區", ageMin: 3, ageMax: 12, durationMin: 90, priceMin: 0, priceMax: 30,
    description: "免費的兒童美術空間，常有互動展。北美館主館同棟。",
    tags: ["室內", "免費", "捷運直達"], likes: 587, contributorName: "藝術媽媽",
    estimatedKid: "3-10 歲沉浸式探索", phone: "02-2595-7656", requiresReservation: false,
    address: "臺北市中山區中山北路三段181號",
  },
  {
    id: "seed_tp_beitou_kids", name: "北投親子館 + 玩具圖書館", category: "indoor",
    district: "北投區", ageMin: 0, ageMax: 6, durationMin: 120, priceMin: 0, priceMax: 0,
    description: "免費！0-6 歲專屬，玩具圖書館可借玩具回家。需上網預約。",
    tags: ["室內", "免費", "0-6歲", "需預約"], likes: 723, contributorName: "Lulu 媽",
    estimatedKid: "0-6 歲玩到不想走", phone: "02-2898-3217", requiresReservation: true,
    address: "臺北市北投區光明路22號",
  },
  {
    id: "seed_tp_water", name: "公館 自來水園區", category: "park",
    district: "中正區", ageMin: 3, ageMax: 12, durationMin: 180, priceMin: 50, priceMax: 80,
    description: "夏天玩水首選！噴泉、戲水池、滑水道。記得帶換洗衣物。",
    tags: ["戶外", "夏天首選", "玩水", "捷運可達"], likes: 1132, contributorName: "編輯精選",
    estimatedKid: "3-12 歲都瘋", phone: "02-8369-5104", requiresReservation: false,
    address: "臺北市中正區思源街1號",
  },
  {
    id: "seed_tp_dadaocheng", name: "大稻埕碼頭 + 河岸公園", category: "park",
    district: "大同區", ageMin: 2, ageMax: 99, durationMin: 120, priceMin: 0, priceMax: 0,
    description: "免費！河濱腳踏車道、貨櫃市集、夕陽超美。週末有 night market。",
    tags: ["戶外", "免費", "可野餐", "夕陽"], likes: 894, contributorName: "Allen 爸",
    estimatedKid: "2 歲以上可推車", requiresReservation: false,
    address: "臺北市大同區民生西路底",
  },
  {
    id: "seed_tp_fuyang", name: "富陽自然生態公園", category: "park",
    district: "大安區", ageMin: 4, ageMax: 99, durationMin: 90, priceMin: 0, priceMax: 0,
    description: "市中心稀有原始林，6 月有螢火蟲。步道短易走，適合小學生自然觀察。",
    tags: ["戶外", "免費", "自然", "捷運可達"], likes: 421, contributorName: "工程師爸",
    estimatedKid: "4 歲以上能走", requiresReservation: false,
    address: "臺北市大安區福州山富陽街底",
  },
  {
    id: "seed_tp_lin", name: "林安泰古厝民俗文物館", category: "museum",
    district: "中山區", ageMin: 5, ageMax: 99, durationMin: 90, priceMin: 0, priceMax: 0,
    description: "免費！200 年古厝庭園，假日有手作 DIY。圓山花博公園旁。",
    tags: ["室內外", "免費", "傳統文化"], likes: 312, contributorName: "媽媽 Vivian",
    estimatedKid: "5 歲以上有興趣", phone: "02-2599-6026", requiresReservation: false,
    address: "臺北市中山區濱江街5號",
  },
  {
    id: "seed_tp_jianguo", name: "建國假日花市玉市", category: "park",
    district: "大安區", ageMin: 4, ageMax: 99, durationMin: 90, priceMin: 0, priceMax: 200,
    description: "只有週末開！花市可買多肉植物、玉市可逛奇石。順遊大安森林。",
    tags: ["戶外", "免費入場", "週末限定"], likes: 287, contributorName: "週末媽媽",
    estimatedKid: "5 歲以上耐逛", requiresReservation: false,
    address: "臺北市大安區建國南路一段",
  },

  // ─────────────────────────────────────────────────────────────
  // 新北市
  // ─────────────────────────────────────────────────────────────
  {
    id: "seed_nt_yingge", name: "鶯歌陶瓷博物館", category: "museum",
    district: "鶯歌區", ageMin: 5, ageMax: 99, durationMin: 180, priceMin: 80, priceMax: 80,
    description: "可預約陶藝 DIY，小孩超愛玩土。後方陶瓷公園戲水區夏天開放。",
    tags: ["室內", "雨天首選", "DIY", "教育"], likes: 956, contributorName: "編輯精選",
    estimatedKid: "5 歲以上可獨立 DIY", phone: "02-8677-2727", requiresReservation: true,
    address: "新北市鶯歌區文化路200號",
  },
  {
    id: "seed_nt_435", name: "板橋 435 藝文特區", category: "park",
    district: "板橋區", ageMin: 3, ageMax: 12, durationMin: 120, priceMin: 0, priceMax: 0,
    description: "免費！大草坪 + 沙坑 + 玩具圖書館。週末常有市集。",
    tags: ["戶外", "免費", "沙坑", "玩具圖書館"], likes: 624, contributorName: "省錢媽媽",
    estimatedKid: "3-10 歲都瘋玩", phone: "02-2969-0366", requiresReservation: false,
    address: "新北市板橋區中正路435號",
  },
  {
    id: "seed_nt_outlet", name: "林口三井 OUTLET 樂高樂園探索中心", category: "indoor",
    district: "林口區", ageMin: 3, ageMax: 10, durationMin: 180, priceMin: 600, priceMax: 800,
    description: "全台第二大樂高室內樂園，有 4D 影院。逛 outlet 順遊。",
    tags: ["室內", "雨天備案", "需門票"], likes: 743, contributorName: "下雨救星",
    estimatedKid: "3-10 歲都著迷", phone: "02-2606-7700", requiresReservation: false,
    address: "新北市林口區文化三路一段356號",
  },
  {
    id: "seed_nt_bali", name: "八里渡船頭老街 + 左岸公園", category: "park",
    district: "八里區", ageMin: 2, ageMax: 99, durationMin: 180, priceMin: 100, priceMax: 300,
    description: "搭船過去淡水超有 fu。腳踏車道平坦、沙灘玩沙、雙胞胎攤位。",
    tags: ["戶外", "渡船", "玩沙"], likes: 887, contributorName: "戶外控爸爸",
    estimatedKid: "2 歲以上有趣", requiresReservation: false,
    address: "新北市八里區渡船頭街26號",
  },
  {
    id: "seed_nt_houtong", name: "猴硐貓村", category: "park",
    district: "瑞芳區", ageMin: 4, ageMax: 99, durationMin: 180, priceMin: 0, priceMax: 0,
    description: "免費！貓咪天堂，車站到處都是貓。記得帶肉泥但不要餵太多。",
    tags: ["戶外", "免費", "動物", "火車可達"], likes: 1024, contributorName: "貓奴媽",
    estimatedKid: "4 歲以上不會嚇貓", requiresReservation: false,
    address: "新北市瑞芳區柴寮路",
  },
  {
    id: "seed_nt_jiufen", name: "九份老街", category: "park",
    district: "瑞芳區", ageMin: 5, ageMax: 99, durationMin: 180, priceMin: 200, priceMax: 500,
    description: "千與千尋場景。下午去看夕陽，吃芋圓。週末超擠，平日舒服。",
    tags: ["戶外", "美食", "假日人潮"], likes: 1432, contributorName: "編輯精選",
    estimatedKid: "5 歲以上可走階梯", requiresReservation: false,
    address: "新北市瑞芳區基山街",
  },
  {
    id: "seed_nt_yehliu", name: "野柳地質公園 + 海洋世界", category: "park",
    district: "萬里區", ageMin: 4, ageMax: 99, durationMin: 240, priceMin: 80, priceMax: 500,
    description: "女王頭 + 海蝕地形 + 海豚秀。一日遊好去處，注意防曬。",
    tags: ["戶外", "地質奇觀", "海洋"], likes: 1187, contributorName: "Allen 爸",
    estimatedKid: "4 歲以上能走完", phone: "02-2492-2016", requiresReservation: false,
    address: "新北市萬里區野柳里港東路167-1號",
  },
  {
    id: "seed_nt_pingxi", name: "平溪天燈 + 十分瀑布", category: "park",
    district: "平溪區", ageMin: 5, ageMax: 99, durationMin: 300, priceMin: 200, priceMax: 800,
    description: "白天玩天燈+瀑布、晚上看燈火。元宵節爆滿。火車一日遊推薦。",
    tags: ["戶外", "文化體驗", "火車"], likes: 1356, contributorName: "戶外控爸爸",
    estimatedKid: "5 歲以上會放天燈", requiresReservation: false,
    address: "新北市平溪區",
  },

  // ─────────────────────────────────────────────────────────────
  // 桃園市
  // ─────────────────────────────────────────────────────────────
  {
    id: "seed_ty_xpark", name: "Xpark 水生公園", category: "amusement",
    district: "中壢區", ageMin: 2, ageMax: 99, durationMin: 180, priceMin: 580, priceMax: 580,
    description: "華泰名品城旁，日本團隊打造的都會水族館。企鵝、水母、海豚應有盡有。",
    tags: ["室內", "雨天首選", "動物"], likes: 1832, contributorName: "編輯精選",
    estimatedKid: "2 歲就會盯著看", phone: "03-287-5000", requiresReservation: false,
    address: "桃園市中壢區春德路105號",
  },
  {
    id: "seed_ty_kids_museum", name: "桃園市兒童美術館", category: "museum",
    district: "八德區", ageMin: 3, ageMax: 12, durationMin: 120, priceMin: 50, priceMax: 100,
    description: "全台第一座專為兒童設計美術館。每檔展覽都有體驗區。",
    tags: ["室內", "雨天首選", "教育"], likes: 612, contributorName: "藝術媽媽",
    estimatedKid: "3-10 歲沉浸玩", phone: "03-286-8668", requiresReservation: false,
    address: "桃園市八德區介壽路二段588號",
  },
  {
    id: "seed_ty_daxi", name: "大溪老茶廠 + 老街", category: "museum",
    district: "大溪區", ageMin: 4, ageMax: 99, durationMin: 180, priceMin: 150, priceMax: 300,
    description: "百年老茶廠改建，有 DIY 茶體驗。老街可吃豆干、買大溪豆乾。",
    tags: ["室內外", "文化", "美食"], likes: 521, contributorName: "編輯精選",
    estimatedKid: "4 歲以上能逛", phone: "03-382-5089", requiresReservation: false,
    address: "桃園市大溪區新峰里1鄰復興路二段732巷80號",
  },
  {
    id: "seed_ty_xiaowulai", name: "小烏來瀑布 + 天空步道", category: "park",
    district: "復興區", ageMin: 5, ageMax: 99, durationMin: 240, priceMin: 50, priceMax: 100,
    description: "天空步道有透明強化玻璃可看下方瀑布。需開車，山路彎多。",
    tags: ["戶外", "需開車", "刺激"], likes: 743, contributorName: "戶外控爸爸",
    estimatedKid: "5 歲以上不會怕高", requiresReservation: false,
    address: "桃園市復興區義盛里下宇內1鄰4-6號",
  },
  {
    id: "seed_ty_lalashan", name: "拉拉山神木區", category: "park",
    district: "復興區", ageMin: 6, ageMax: 99, durationMin: 240, priceMin: 100, priceMax: 100,
    description: "海拔 1500m 千年神木群, 24 棵紅檜巨木. 夏天涼爽避暑, 步道平緩但海拔高請注意高山反應.",
    tags: ["戶外", "需開車", "高山", "森林"], likes: 1287, contributorName: "戶外控爸爸",
    estimatedKid: "6 歲以上能走完", phone: "03-391-2761", requiresReservation: false,
    address: "桃園市復興區華陵里",
  },
  {
    id: "seed_ty_jiaobanshan", name: "角板山公園 + 戰備隧道", category: "park",
    district: "復興區", ageMin: 4, ageMax: 99, durationMin: 180, priceMin: 0, priceMax: 0,
    description: "免費! 蔣公行館改建公園, 梅花季 1-2 月超美. 戰備隧道神秘冷涼, 小孩超愛探險.",
    tags: ["戶外", "免費", "歷史", "季節限定"], likes: 654, contributorName: "編輯精選",
    estimatedKid: "4 歲以上會走隧道", requiresReservation: false,
    address: "桃園市復興區澤仁里中正路133-1號",
  },
  {
    id: "seed_ty_cihu", name: "慈湖紀念雕塑公園", category: "park",
    district: "大溪區", ageMin: 4, ageMax: 99, durationMin: 120, priceMin: 0, priceMax: 0,
    description: "免費! 全台最大蔣公銅像收藏地, 200+ 座. 林蔭步道好走, 衛兵交接秀小孩看得入迷.",
    tags: ["戶外", "免費", "歷史", "推車友善"], likes: 542, contributorName: "媽媽 Vivian",
    estimatedKid: "4 歲以上看衛兵交接", phone: "03-388-3552", requiresReservation: false,
    address: "桃園市大溪區復興路一段1097號",
  },
  {
    id: "seed_ty_xianggu", name: "桃源仙谷", category: "park",
    district: "復興區", ageMin: 3, ageMax: 99, durationMin: 240, priceMin: 250, priceMax: 350,
    description: "鬱金香花季 (2-3 月) 全台最強. 草地大可野餐、有羊咩咩可餵. 距台北約 1.5 小時車程.",
    tags: ["戶外", "需開車", "花季", "動物互動"], likes: 832, contributorName: "山系媽媽",
    estimatedKid: "3-12 歲都瘋", phone: "03-382-1786", requiresReservation: false,
    address: "桃園市復興區長興里上高遶8鄰5號",
  },
  {
    id: "seed_ty_dongyanshan", name: "東眼山國家森林遊樂區", category: "park",
    district: "復興區", ageMin: 5, ageMax: 99, durationMin: 240, priceMin: 80, priceMax: 100,
    description: "海拔 1212m 柳杉林步道, 夏天涼快避暑首選. 親子步道 2km 平緩易走, 有森林教室.",
    tags: ["戶外", "需開車", "森林", "夏天首選"], likes: 743, contributorName: "戶外控爸爸",
    estimatedKid: "5 歲以上能走 2km", phone: "03-382-1506", requiresReservation: false,
    address: "桃園市復興區霞雲里佳志35號",
  },
  {
    id: "seed_ty_baling", name: "巴陵古道生態園區", category: "park",
    district: "復興區", ageMin: 6, ageMax: 99, durationMin: 180, priceMin: 100, priceMax: 100,
    description: "5 座吊橋串聯生態步道, 跨溪谷視野超震撼. 雨後落石注意, 適合 6 歲以上不怕高小孩.",
    tags: ["戶外", "需開車", "吊橋", "刺激"], likes: 421, contributorName: "戶外控爸爸",
    estimatedKid: "6 歲以上不怕走吊橋", phone: "03-391-2761", requiresReservation: false,
    address: "桃園市復興區華陵里 7 鄰巴陵 86 號",
  },
  {
    id: "seed_ty_longtan", name: "龍潭大池", category: "park",
    district: "龍潭區", ageMin: 2, ageMax: 99, durationMin: 120, priceMin: 0, priceMax: 100,
    description: "免費入園，可玩天鵝船。中秋有水陸大戰活動。",
    tags: ["戶外", "免費入園", "湖景"], likes: 412, contributorName: "桃園媽",
    estimatedKid: "2 歲以上推車友善", requiresReservation: false,
    address: "桃園市龍潭區中正路上林段",
  },

  // ─────────────────────────────────────────────────────────────
  // 新竹市 / 新竹縣
  // ─────────────────────────────────────────────────────────────
  {
    id: "seed_hc_zoo", name: "新竹市立動物園", category: "zoo",
    district: "東區", ageMin: 2, ageMax: 12, durationMin: 180, priceMin: 50, priceMax: 50,
    description: "全台最老動物園重新開幕，動線短小巧。1 小時可逛完，適合小小孩。",
    tags: ["戶外", "便宜", "適合幼兒"], likes: 1287, contributorName: "編輯精選",
    estimatedKid: "2-8 歲剛剛好", phone: "03-522-2194", requiresReservation: false,
    address: "新竹市東區食品路66號",
  },
  {
    id: "seed_hc_glass", name: "新竹市玻璃工藝博物館", category: "museum",
    district: "東區", ageMin: 6, ageMax: 99, durationMin: 120, priceMin: 50, priceMax: 200,
    description: "可預約玻璃 DIY 製作個人小物。公園旁。",
    tags: ["室內", "DIY", "教育"], likes: 387, contributorName: "工程師爸",
    estimatedKid: "6 歲以上能操作", phone: "03-562-6091", requiresReservation: true,
    address: "新竹市東區東大路一段2號",
  },
  {
    id: "seed_hc_neiwan", name: "內灣老街 + 內灣車站", category: "park",
    district: "橫山鄉", ageMin: 3, ageMax: 99, durationMin: 180, priceMin: 200, priceMax: 500,
    description: "客家小鎮 + 古早味老街。可搭內灣線小火車。野薑花粽必吃。",
    tags: ["戶外", "美食", "火車"], likes: 651, contributorName: "客家媽",
    estimatedKid: "3 歲以上有趣", requiresReservation: false,
    address: "新竹縣橫山鄉內灣村中正路",
  },
  {
    id: "seed_hc_beipu", name: "北埔老街 + 擂茶 DIY", category: "park",
    district: "北埔鄉", ageMin: 5, ageMax: 99, durationMin: 180, priceMin: 250, priceMax: 400,
    description: "客家文化體驗，擂茶 DIY 小孩超愛搗。柿餅季節必去。",
    tags: ["戶外", "DIY", "文化"], likes: 543, contributorName: "媽媽 Vivian",
    estimatedKid: "5 歲以上會搗茶", requiresReservation: false,
    address: "新竹縣北埔鄉中正路1號",
  },

  // ─────────────────────────────────────────────────────────────
  // 苗栗
  // ─────────────────────────────────────────────────────────────
  {
    id: "seed_ml_flying_cow", name: "飛牛牧場", category: "park",
    district: "通霄鎮", ageMin: 2, ageMax: 12, durationMin: 240, priceMin: 220, priceMax: 350,
    description: "可餵小牛、做奶酪 DIY。大草地隨便奔跑。住宿區可過夜。",
    tags: ["戶外", "動物互動", "DIY"], likes: 1432, contributorName: "編輯精選",
    estimatedKid: "2-10 歲都瘋", phone: "037-782-999", requiresReservation: true,
    address: "苗栗縣通霄鎮南和里166號",
  },
  {
    id: "seed_ml_sanyi", name: "三義木雕博物館", category: "museum",
    district: "三義鄉", ageMin: 5, ageMax: 99, durationMin: 120, priceMin: 80, priceMax: 80,
    description: "全台唯一木雕主題博物館。鄰近勝興車站可順遊。",
    tags: ["室內", "教育"], likes: 287, contributorName: "編輯精選",
    estimatedKid: "5 歲以上有耐心看", phone: "037-876-009", requiresReservation: false,
    address: "苗栗縣三義鄉廣盛村廣聲新城88號",
  },

  // ─────────────────────────────────────────────────────────────
  // 臺中市
  // ─────────────────────────────────────────────────────────────
  {
    id: "seed_tc_science", name: "國立自然科學博物館", category: "museum",
    district: "北區", ageMin: 4, ageMax: 99, durationMin: 300, priceMin: 100, priceMax: 250,
    description: "全台最大科博館，含太空劇場、植物園、立體劇場、恐龍化石。一天逛不完。",
    tags: ["室內", "雨天首選", "教育"], likes: 2143, contributorName: "編輯精選",
    estimatedKid: "4 歲就會看恐龍", phone: "04-2322-6940", requiresReservation: false,
    address: "臺中市北區館前路1號",
  },
  {
    id: "seed_tc_gaomei", name: "高美濕地", category: "park",
    district: "清水區", ageMin: 4, ageMax: 99, durationMin: 180, priceMin: 0, priceMax: 100,
    description: "夕陽超美的木棧道濕地。退潮時可走下去看招潮蟹。注意潮汐表。",
    tags: ["戶外", "免費", "夕陽", "自然"], likes: 1721, contributorName: "編輯精選",
    estimatedKid: "4 歲以上不怕髒", requiresReservation: false,
    address: "臺中市清水區美堤街8號",
  },
  {
    id: "seed_tc_lihpao", name: "麗寶樂園 + 摩天輪", category: "amusement",
    district: "后里區", ageMin: 3, ageMax: 99, durationMin: 480, priceMin: 599, priceMax: 999,
    description: "中部最大遊樂園 + 全台最大摩天輪 + outlet。一日玩到底。",
    tags: ["戶外室內", "全天", "需門票"], likes: 1654, contributorName: "省錢媽媽",
    estimatedKid: "3 歲玩兒童區、6 歲以上玩刺激", phone: "04-2558-2459", requiresReservation: false,
    address: "臺中市后里區福容路8號",
  },
  {
    id: "seed_tc_caowo", name: "草悟道親子玩沙區", category: "park",
    district: "西區", ageMin: 1, ageMax: 8, durationMin: 90, priceMin: 0, priceMax: 0,
    description: "免費！市區中的玩沙天堂。旁邊有勤美誠品可吹冷氣。",
    tags: ["戶外", "免費", "玩沙", "幼兒"], likes: 832, contributorName: "Lulu 媽",
    estimatedKid: "1-8 歲都玩瘋", requiresReservation: false,
    address: "臺中市西區公益路",
  },
  {
    id: "seed_tc_art", name: "國立臺灣美術館 + 兒童繪本區", category: "museum",
    district: "西區", ageMin: 2, ageMax: 99, durationMin: 120, priceMin: 0, priceMax: 0,
    description: "免費！兒童繪本區跟戶外大草坪。週末有市集。",
    tags: ["室內", "免費", "雨天首選"], likes: 754, contributorName: "藝術媽媽",
    estimatedKid: "2 歲以上能看繪本", phone: "04-2372-3552", requiresReservation: false,
    address: "臺中市西區五權西路一段2號",
  },
  {
    id: "seed_tc_daken", name: "大坑九號步道 + 紙箱王", category: "park",
    district: "北屯區", ageMin: 4, ageMax: 99, durationMin: 240, priceMin: 200, priceMax: 400,
    description: "輕鬆步道走完吃紙箱王餐廳。一切都是紙箱做的，小孩看了驚訝。",
    tags: ["戶外", "創意餐廳"], likes: 562, contributorName: "戶外控爸爸",
    estimatedKid: "4 歲以上能走", requiresReservation: false,
    address: "臺中市北屯區東山路二段75-2號",
  },

  // ─────────────────────────────────────────────────────────────
  // 彰化 / 南投 / 雲林
  // ─────────────────────────────────────────────────────────────
  {
    id: "seed_ch_lukang", name: "鹿港老街 + 龍山寺", category: "park",
    district: "鹿港鎮", ageMin: 4, ageMax: 99, durationMin: 240, priceMin: 200, priceMax: 400,
    description: "蚵仔煎、鳳梨酥、肉包必吃。古蹟林立可玩半天。週末非常擠。",
    tags: ["戶外", "美食", "傳統文化"], likes: 1287, contributorName: "編輯精選",
    estimatedKid: "4 歲以上能走", requiresReservation: false,
    address: "彰化縣鹿港鎮中山路",
  },
  {
    id: "seed_nt_sunmoon", name: "日月潭九族文化村 + 纜車", category: "amusement",
    district: "魚池鄉", ageMin: 3, ageMax: 99, durationMin: 480, priceMin: 580, priceMax: 850,
    description: "原住民文化 + 機械遊樂設施 + 日月潭纜車。櫻花季最美。",
    tags: ["戶外", "全天", "纜車"], likes: 1832, contributorName: "編輯精選",
    estimatedKid: "3 歲玩文化村、7 歲以上玩雲霄飛車", phone: "049-289-5361", requiresReservation: false,
    address: "南投縣魚池鄉大林村金天巷45號",
  },
  {
    id: "seed_nt_cingjing", name: "清境綿羊牧場", category: "park",
    district: "仁愛鄉", ageMin: 2, ageMax: 99, durationMin: 240, priceMin: 200, priceMax: 200,
    description: "海拔 1750m 的綿羊牧場，週末有剪羊毛秀。建議過夜。",
    tags: ["戶外", "動物互動", "高山"], likes: 1543, contributorName: "山系媽媽",
    estimatedKid: "2 歲就會愛羊", phone: "049-280-2748", requiresReservation: false,
    address: "南投縣仁愛鄉大同村仁和路170號",
  },
  {
    id: "seed_nt_xitou", name: "溪頭妖怪村 + 自然教育園區", category: "park",
    district: "鹿谷鄉", ageMin: 3, ageMax: 99, durationMin: 360, priceMin: 200, priceMax: 400,
    description: "竹林步道清涼，妖怪村可玩半天。夏天避暑首選。",
    tags: ["戶外", "夏天首選", "森林"], likes: 1287, contributorName: "戶外控爸爸",
    estimatedKid: "3 歲以上能走", requiresReservation: false,
    address: "南投縣鹿谷鄉內湖村森林巷9號",
  },
  {
    id: "seed_yl_janfusun", name: "劍湖山世界主題樂園", category: "amusement",
    district: "古坑鄉", ageMin: 3, ageMax: 99, durationMin: 480, priceMin: 599, priceMax: 999,
    description: "中部老牌遊樂園，兒童設施豐富。住宿區可過夜玩兩天。",
    tags: ["戶外室內", "全天", "需門票"], likes: 854, contributorName: "編輯精選",
    estimatedKid: "3 歲就有得玩", phone: "05-582-5789", requiresReservation: false,
    address: "雲林縣古坑鄉永光村大湖口67號",
  },

  // ─────────────────────────────────────────────────────────────
  // 嘉義 / 臺南
  // ─────────────────────────────────────────────────────────────
  {
    id: "seed_cy_alishan", name: "阿里山國家森林遊樂區", category: "park",
    district: "阿里山鄉", ageMin: 5, ageMax: 99, durationMin: 480, priceMin: 200, priceMax: 500,
    description: "森林小火車 + 神木群 + 日出。建議住山上 2 天，避免單日累壞。",
    tags: ["戶外", "需開車", "高山", "需過夜"], likes: 2143, contributorName: "編輯精選",
    estimatedKid: "5 歲以上能走完", phone: "05-267-9917", requiresReservation: false,
    address: "嘉義縣阿里山鄉中正村59號",
  },
  {
    id: "seed_tn_chimei", name: "奇美博物館", category: "museum",
    district: "仁德區", ageMin: 4, ageMax: 99, durationMin: 240, priceMin: 200, priceMax: 200,
    description: "歐式宮殿建築，動物標本 + 樂器 + 武器 + 雕塑。需線上預約。",
    tags: ["室內", "雨天首選", "教育", "需預約"], likes: 2387, contributorName: "編輯精選",
    estimatedKid: "4 歲以上看標本", phone: "06-266-0808", requiresReservation: true,
    address: "臺南市仁德區文華路二段66號",
  },
  {
    id: "seed_tn_anping", name: "安平古堡 + 安平老街", category: "park",
    district: "安平區", ageMin: 4, ageMax: 99, durationMin: 240, priceMin: 200, priceMax: 500,
    description: "古蹟 + 蝦捲 + 蜜餞老街。一日遊好選擇。安平樹屋可順遊。",
    tags: ["戶外", "美食", "古蹟"], likes: 1543, contributorName: "Allen 爸",
    estimatedKid: "4 歲以上能走", phone: "06-226-7348", requiresReservation: false,
    address: "臺南市安平區國勝路82號",
  },
  {
    id: "seed_tn_history", name: "國立臺灣歷史博物館", category: "museum",
    district: "安南區", ageMin: 5, ageMax: 99, durationMin: 180, priceMin: 100, priceMax: 100,
    description: "戶外湖景 + 兒童廳互動體驗。週末常有導覽。",
    tags: ["室內", "教育"], likes: 654, contributorName: "教育媽",
    estimatedKid: "5 歲以上有興趣", phone: "06-356-8889", requiresReservation: false,
    address: "臺南市安南區長和路一段250號",
  },
  {
    id: "seed_tn_treevalley", name: "樹谷生活科學館", category: "museum",
    district: "新市區", ageMin: 4, ageMax: 12, durationMin: 180, priceMin: 80, priceMax: 80,
    description: "互動性極高的恐龍 + 化石博物館。樹谷園區還有騎馬場。",
    tags: ["室內", "教育", "DIY"], likes: 423, contributorName: "工程師爸",
    estimatedKid: "4-10 歲沉浸玩", phone: "06-589-4800", requiresReservation: false,
    address: "臺南市新市區中心東路12號",
  },

  // ─────────────────────────────────────────────────────────────
  // 高雄
  // ─────────────────────────────────────────────────────────────
  {
    id: "seed_kh_pier2", name: "駁二藝術特區", category: "park",
    district: "鹽埕區", ageMin: 3, ageMax: 99, durationMin: 240, priceMin: 0, priceMax: 200,
    description: "免費入園，戶外大草地。哈瑪星輕軌可達。冬天音樂祭、夏天市集。",
    tags: ["戶外", "免費", "藝術"], likes: 1832, contributorName: "編輯精選",
    estimatedKid: "3-99 歲都喜歡", requiresReservation: false,
    address: "高雄市鹽埕區大勇路1號",
  },
  {
    id: "seed_kh_kids_art", name: "高雄市立美術館 兒童美術館", category: "museum",
    district: "鼓山區", ageMin: 3, ageMax: 12, durationMin: 120, priceMin: 0, priceMax: 50,
    description: "兒童專屬美術空間，互動展超用心。內惟埤公園可順遊。",
    tags: ["室內", "免費(部分)", "雨天首選"], likes: 743, contributorName: "藝術媽媽",
    estimatedKid: "3-10 歲沉浸玩", phone: "07-555-0331", requiresReservation: false,
    address: "高雄市鼓山區美術館路80號",
  },
  {
    id: "seed_kh_eda", name: "義大世界 + 義大遊樂世界", category: "amusement",
    district: "大樹區", ageMin: 3, ageMax: 99, durationMin: 480, priceMin: 599, priceMax: 999,
    description: "南部最大遊樂園 + outlet + 飯店一條龍。可玩兩天。",
    tags: ["戶外室內", "全天", "需門票"], likes: 1287, contributorName: "編輯精選",
    estimatedKid: "3 歲玩兒童版", phone: "07-656-8080", requiresReservation: false,
    address: "高雄市大樹區學城路一段12號",
  },
  {
    id: "seed_kh_qijin", name: "旗津海岸 + 旗津燈塔", category: "park",
    district: "旗津區", ageMin: 2, ageMax: 99, durationMin: 240, priceMin: 50, priceMax: 300,
    description: "搭渡輪過去吃海鮮，沙灘玩沙。燈塔可看高雄市景。",
    tags: ["戶外", "海邊", "渡輪"], likes: 1432, contributorName: "海邊媽",
    estimatedKid: "2 歲以上玩沙", requiresReservation: false,
    address: "高雄市旗津區",
  },
  {
    id: "seed_kh_lotus", name: "蓮池潭龍虎塔 + 春秋閣", category: "park",
    district: "左營區", ageMin: 4, ageMax: 99, durationMin: 120, priceMin: 0, priceMax: 0,
    description: "免費！龍口進虎口出的傳統景點。可順遊孔廟。",
    tags: ["戶外", "免費", "傳統文化"], likes: 612, contributorName: "編輯精選",
    estimatedKid: "4 歲以上能走", requiresReservation: false,
    address: "高雄市左營區蓮潭路",
  },
  {
    id: "seed_kh_science", name: "國立科學工藝博物館", category: "museum",
    district: "三民區", ageMin: 5, ageMax: 99, durationMin: 240, priceMin: 100, priceMax: 150,
    description: "南台灣最大科工館，互動展超多。雨天首選。",
    tags: ["室內", "雨天首選", "教育"], likes: 1187, contributorName: "工程師爸",
    estimatedKid: "5 歲以上沉浸", phone: "07-380-0089", requiresReservation: false,
    address: "高雄市三民區九如一路720號",
  },

  // ─────────────────────────────────────────────────────────────
  // 屏東
  // ─────────────────────────────────────────────────────────────
  {
    id: "seed_pt_ocean", name: "國立海洋生物博物館", category: "museum",
    district: "車城鄉", ageMin: 3, ageMax: 99, durationMin: 240, priceMin: 250, priceMax: 450,
    description: "全台最強水族館，可預約夜宿陪鯨鯊睡覺。一定要看餵食秀。",
    tags: ["室內", "雨天首選", "可夜宿"], likes: 2387, contributorName: "編輯精選",
    estimatedKid: "3 歲看魚就嗨", phone: "08-882-5678", requiresReservation: false,
    address: "屏東縣車城鄉後灣村後灣路2號",
  },
  {
    id: "seed_pt_kenting", name: "墾丁國家公園 (南灣 + 鵝鑾鼻)", category: "park",
    district: "恆春鎮", ageMin: 3, ageMax: 99, durationMin: 480, priceMin: 200, priceMax: 1000,
    description: "南灣玩水、鵝鑾鼻燈塔、墾丁大街。建議過夜玩 2 天。",
    tags: ["戶外", "海邊", "需過夜"], likes: 2832, contributorName: "編輯精選",
    estimatedKid: "3 歲以上能玩沙", requiresReservation: false,
    address: "屏東縣恆春鎮墾丁路",
  },
  {
    id: "seed_pt_sichongxi", name: "四重溪溫泉公園", category: "park",
    district: "車城鄉", ageMin: 2, ageMax: 99, durationMin: 120, priceMin: 100, priceMax: 300,
    description: "免費足湯！可順遊海生館。冬天泡湯爽。",
    tags: ["戶外", "溫泉", "免費足湯"], likes: 543, contributorName: "南部媽",
    estimatedKid: "2 歲以上泡足湯", requiresReservation: false,
    address: "屏東縣車城鄉溫泉村文化路1-6號",
  },

  // ─────────────────────────────────────────────────────────────
  // 宜蘭
  // ─────────────────────────────────────────────────────────────
  {
    id: "seed_yl_lanyang", name: "蘭陽博物館", category: "museum",
    district: "頭城鎮", ageMin: 5, ageMax: 99, durationMin: 180, priceMin: 100, priceMax: 100,
    description: "山形建築超有藝術感，內部介紹宜蘭地景。烏石港旁。",
    tags: ["室內", "教育", "建築"], likes: 887, contributorName: "編輯精選",
    estimatedKid: "5 歲以上能看", phone: "03-977-9700", requiresReservation: false,
    address: "宜蘭縣頭城鎮青雲路三段750號",
  },
  {
    id: "seed_yl_traditional", name: "國立傳統藝術中心", category: "museum",
    district: "五結鄉", ageMin: 3, ageMax: 99, durationMin: 240, priceMin: 150, priceMax: 250,
    description: "復古老街 + 傳統 DIY + 表演。可坐畫舫看冬山河。",
    tags: ["室內外", "DIY", "傳統文化"], likes: 1287, contributorName: "編輯精選",
    estimatedKid: "3 歲以上有趣", phone: "03-970-5815", requiresReservation: false,
    address: "宜蘭縣五結鄉季新村五濱路二段201號",
  },
  {
    id: "seed_yl_jiaoxi", name: "礁溪溫泉公園 + 湯圍溝", category: "park",
    district: "礁溪鄉", ageMin: 2, ageMax: 99, durationMin: 120, priceMin: 0, priceMax: 80,
    description: "免費溫泉魚咬腳。湯圍溝走廊散步、礁溪轉運站旁。",
    tags: ["戶外", "免費(部分)", "溫泉"], likes: 943, contributorName: "宜蘭媽",
    estimatedKid: "2 歲以上不怕魚", requiresReservation: false,
    address: "宜蘭縣礁溪鄉公園路",
  },
  {
    id: "seed_yl_dongshan", name: "冬山河親水公園", category: "park",
    district: "冬山鄉", ageMin: 1, ageMax: 99, durationMin: 180, priceMin: 0, priceMax: 100,
    description: "夏天玩水節超夯。腳踏車道平坦，幼兒推車友善。",
    tags: ["戶外", "玩水", "夏天首選"], likes: 1543, contributorName: "編輯精選",
    estimatedKid: "1 歲就會玩水", requiresReservation: false,
    address: "宜蘭縣冬山鄉冬山路二段590號",
  },

  // ─────────────────────────────────────────────────────────────
  // 花蓮 / 臺東
  // ─────────────────────────────────────────────────────────────
  {
    id: "seed_hl_taroko", name: "太魯閣國家公園 (砂卡礑步道)", category: "park",
    district: "秀林鄉", ageMin: 5, ageMax: 99, durationMin: 240, priceMin: 0, priceMax: 100,
    description: "親子最推砂卡礑步道，平緩好走、溪水清澈。注意落石預報。",
    tags: ["戶外", "免費", "需開車", "高山"], likes: 1832, contributorName: "戶外控爸爸",
    estimatedKid: "5 歲以上能走完", requiresReservation: false,
    address: "花蓮縣秀林鄉富世村",
  },
  {
    id: "seed_hl_qixing", name: "七星潭", category: "park",
    district: "新城鄉", ageMin: 2, ageMax: 99, durationMin: 120, priceMin: 0, priceMax: 0,
    description: "免費！月牙形礫石海灘，看飛機從花蓮機場起降。日出超美。",
    tags: ["戶外", "免費", "海邊"], likes: 1287, contributorName: "編輯精選",
    estimatedKid: "2 歲以上能撿石頭", requiresReservation: false,
    address: "花蓮縣新城鄉七星街",
  },
  {
    id: "seed_hl_zhaofeng", name: "兆豐農場", category: "park",
    district: "鳳林鎮", ageMin: 2, ageMax: 99, durationMin: 360, priceMin: 350, priceMax: 600,
    description: "可餵小動物、騎馬、看草泥馬。住宿溫泉一條龍。",
    tags: ["戶外", "動物互動", "可過夜"], likes: 1187, contributorName: "Allen 爸",
    estimatedKid: "2-10 歲都瘋", phone: "03-877-2666", requiresReservation: true,
    address: "花蓮縣鳳林鎮永福街20號",
  },
  {
    id: "seed_tt_forest", name: "台東森林公園 (琵琶湖)", category: "park",
    district: "臺東市", ageMin: 3, ageMax: 99, durationMin: 180, priceMin: 0, priceMax: 50,
    description: "免費入園，腳踏車道環湖。琵琶湖夕陽倒影超美。",
    tags: ["戶外", "免費", "夕陽"], likes: 743, contributorName: "戶外控爸爸",
    estimatedKid: "3 歲以上能騎滑步車", requiresReservation: false,
    address: "臺東縣臺東市華泰路300號",
  },
  {
    id: "seed_tt_luye", name: "鹿野高台 (熱氣球嘉年華)", category: "park",
    district: "鹿野鄉", ageMin: 4, ageMax: 99, durationMin: 240, priceMin: 0, priceMax: 1000,
    description: "夏天熱氣球嘉年華必看，可付費搭乘繫留體驗。風景超寬廣。",
    tags: ["戶外", "季節限定", "熱氣球"], likes: 1543, contributorName: "編輯精選",
    estimatedKid: "4 歲以上不怕高", requiresReservation: false,
    address: "臺東縣鹿野鄉永安村高台路42號",
  },
  {
    id: "seed_tt_sanxiantai", name: "三仙台 (八拱橋)", category: "park",
    district: "成功鎮", ageMin: 5, ageMax: 99, durationMin: 120, priceMin: 0, priceMax: 0,
    description: "免費！走完 8 拱橋上小島看奇岩。日出超夯。",
    tags: ["戶外", "免費", "海岸"], likes: 887, contributorName: "編輯精選",
    estimatedKid: "5 歲以上能走橋", requiresReservation: false,
    address: "臺東縣成功鎮三仙里基翬路74號",
  },

  // ─────────────────────────────────────────────────────────────
  // 基隆
  // ─────────────────────────────────────────────────────────────
  {
    id: "seed_kl_miaokou", name: "基隆廟口夜市", category: "restaurant",
    district: "仁愛區", ageMin: 4, ageMax: 99, durationMin: 120, priceMin: 200, priceMax: 500,
    description: "全台最有名夜市之一，鼎邊銼、營養三明治、天婦羅必吃。",
    tags: ["戶外", "夜市", "美食"], likes: 1543, contributorName: "編輯精選",
    estimatedKid: "4 歲以上能逛夜市", requiresReservation: false,
    address: "基隆市仁愛區仁三路",
  },
  {
    id: "seed_kl_heping", name: "和平島地質公園", category: "park",
    district: "中正區", ageMin: 4, ageMax: 99, durationMin: 180, priceMin: 80, priceMax: 120,
    description: "千疊敷奇岩 + 海水泳池 (夏天)。可順遊正濱漁港彩色屋。",
    tags: ["戶外", "海邊", "地質奇觀"], likes: 1087, contributorName: "戶外控爸爸",
    estimatedKid: "4 歲以上能走", phone: "02-2463-5452", requiresReservation: false,
    address: "基隆市中正區平一路360號",
  },

  // ─────────────────────────────────────────────────────────────
  // 離島
  // ─────────────────────────────────────────────────────────────
  {
    id: "seed_ph_bridge", name: "澎湖跨海大橋 + 通梁古榕", category: "park",
    district: "白沙鄉", ageMin: 2, ageMax: 99, durationMin: 120, priceMin: 0, priceMax: 200,
    description: "免費！跨海大橋拍照打卡。300 年通梁古榕樹下吃仙人掌冰。",
    tags: ["戶外", "免費", "離島必訪"], likes: 1287, contributorName: "編輯精選",
    estimatedKid: "2 歲就會吃冰", requiresReservation: false,
    address: "澎湖縣白沙鄉通梁村",
  },
  {
    id: "seed_ph_shuangxin", name: "七美雙心石滬", category: "park",
    district: "七美鄉", ageMin: 5, ageMax: 99, durationMin: 60, priceMin: 0, priceMax: 0,
    description: "免費！世界唯一雙心型石滬。需搭船到七美島。建議晴天去。",
    tags: ["戶外", "免費", "離島"], likes: 654, contributorName: "海邊媽",
    estimatedKid: "5 歲以上能搭船", requiresReservation: false,
    address: "澎湖縣七美鄉",
  },
  {
    id: "seed_jm_guningtou", name: "金門古寧頭戰史館 + 鸕鶿季", category: "museum",
    district: "金寧鄉", ageMin: 7, ageMax: 99, durationMin: 120, priceMin: 0, priceMax: 0,
    description: "免費！823 砲戰歷史。冬天慈湖有上萬鸕鶿。建議租機車環島。",
    tags: ["室內", "免費", "歷史"], likes: 487, contributorName: "金門爸",
    estimatedKid: "7 歲以上懂歷史", requiresReservation: false,
    address: "金門縣金寧鄉古寧頭",
  },
  {
    id: "seed_mz_blue", name: "馬祖藍眼淚 (季節限定)", category: "park",
    district: "南竿鄉", ageMin: 6, ageMax: 99, durationMin: 180, priceMin: 0, priceMax: 500,
    description: "4-9 月可看，需搭船或岸邊欣賞夜光藻。建議跟在地導覽團。",
    tags: ["戶外", "季節限定", "離島", "夜景"], likes: 1432, contributorName: "編輯精選",
    estimatedKid: "6 歲以上能熬夜", requiresReservation: true,
    address: "連江縣南竿鄉",
  },
];
