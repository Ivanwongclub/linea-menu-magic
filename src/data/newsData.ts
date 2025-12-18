export interface NewsItem {
  id: number;
  type: "exhibition" | "news";
  category: "industry" | "product" | "certification" | "partnership";
  title: string;
  subtitle: string;
  date: string;
  location: string;
  image: string;
  description: string;
  featured: boolean;
  content: string[];
  gallery?: string[];
}

export const newsItems: NewsItem[] = [
  {
    id: 1,
    type: "exhibition",
    category: "industry",
    title: "Première Vision Paris 2025",
    subtitle: "全球紡織面料展覽會",
    date: "2025年2月11-13日",
    location: "法國巴黎",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop",
    description: "WIN-CYC將於Première Vision Paris展示最新服裝輔料系列，誠邀業界同仁蒞臨參觀。",
    featured: true,
    content: [
      "WIN-CYC集團將於2025年2月11日至13日參展全球最具影響力的紡織面料展覽會——Première Vision Paris。作為服裝輔料行業的領導者，我們將在本屆展會上展示一系列創新產品及環保解決方案。",
      "本次參展的亮點包括：採用GRS認證再生材料製造的環保鈕扣系列、全新設計的金屬拉鏈產品線，以及專為高端時裝品牌定制的精緻配件。這些產品充分體現了WIN-CYC在品質與可持續發展方面的雙重承諾。",
      "我們誠摯邀請來自全球各地的設計師、採購商及行業夥伴蒞臨參觀。我們的專業團隊將為您詳細介紹每款產品的特點及應用，並提供個性化的定制方案建議。",
      "展會期間，我們還將舉辦一場關於「服裝輔料的可持續未來」的專題研討會，探討行業發展趨勢及環保創新實踐。歡迎業界同仁踴躍參加。"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop",
    ],
  },
  {
    id: 2,
    type: "news",
    category: "product",
    title: "WIN-CYC+ 數碼轉型計劃正式啟動",
    subtitle: "引領行業創新",
    date: "2024年12月",
    location: "香港",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&auto=format&fit=crop",
    description: "集團宣布啟動WIN-CYC+數碼轉型計劃，以Speed、Innovation、Digitalization為核心方向。",
    featured: true,
    content: [
      "WIN-CYC集團今日正式宣布啟動WIN-CYC+數碼轉型計劃，標誌著集團邁向智能化、數碼化發展的重要里程碑。此計劃以Speed（速度）、Innovation（創新）、Digitalization（數碼化）為三大核心方向，旨在全面提升客戶體驗及營運效率。",
      "WIN-CYC+計劃的首階段重點項目包括：全新設計師工作室平台（Designer Studio）的上線、智能庫存管理系統的部署，以及線上產品目錄的數碼化升級。這些舉措將為客戶提供更便捷、更高效的服務體驗。",
      "集團主席表示：「數碼轉型是WIN-CYC未來發展的核心策略。透過WIN-CYC+計劃，我們將更好地服務全球客戶，同時提升企業的競爭力及可持續發展能力。」",
      "WIN-CYC+計劃預計於未來兩年內分階段實施，涵蓋產品研發、生產製造、供應鏈管理及客戶服務等多個業務領域。"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=600&auto=format&fit=crop",
    ],
  },
  {
    id: 3,
    type: "exhibition",
    category: "industry",
    title: "Intertextile Shanghai 2025",
    subtitle: "中國國際紡織面料及輔料博覽會",
    date: "2025年3月",
    location: "中國上海",
    image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&auto=format&fit=crop",
    description: "展示環保可持續發展系列產品，體現匠心工藝與創新精神的完美結合。",
    featured: false,
    content: [
      "WIN-CYC將於2025年3月參展中國國際紡織面料及輔料博覽會（Intertextile Shanghai），這是亞洲地區最具規模的紡織行業盛會。",
      "本次參展將重點展示我們的環保可持續發展系列產品，包括採用再生材料製造的鈕扣、拉鏈及各類金屬配件。這些產品不僅符合國際環保標準，更體現了WIN-CYC在匠心工藝與創新精神方面的不懈追求。",
      "我們期待在展會期間與更多中國內地及亞太地區的客戶建立聯繫，共同探討合作機會。"
    ],
  },
  {
    id: 4,
    type: "news",
    category: "certification",
    title: "環保認證再獲殊榮",
    subtitle: "可持續發展里程碑",
    date: "2024年11月",
    location: "香港",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop",
    description: "WIN-CYC榮獲OEKO-TEX環保認證，進一步鞏固集團在可持續發展領域的領先地位。",
    featured: false,
    content: [
      "WIN-CYC集團欣然宣布，旗下主要產品線已順利通過OEKO-TEX Standard 100認證審核。這項國際認可的認證標準確保產品對人體健康無害，是紡織行業最具公信力的安全認證之一。",
      "此次認證涵蓋我們的金屬鈕扣、拉鏈及各類服裝輔料產品。通過嚴格的測試及審核程序，證明這些產品符合最高的環保及安全標準。",
      "OEKO-TEX認證的取得，進一步鞏固了WIN-CYC在可持續發展領域的領先地位，也體現了我們對產品品質及消費者安全的堅定承諾。"
    ],
  },
  {
    id: 5,
    type: "exhibition",
    category: "industry",
    title: "Hong Kong Fashion Week 2025",
    subtitle: "香港時裝週",
    date: "2025年1月",
    location: "香港會議展覽中心",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
    description: "與本地及國際設計師攜手合作，展現服裝輔料在時尚設計中的無限可能。",
    featured: false,
    content: [
      "WIN-CYC將於2025年1月參與香港時裝週，與本地及國際設計師攜手合作，展現服裝輔料在時尚設計中的無限可能。",
      "作為香港本土企業，我們一直積極支持本地時裝產業的發展。本次參展將展示一系列與設計師聯名創作的特別產品，包括限量版鈕扣系列及訂製金屬配件。",
      "我們期待透過這次展覽，讓更多人認識服裝輔料在時裝設計中的重要角色，以及WIN-CYC在這一領域的專業實力。"
    ],
  },
  {
    id: 6,
    type: "news",
    category: "product",
    title: "設計師工作室平台上線",
    subtitle: "數碼化服務升級",
    date: "2024年10月",
    location: "香港",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop",
    description: "全新Designer Studio平台正式上線，為設計師提供一站式數碼化產品瀏覽及報價服務。",
    featured: false,
    content: [
      "WIN-CYC集團今日宣布，全新設計師工作室平台（Designer Studio）正式上線。這是WIN-CYC+數碼轉型計劃的重要組成部分，旨在為設計師及品牌客戶提供更便捷、更高效的數碼化服務體驗。",
      "Designer Studio平台集成了產品瀏覽、3D模型預覽、樣品申請及報價管理等多項功能。用戶可以隨時隨地瀏覽我們的完整產品目錄，查看產品的詳細規格及技術參數，並直接提交報價請求。",
      "平台的3D模型預覽功能讓設計師能夠更直觀地了解產品的外觀及細節，大大提升了設計決策的效率。同時，智能報價系統能夠根據客戶需求快速生成準確的報價方案。",
      "我們相信，Designer Studio將成為設計師與WIN-CYC之間溝通協作的重要橋樑，推動整個行業向數碼化方向發展。"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&auto=format&fit=crop",
    ],
  },
  {
    id: 7,
    type: "news",
    category: "partnership",
    title: "與國際時裝品牌簽署戰略合作協議",
    subtitle: "全球業務拓展",
    date: "2024年9月",
    location: "香港",
    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&auto=format&fit=crop",
    description: "與多個國際知名時裝品牌建立長期戰略合作夥伴關係，進一步擴大全球業務版圖。",
    featured: false,
    content: [
      "WIN-CYC集團近日與多個國際知名時裝品牌簽署戰略合作協議，建立長期合作夥伴關係。這標誌著集團全球業務拓展策略的重要進展。",
      "根據協議，WIN-CYC將為這些品牌提供全面的服裝輔料供應及定制服務，涵蓋鈕扣、拉鏈、金屬配件及織帶等多個產品類別。",
      "集團表示，此次戰略合作是對WIN-CYC產品品質及服務能力的高度認可。我們將繼續以卓越的品質和創新的設計服務全球客戶，進一步鞏固在國際市場的領先地位。"
    ],
  },
  {
    id: 8,
    type: "news",
    category: "certification",
    title: "GRS認證審核順利通過",
    subtitle: "環保承諾",
    date: "2024年8月",
    location: "東莞",
    image: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&auto=format&fit=crop",
    description: "集團生產基地順利通過全球回收標準(GRS)年度審核，持續推動可持續發展。",
    featured: false,
    content: [
      "WIN-CYC集團位於東莞的生產基地近日順利通過全球回收標準（Global Recycled Standard, GRS）年度審核。這是集團連續第三年獲得GRS認證，彰顯了我們在可持續發展方面的持續努力及堅定承諾。",
      "GRS是全球最權威的再生材料認證標準之一，要求企業在整個供應鏈中實施嚴格的可追溯性管理。通過此項認證，證明WIN-CYC的產品符合國際環保標準，為客戶提供可信賴的環保解決方案。",
      "我們將繼續加大在環保材料研發及綠色生產方面的投入，為建設更可持續的時尚產業貢獻力量。"
    ],
  },
];

export const categoryOptions = [
  { key: "all" as const, label: "所有類別" },
  { key: "industry" as const, label: "行業動態" },
  { key: "product" as const, label: "產品發佈" },
  { key: "certification" as const, label: "認證資訊" },
  { key: "partnership" as const, label: "合作夥伴" },
];

export const filterOptions = [
  { key: "all" as const, label: "全部" },
  { key: "exhibition" as const, label: "展覽" },
  { key: "news" as const, label: "新聞" },
];