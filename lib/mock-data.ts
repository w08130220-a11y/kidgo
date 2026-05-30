import { seedPois } from "./seed-pois";
import { tdxPois } from "./tdx-pois";

export type PoiCategory =
  | "park"
  | "museum"
  | "restaurant"
  | "zoo"
  | "amusement"
  | "indoor";

export type Poi = {
  id: string;
  name: string;
  category: PoiCategory;
  district: string;
  ageMin: number;
  ageMax: number;
  durationMin: number;
  priceMin: number;
  priceMax: number;
  description: string;
  tags: string[];
  likes: number;
  contributorName: string;
  estimatedKid: string;
  phone?: string;             // 電話（若需要預約）
  requiresReservation?: boolean; // 是否需要事先預約
  address?: string;           // 完整地址
  photos?: string[];          // 圖片 URL (TDX 抓的或 UGC 上傳); 沒填則 fallback 到漸層+emoji
};

const cat = (c: PoiCategory) => {
  const map: Record<PoiCategory, { emoji: string; gradient: string; label: string }> = {
    park: { emoji: "🌳", gradient: "from-emerald-300 to-emerald-500", label: "公園" },
    museum: { emoji: "🏛️", gradient: "from-violet-300 to-violet-500", label: "博物館" },
    restaurant: { emoji: "🍽️", gradient: "from-orange-300 to-orange-500", label: "親子餐廳" },
    zoo: { emoji: "🦁", gradient: "from-amber-300 to-amber-500", label: "動物" },
    amusement: { emoji: "🎡", gradient: "from-pink-300 to-pink-500", label: "遊樂園" },
    indoor: { emoji: "🎨", gradient: "from-teal-300 to-teal-500", label: "室內遊戲" },
  };
  return map[c];
};

export const categoryMeta = cat;

const handCurated: Poi[] = [
  {
    id: "poi_zoo_taipei",
    name: "臺北市立動物園",
    category: "zoo",
    district: "文山區",
    ageMin: 2,
    ageMax: 12,
    durationMin: 240,
    priceMin: 60,
    priceMax: 100,
    description: "全台最大動物園，有 400 多種動物。大貓熊館跟企鵝館是孩子最愛。建議搭捷運免停車。",
    tags: ["戶外", "推車友善", "雨天備案", "捷運直達"],
    likes: 1247,
    contributorName: "編輯精選",
    estimatedKid: "3-8 歲都愛，5 歲以上能走完全程",
    phone: "02-2938-2300",
    requiresReservation: false,
    address: "臺北市文山區新光路二段30號",
  },
  {
    id: "poi_kids_new",
    name: "臺北市兒童新樂園",
    category: "amusement",
    district: "士林區",
    ageMin: 3,
    ageMax: 12,
    durationMin: 300,
    priceMin: 30,
    priceMax: 300,
    description: "13 項遊樂設施，門票便宜，平日人少。建議下午 1 點後入場避開團體。",
    tags: ["戶外", "可重玩", "天氣晴", "適合小小孩"],
    likes: 982,
    contributorName: "Amy 媽",
    estimatedKid: "3 歲就能玩 8 成設施",
    phone: "02-2833-3823",
    requiresReservation: false,
    address: "臺北市士林區承德路五段55號",
  },
  {
    id: "poi_riverside",
    name: "大佳河濱公園",
    category: "park",
    district: "中山區",
    ageMin: 1,
    ageMax: 99,
    durationMin: 120,
    priceMin: 0,
    priceMax: 0,
    description: "免費！草地超大、河濱腳踏車道、彈跳床、沙坑、噴水池。週末有市集。",
    tags: ["免費", "戶外", "可野餐", "停車方便"],
    likes: 1893,
    contributorName: "編輯精選",
    estimatedKid: "1 歲以上都能玩，2-6 歲最瘋",
    requiresReservation: false,
    address: "臺北市中山區大佳河濱公園",
  },
  {
    id: "poi_science",
    name: "國立臺灣科學教育館",
    category: "museum",
    district: "士林區",
    ageMin: 4,
    ageMax: 99,
    durationMin: 180,
    priceMin: 100,
    priceMax: 200,
    description: "9 樓互動展覽，特別推薦 6F 的物理力學區。雨天首選。常設展學齡前可能稍硬。",
    tags: ["室內", "雨天首選", "學齡以上", "有電梯"],
    likes: 654,
    contributorName: "工程師爸",
    estimatedKid: "5 歲以上比較看得懂",
    phone: "02-6610-1234",
    requiresReservation: false,
    address: "臺北市士林區士商路189號",
  },
  {
    id: "poi_lab32",
    name: "Lab32 親子料理",
    category: "restaurant",
    district: "信義區",
    ageMin: 2,
    ageMax: 10,
    durationMin: 90,
    priceMin: 400,
    priceMax: 800,
    description: "用餐區有獨立遊戲區，店員會幫忙看小孩。義大利麵跟兒童餐都不錯。週末訂位要 3 天前。",
    tags: ["室內", "有遊戲區", "需訂位", "推車友善"],
    likes: 423,
    contributorName: "週末爸爸",
    estimatedKid: "2 歲開始可以放電",
    phone: "02-2729-9988",
    requiresReservation: true,
    address: "臺北市信義區基隆路一段180號",
  },
  {
    id: "poi_palace",
    name: "故宮博物院兒童學藝中心",
    category: "museum",
    district: "士林區",
    ageMin: 5,
    ageMax: 12,
    durationMin: 120,
    priceMin: 0,
    priceMax: 350,
    description: "為小孩設計的故宮分區，有互動展品。家長免費入兒童區。可結合本館 1-2 小時。",
    tags: ["室內", "免費(兒童區)", "教育性高", "需排隊"],
    likes: 312,
    contributorName: "媽媽 Vivian",
    estimatedKid: "5 歲以上才有耐心",
    phone: "02-2881-2021",
    requiresReservation: false,
    address: "臺北市士林區至善路二段221號",
  },
  {
    id: "poi_daanforest",
    name: "大安森林公園",
    category: "park",
    district: "大安區",
    ageMin: 0,
    ageMax: 99,
    durationMin: 90,
    priceMin: 0,
    priceMax: 0,
    description: "市中心最大公園，有兒童遊戲場、生態池。週日下午露天音樂會。捷運直達。",
    tags: ["免費", "戶外", "捷運直達", "可野餐"],
    likes: 1521,
    contributorName: "編輯精選",
    estimatedKid: "全年齡，遊戲場 2-8 歲最瘋",
    requiresReservation: false,
    address: "臺北市大安區新生南路二段1號",
  },
  {
    id: "poi_ikea",
    name: "IKEA 新莊店餐廳",
    category: "restaurant",
    district: "新莊區",
    ageMin: 1,
    ageMax: 12,
    durationMin: 60,
    priceMin: 100,
    priceMax: 350,
    description: "肉丸便宜、兒童餐 49 元、嬰兒副食品免費、店內附遊戲區。逛完家具還能讓孩子玩 30 分鐘。",
    tags: ["便宜", "嬰兒友善", "有遊戲區", "免訂位"],
    likes: 887,
    contributorName: "省錢媽媽",
    estimatedKid: "1 歲以上都可以",
    phone: "02-2276-5388",
    requiresReservation: false,
    address: "新北市新莊區中正路1號",
  },
  {
    id: "poi_meiliahua",
    name: "美麗華摩天輪 + 親子樓層",
    category: "amusement",
    district: "中山區",
    ageMin: 2,
    ageMax: 10,
    durationMin: 180,
    priceMin: 200,
    priceMax: 600,
    description: "摩天輪、5F 兒童遊樂區（百貨內）、各種親子餐廳。雨天備案完美。",
    tags: ["室內", "雨天備案", "停車方便", "餐廳多"],
    likes: 543,
    contributorName: "下雨救星",
    estimatedKid: "2 歲到 10 歲都有得玩",
    phone: "02-2175-3456",
    requiresReservation: false,
    address: "臺北市中山區敬業三路20號",
  },
  {
    id: "poi_yangmingshan",
    name: "陽明山國家公園 花鐘",
    category: "park",
    district: "北投區",
    ageMin: 3,
    ageMax: 99,
    durationMin: 180,
    priceMin: 0,
    priceMax: 300,
    description: "春季賞花首選、夏季避暑、秋季芒草、冬季泡湯。建議自駕，公車單程 40 分。",
    tags: ["戶外", "免費", "需開車", "季節限定"],
    likes: 1102,
    contributorName: "山系媽媽",
    estimatedKid: "3 歲以上能走，要帶推車輔助",
    phone: "02-2861-3601",
    requiresReservation: false,
    address: "臺北市北投區竹子湖路1-20號",
  },
  {
    id: "poi_neidong",
    name: "烏來內洞國家森林遊樂區",
    category: "park",
    district: "烏來區",
    ageMin: 4,
    ageMax: 99,
    durationMin: 240,
    priceMin: 80,
    priceMax: 200,
    description: "瀑布步道、超涼快。台北開車 1 小時。夏天首選。雨後步道濕滑要注意。",
    tags: ["戶外", "夏天首選", "需開車", "森林步道"],
    likes: 731,
    contributorName: "戶外控爸爸",
    estimatedKid: "4 歲以上能自己走完",
    phone: "02-2661-7341",
    requiresReservation: false,
    address: "新北市烏來區信賢路100號",
  },
  {
    id: "poi_loft",
    name: "樂活莊園親子餐廳",
    category: "restaurant",
    district: "內湖區",
    ageMin: 1,
    ageMax: 8,
    durationMin: 150,
    priceMin: 500,
    priceMax: 900,
    description: "獨棟建築、室內外遊戲區都有、餐點兒童菜單豐富。週末必須訂位。",
    tags: ["室內外", "需訂位", "餐點優", "有停車場"],
    likes: 612,
    contributorName: "Lulu 媽",
    estimatedKid: "1-8 歲都能放電",
    phone: "02-2792-3535",
    requiresReservation: true,
    address: "臺北市內湖區金湖路364巷5號",
  },
];

// 合併 12 hand + 60+ seed + 2500+ TDX = 2500+ POIs 全台覆蓋
// 注意: 此模組會被 chat client component import → bundle 略大 (~2.5MB)
//   v1.5 refactor: 改成 server-side query Supabase, client 只拿 visible POIs
export const pois: Poi[] = [...handCurated, ...seedPois, ...tdxPois];

export type Itinerary = {
  id: string;
  title: string;
  authorName: string;
  authorPoints: number;
  query: string;
  poiIds: string[];
  estimatedCost: number;
  likes: number;
  views: number;
  createdAt: string;
  tags: string[];
};

export const itineraries: Itinerary[] = [
  {
    id: "it_outdoor_sunny",
    title: "6 歲男孩戶外放電日",
    authorName: "Allen 爸",
    authorPoints: 1247,
    query: "6 歲男生 想戶外 預算 3000 不過夜",
    poiIds: ["poi_riverside", "poi_lab32", "poi_zoo_taipei"],
    estimatedCost: 2400,
    likes: 312,
    views: 4521,
    createdAt: "2 天前",
    tags: ["戶外", "晴天", "捷運可達"],
  },
  {
    id: "it_rainy_day",
    title: "下雨天救命行程 (3-5 歲)",
    authorName: "編輯精選",
    authorPoints: 9999,
    query: "下雨天 4 歲女生 室內 預算 2000",
    poiIds: ["poi_meiliahua", "poi_loft"],
    estimatedCost: 1800,
    likes: 487,
    views: 6730,
    createdAt: "1 週前",
    tags: ["室內", "雨天", "省錢"],
  },
  {
    id: "it_budget_zero",
    title: "0 元一日遊：純放電 + 自帶餐",
    authorName: "省錢媽媽",
    authorPoints: 887,
    query: "免費 1 日遊 帶 2 歲跟 5 歲",
    poiIds: ["poi_daanforest", "poi_riverside"],
    estimatedCost: 0,
    likes: 821,
    views: 12043,
    createdAt: "3 天前",
    tags: ["免費", "戶外", "野餐"],
  },
  {
    id: "it_education",
    title: "知性週末：小學生 7 歲 ",
    authorName: "工程師爸",
    authorPoints: 654,
    query: "7 歲 想學東西 室內 預算 1500",
    poiIds: ["poi_science", "poi_palace", "poi_lab32"],
    estimatedCost: 1450,
    likes: 189,
    views: 2341,
    createdAt: "5 天前",
    tags: ["教育", "室內", "學齡"],
  },
];

export function getPoi(id: string): Poi | undefined {
  return pois.find((p) => p.id === id);
}

export function getItinerary(id: string): Itinerary | undefined {
  return itineraries.find((i) => i.id === id);
}

export const topContributors = [
  { name: "編輯精選", points: 9999, badge: "🏆" },
  { name: "Allen 爸", points: 1247, badge: "🥇" },
  { name: "Lulu 媽", points: 1102, badge: "🥈" },
  { name: "省錢媽媽", points: 887, badge: "🥉" },
  { name: "戶外控爸爸", points: 731, badge: "" },
  { name: "媽媽 Vivian", points: 654, badge: "" },
];
