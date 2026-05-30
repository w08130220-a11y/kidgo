// Shared types for TDX scraping + enrichment pipeline

export type TdxRawPoi = {
  ScenicSpotID?: string;
  RestaurantID?: string;
  ScenicSpotName?: string;
  RestaurantName?: string;
  DescriptionDetail?: string;
  Description?: string;
  Address?: string;
  Phone?: string;
  OpenTime?: string;
  PositionLat?: number;
  PositionLon?: number;
  Position?: { PositionLat: number; PositionLon: number };
  Picture?: { PictureUrl1?: string; PictureUrl2?: string; PictureUrl3?: string };
  Class1?: string;
  Class2?: string;
  Class3?: string;
  City: string;
  TdxCityCode: string;
  // 我們自加的: 'scenicSpot' or 'restaurant'
  _sourceType: "scenicSpot" | "restaurant";
};

export type EnrichedPoi = {
  id: string;                      // tdx_{type}_{originalId}
  name: string;
  category: "park" | "museum" | "restaurant" | "zoo" | "amusement" | "indoor";
  district: string;                // 從 address 解析出
  city: string;                    // 縣市
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  openTime?: string;
  description: string;
  photos: string[];                // [url, url, url]
  // AI 推論的親子欄位
  ageMin: number;
  ageMax: number;
  durationMin: number;             // 建議停留分鐘
  priceMin: number;
  priceMax: number;
  parentingTags: string[];         // ["推車友善", "雨備", "捷運可達", ...]
  kidScore: number;                // 0-10, 親子友善程度
  aiReasoning: string;             // AI 解釋為什麼這樣分類 (debug 用)
  // Source tracking
  source: "tdx";
  sourceId: string;                // ScenicSpotID / RestaurantID
  enrichedAt: string;              // ISO timestamp
};

// TDX 22 縣市對應碼 (TDX 官方規範)
export const TDX_CITIES: { code: string; name: string }[] = [
  { code: "Taipei", name: "臺北市" },
  { code: "NewTaipei", name: "新北市" },
  { code: "Taoyuan", name: "桃園市" },
  { code: "Taichung", name: "臺中市" },
  { code: "Tainan", name: "臺南市" },
  { code: "Kaohsiung", name: "高雄市" },
  { code: "Keelung", name: "基隆市" },
  { code: "HsinchuCity", name: "新竹市" },
  { code: "HsinchuCounty", name: "新竹縣" },
  { code: "MiaoliCounty", name: "苗栗縣" },
  { code: "ChanghuaCounty", name: "彰化縣" },
  { code: "NantouCounty", name: "南投縣" },
  { code: "YunlinCounty", name: "雲林縣" },
  { code: "ChiayiCity", name: "嘉義市" },
  { code: "ChiayiCounty", name: "嘉義縣" },
  { code: "PingtungCounty", name: "屏東縣" },
  { code: "YilanCounty", name: "宜蘭縣" },
  { code: "HualienCounty", name: "花蓮縣" },
  { code: "TaitungCounty", name: "臺東縣" },
  { code: "PenghuCounty", name: "澎湖縣" },
  { code: "KinmenCounty", name: "金門縣" },
  { code: "LienchiangCounty", name: "連江縣" },
];
