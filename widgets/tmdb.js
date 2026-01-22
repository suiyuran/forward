WidgetMetadata = {
  id: "suiyuran.forward.widgets.tmdb",
  title: "TMDB",
  description: "获取 TMDB 的榜单数据",
  requiredVersion: "0.0.1",
  version: "1.0.2",
  author: "suiyuran",
  site: "https://github.com/suiyuran/forward",
  modules: [
    {
      id: "nowPlaying",
      title: "正在热映",
      functionName: "nowPlaying",
      params: [
        {
          name: "type",
          title: "类型",
          type: "enumeration",
          enumOptions: [
            {
              title: "电影",
              value: "movie",
            },
            {
              title: "剧集",
              value: "tv",
            },
          ],
        },
        {
          name: "language",
          title: "语言",
          type: "language",
          value: "zh-CN",
        },
        {
          name: "page",
          title: "页码",
          type: "page",
        },
      ],
    },
    {
      id: "trending",
      title: "趋势",
      functionName: "trending",
      params: [
        {
          name: "timeWindow",
          title: "时间窗口",
          type: "enumeration",
          enumOptions: [
            {
              title: "今日",
              value: "day",
            },
            {
              title: "本周",
              value: "week",
            },
          ],
        },
        {
          name: "language",
          title: "语言",
          type: "language",
          value: "zh-CN",
        },
      ],
    },
    {
      id: "popular",
      title: "备受欢迎",
      functionName: "popular",
      params: [
        {
          name: "type",
          title: "类型",
          type: "enumeration",
          enumOptions: [
            {
              title: "电影",
              value: "movie",
            },
            {
              title: "剧集",
              value: "tv",
            },
          ],
        },
        {
          name: "language",
          title: "语言",
          type: "language",
          value: "zh-CN",
        },
        {
          name: "page",
          title: "页码",
          type: "page",
        },
      ],
    },
    {
      id: "topRated",
      title: "高分内容",
      functionName: "topRated",
      params: [
        {
          name: "type",
          title: "类型",
          type: "enumeration",
          enumOptions: [
            {
              title: "电影",
              value: "movie",
            },
            {
              title: "剧集",
              value: "tv",
            },
          ],
        },
        {
          name: "language",
          title: "语言",
          type: "language",
          value: "zh-CN",
        },
        {
          name: "page",
          title: "页码",
          type: "page",
        },
      ],
    },
    {
      id: "categories",
      title: "分类",
      functionName: "categories",
      params: [
        {
          name: "genreId",
          title: "分类",
          type: "enumeration",
          enumOptions: [
            {
              title: "动画",
              value: "16",
            },
            {
              title: "剧情",
              value: "18",
            },
            {
              title: "动作",
              value: "28",
            },
            {
              title: "喜剧",
              value: "35",
            },
            {
              title: "西部",
              value: "37",
            },
            {
              title: "惊悚",
              value: "53",
            },
            {
              title: "犯罪",
              value: "80",
            },
            {
              title: "纪录",
              value: "99",
            },
            {
              title: "科幻",
              value: "878",
            },
            {
              title: "悬疑",
              value: "9648",
            },
            {
              title: "合家欢",
              value: "10751",
            },
            {
              title: "儿童",
              value: "10762",
            },
            {
              title: "真人秀",
              value: "10764",
            },
          ],
        },
        {
          name: "type",
          title: "类型",
          type: "enumeration",
          belongTo: {
            paramName: "genreId",
            value: ["16", "18", "35", "37", "80", "99", "878", "9648", "10751"],
          },
          enumOptions: [
            {
              title: "电影",
              value: "movie",
            },
            {
              title: "剧集",
              value: "tv",
            },
          ],
        },
        {
          name: "originCountry",
          title: "国家",
          type: "input",
          belongTo: {
            paramName: "genreId",
            value: ["10764"],
          },
          placeholders: [
            {
              title: "中国",
              value: "CN",
            },
            {
              title: "日本",
              value: "JP",
            },
            {
              title: "韩国",
              value: "KR",
            },
            {
              title: "美国",
              value: "US",
            },
            {
              title: "英国",
              value: "GB",
            },
          ],
        },
        {
          name: "language",
          title: "语言",
          type: "language",
          value: "zh-CN",
        },
        {
          name: "page",
          title: "页码",
          type: "page",
        },
      ],
    },
    {
      id: "networks",
      title: "播出平台",
      functionName: "networks",
      params: [
        {
          name: "networkId",
          title: "播出平台",
          type: "input",
          placeholders: [
            {
              title: "Netflix",
              value: "213",
            },
            {
              title: "Hulu",
              value: "453",
            },
            {
              title: "Prime Video",
              value: "1024",
            },
            {
              title: "Apple TV+",
              value: "2552",
            },
            {
              title: "Disney+",
              value: "2739",
            },
            {
              title: "HBO Max",
              value: "3186",
            },
            {
              title: "Paramount+",
              value: "4330",
            },
          ],
        },
        {
          name: "language",
          title: "语言",
          type: "language",
          value: "zh-CN",
        },
        {
          name: "page",
          title: "页码",
          type: "page",
        },
      ],
    },
    {
      id: "companies",
      title: "出品公司",
      functionName: "companies",
      params: [
        {
          name: "companyId",
          title: "出品公司",
          type: "enumeration",
          enumOptions: [
            {
              title: "Disney",
              value: "2",
            },
            {
              title: "Paramount",
              value: "4",
            },
            {
              title: "Columbia",
              value: "5",
            },
            {
              title: "20th Century",
              value: "25",
            },
            {
              title: "Universal",
              value: "33",
            },
            {
              title: "Sony",
              value: "34",
            },
            {
              title: "Warner Bros",
              value: "174",
            },
            {
              title: "Marvel",
              value: "420",
            },
          ],
        },
        {
          name: "type",
          title: "类型",
          type: "enumeration",
          enumOptions: [
            {
              title: "电影",
              value: "movie",
            },
            {
              title: "剧集",
              value: "tv",
            },
          ],
        },
        {
          name: "language",
          title: "语言",
          type: "language",
          value: "zh-CN",
        },
        {
          name: "page",
          title: "页码",
          type: "page",
        },
      ],
    },
  ],
};

const TMDB_GENRE_MAPPING = {
  12: "冒险",
  14: "奇幻",
  16: "动画",
  18: "剧情",
  27: "恐怖",
  28: "动作",
  35: "喜剧",
  36: "历史",
  37: "西部",
  53: "惊悚",
  80: "犯罪",
  99: "纪录",
  878: "科幻",
  9648: "悬疑",
  10402: "音乐",
  10749: "爱情",
  10751: "家庭",
  10752: "战争",
  10759: "动作冒险",
  10762: "儿童",
  10763: "新闻",
  10764: "真人秀",
  10765: "Sci-Fi & Fantasy",
  10766: "肥皂剧",
  10767: "脱口秀",
  10768: "War & Politics",
  10770: "电视电影",
};

function generateGenreTitle(genreIds) {
  return genreIds
    .map((id) => TMDB_GENRE_MAPPING[id])
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
}

function isAvailableTMDBResult(result) {
  return result.id && result.title && result.releaseDate && result.posterPath && result.mediaType && !result.adult;
}

async function getTMDBResults(api, params, type = "") {
  try {
    const data = await Widget.tmdb.get(api, { params });
    const results = data.results.map((result) => {
      return {
        id: result.id,
        type: "tmdb",
        title: result.title || result.name || "",
        originalTitle: result.original_title || result.original_name || "",
        description: (result.overview || "").trim(),
        releaseDate: result.release_date || result.first_air_date || "",
        backdropPath: result.backdrop_path,
        posterPath: result.poster_path,
        rating: result.vote_average || 0,
        mediaType: result.media_type || type || "",
        genreTitle: generateGenreTitle(result.genre_ids || []),
        adult: result.adult || false,
      };
    });
    return results.filter((result) => !(type && result.mediaType !== type) && isAvailableTMDBResult(result));
  } catch (error) {
    console.error("获取 TMDB 结果失败:", error);
    return [];
  }
}

async function nowPlaying(params) {
  const { type, language, page } = params;
  const api = type === "movie" ? "movie/now_playing" : "tv/on_the_air";
  return await getTMDBResults(api, { language, page }, type);
}

async function trending(params) {
  const { timeWindow, language } = params;
  const api = `trending/all/${timeWindow}`;
  return await getTMDBResults(api, { language });
}

async function popular(params) {
  const { type, language, page } = params;
  const api = `${type}/popular`;
  return await getTMDBResults(api, { language, page }, type);
}

async function topRated(params) {
  const { type, language, page } = params;
  const api = `${type}/top_rated`;
  return await getTMDBResults(api, { language, page }, type);
}

async function categories(params) {
  const { originCountry, language, page } = params;
  let { genreId, type } = params;

  const onlyMovieGenreIds = ["28", "53"]; // 动作，惊悚
  const onlyTVGenreIds = ["10762", "10764", "10766"]; // 儿童，真人秀，肥皂剧

  // 科幻
  if (genreId == "878" && type == "tv") {
    genreId = "10765"; // Sci-Fi & Fantasy
  }
  if (onlyMovieGenreIds.includes(genreId)) {
    type = "movie";
  }
  if (onlyTVGenreIds.includes(genreId)) {
    type = "tv";
  }
  const api = `discover/${type}`;
  return await getTMDBResults(api, { with_genres: genreId, with_origin_country: originCountry, language, page }, type);
}

async function networks(params) {
  const { networkId, language, page } = params;
  const api = "discover/tv";
  return await getTMDBResults(api, { with_networks: networkId, language, page }, "tv");
}

async function companies(params) {
  const { companyId, type, language, page } = params;
  const api = `discover/${type}`;
  return await getTMDBResults(api, { with_companies: companyId, language, page }, type);
}
