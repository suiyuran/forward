WidgetMetadata = {
  id: "suiyuran.forward.widgets.vod.ffzy",
  title: "非凡影视",
  description: "获取非凡影视的 VOD 资源",
  requiredVersion: "0.0.1",
  version: "1.1.2",
  author: "suiyuran",
  site: "https://github.com/suiyuran/forward",
  modules: [
    {
      id: "loadResource",
      title: "加载资源",
      functionName: "loadResource",
      type: "stream",
      params: [],
    },
  ],
};

const URL = "http://api.ffzyapi.com/api.php/provide/vod/from/ffm3u8/at/json/";

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const CACHE_DURATION = 24 * 60 * 60 * 1000;

const ID_MAPPING = {
  "douban.35256195": "tt13616990",
  "douban.35235299": "tt22849940",
  "douban.35384171": "tt32768662",
  "douban.35369738": "tt33309379",
  "douban.30148171": "tt17374402",
  "douban.26909783": "ttunknown1",
  "douban.30358150": "ttunknown2",
  "douban.35133009": "ttunknown3",
  "tmdb.73982.2": "tt34607653",
  "tmdb.280063.1": "tt36856011",
  "tmdb.222186.1": "tt27137480",
  "tmdb.133988.1": "tt15499950",
  "tmdb.290886.1": "tt37162158",
  "tmdb.282905.1": "tt34131978",
  "tmdb.225109.1": "tt27553770",
  "tmdb.219204.1": "tt26390155",
  "tmdb.216170.1": "tt32768662",
  "tmdb.209133.1": "tt34192102",
  "tmdb.207108.1": "tt22007364",
  "tmdb.206251.1": "tt27679933",
  "tmdb.203581.1": "tt28776716",
  "tmdb.152550.1": "tt20724996",
  "tmdb.157673.1": "tt33309379",
  "tmdb.136681.1": "tt17374402",
  "tmdb.132371.1": "tt30459889",
  "tmdb.129417.1": "tt15175228",
  "tmdb.132043.1": "ttunknown1",
  "tmdb.127896.1": "ttunknown2",
  "tmdb.126276.1": "ttunknown3",
  "tmdb.112573.2": "tt32385900",
};

const TITLE_MAPPING = {
  "Stranger Things": "怪奇物语",
  "Wednesday": "星期三",
  "Love, Death & Robots": "爱，死亡和机器人",
  "Adolescence": "混沌少年时",
  "Andor": "安多",
  "WandaVision": "旺达幻视",
  "Star Wars: The Bad Batch": "星球大战：异等小队",
  "Pluribus": "同乐者",
  "Slow Horses": "流人",
  "Severance": "人生切割术",
  "Foundation": "基地",
  "Percy Jackson and the Olympians": "波西·杰克逊",
  "Shōgun": "幕府将军",
  "The Kardashians": "卡戴珊家族",
  "Top Gun: Maverick": "壮志凌云2：独行侠",
  "Spider-Man: No Way Home": "蜘蛛侠：英雄无归",
  "纸房子": "纸钞屋",
  "纸房子：柏林": "纸钞屋：柏林",
  "纸房子：韩国篇": "纸钞屋(韩版)",
  "航海王": "海贼王",
  "チェンソーマン": "电锯人",
  "大话西游之仙履奇缘": "大话西游之大圣娶亲",
  "白夜追凶第二季": "白夜破晓",
  "七号房的礼物(158445)": "7号房的礼物",
  "色·戒": "色，戒",
  "玛丽和麦克斯": "玛丽和马克思",
  "命运／奇异赝品": "命运/奇异赝品",
  "判处勇者刑 刑罚勇者9004队服刑记录": "判处勇者刑",
  "First Love 初恋": "初恋",
  "毒雪纷飞": "白粉飞",
};

async function search(keyword, page = 1) {
  try {
    const params = { ac: "detail", wd: keyword, pg: page };
    const response = await Widget.http.get(URL, { params, timeout: 10000 });

    if (response.data.code === 1 && response.data.list.length > 0) {
      const results = response.data.list;

      if (page < response.data.pagecount) {
        results.push(...(await search(keyword, page + 1)));
      }
      return results;
    }
    return [];
  } catch (error) {
    console.error("搜索资源失败: ", error.message);
    return [];
  }
}

async function getDoubanDesc(doubanId) {
  try {
    const url = `https://www.douban.com/doubanapp/h5/movie/${doubanId}/desc`;
    const headers = {
      "User-Agent": UA,
      "Referer": `https://m.douban.com/movie/subject/${doubanId}/`,
    };
    return (await Widget.http.get(url, { headers, timeout: 10000 })).data;
  } catch (error) {
    console.error("通过豆瓣 ID 获取豆瓣详情失败: ", error.message);
    return "";
  }
}

async function getIMDBIdByDoubanId(doubanId) {
  const key = `douban.${doubanId}`;

  if (ID_MAPPING[key]) {
    return ID_MAPPING[key];
  }
  const desc = await getDoubanDesc(doubanId);
  const match = desc.match(/(tt\d+)/);

  if (match && match[1]) {
    return match[1];
  }
  return "";
}

async function animeOnDouban(doubanId) {
  const desc = await getDoubanDesc(doubanId);
  return desc.includes("动画") && desc.includes("日本");
}

async function getTMDBDetails(type, tmdbId) {
  try {
    const url = `${type}/${tmdbId}?language=zh-CN`;
    return await Widget.tmdb.get(url);
  } catch (error) {
    console.error("通过 TMDB ID 获取 TMDB 详情失败: ", error.message);
    return null;
  }
}

async function animeOnTMDB(type, tmdbId) {
  const details = await getTMDBDetails(type, tmdbId);

  if (details) {
    const genres = details.genres.map((g) => g.name);
    const countries = details.production_countries.map((c) => c.name);
    return genres.includes("动画") && countries.includes("Japan");
  }
  return false;
}

async function getSeasonEpisodeCount(tmdbId, seasonNumber) {
  const details = await getTMDBDetails("tv", tmdbId);

  if (details) {
    const season = details.seasons.find((s) => s.season_number === seasonNumber);

    if (season) {
      return season.episode_count;
    }
  }
  return 0;
}

async function getIMDBIdByTMDBId(tmdbId, type, season) {
  try {
    const episode = type === "movie" || (type === "tv" && season === "1") ? "" : `/season/${season}/episode/1`;
    const url = `${type}/${tmdbId}${episode}/external_ids`;
    const ids = await Widget.tmdb.get(url);

    if (ids && ids.imdb_id) {
      return ids.imdb_id;
    }
    const key = type === "movie" ? `tmdb.${tmdbId}` : `tmdb.${tmdbId}.${season}`;
    return ID_MAPPING[key] || "";
  } catch (error) {
    console.error("通过 TMDB ID 获取 IMDB ID 失败: ", error.message);
    return "";
  }
}

function transformResource(resource) {
  return {
    title: resource.vod_name,
    subtitle: resource.vod_sub,
    description: resource.vod_content.replaceAll(/<.*?\/?>|\s+/g, "").trim(),
    genre: resource.vod_class,
    type: resource.vod_play_url.includes("集") ? "tv" : "movie",
    doubanId: resource.vod_douban_id,
    episodes: resource.vod_play_url
      .split("#")
      .filter((item) => item.trim() !== "")
      .map((item) => {
        const infos = item.split("$");
        return { title: infos[0], url: infos[1] };
      }),
    resolutions: [],
  };
}

async function getResourceResolution(url) {
  try {
    const response = await Widget.http.get(url, { timeout: 10000 });
    const match = response.data.match(/RESOLUTION=((\d+)x\d+)/);

    if (match) {
      const resolution = match[1];
      const width = match[2];

      if (width >= 1920 || resolution === "1080x608") {
        return "1080p";
      }
    }
    return "720p";
  } catch (error) {
    console.error("获取资源分辨率失败: ", error.message);
    return "720p";
  }
}

async function searchResource(title, tmdbId, imdbId, type, season, seasonTitle) {
  const titles = splitTitle(title);
  const searchedResults = await search(titles[0]);
  const results = searchedResults.map((item) => transformResource(item));
  const resources = results.filter((res) => res.type === type && !res.genre.includes("短剧"));
  const sameNameResources = resources.filter((res) => isSameNameResource(title, type, season, seasonTitle, res));
  const similarResources = resources.filter((res) => isSimilarResource(title, titles, res));
  const allResources = [...sameNameResources, ...similarResources];

  let resource = null;

  if (imdbId) {
    for (const res of allResources) {
      if (res.doubanId) {
        const resIMDBId = await getIMDBIdByDoubanId(res.doubanId);

        if (resIMDBId && resIMDBId === imdbId) {
          resource = res;
          break;
        }
      }
    }
  }
  if (!resource && sameNameResources.length === 1) {
    const onlyResource = sameNameResources[0];

    if (onlyResource.doubanId) {
      const isAnimeOnTMDB = await animeOnTMDB(type, tmdbId);

      if (isAnimeOnTMDB) {
        const isAnimeOnDouban = await animeOnDouban(onlyResource.doubanId);

        if (isAnimeOnDouban) {
          resource = onlyResource;
        }
      }
    }
  }
  if (!resource && seasonTitle) {
    return await searchResource(seasonTitle, tmdbId, imdbId, type, "1", "");
  }
  if (resource) {
    const urls = resource.episodes.map((ep) => ep.url);

    if (type === "movie") {
      resource.resolutions = await Promise.all(urls.map(getResourceResolution));
    } else {
      const resolution = await getResourceResolution(urls[0]);
      resource.resolutions = [resolution];
    }
  }
  return resource;
}

function chineseNumber(numberStr) {
  const chars = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const units = ["", "十"];

  if (numberStr === "0") return chars[0];
  if (numberStr === "1") return chars[1];
  let result = "";

  for (let i = 0; i < numberStr.length; i++) {
    const num = parseInt(numberStr[i]);
    if (num !== 0) {
      result += chars[num] + units[numberStr.length - i - 1];
    } else {
      result += chars[num];
    }
  }
  return result.replaceAll(/^一|零$/g, "");
}

function isSameNameResource(title, type, season, seasonTitle, resource) {
  const resourceTitle = shakeTitle(resource.title);
  const resourceCompactTitle = trimTitle(resourceTitle);
  const compactTitle = trimTitle(title);

  if (type === "movie") {
    return resourceTitle === title || resourceCompactTitle === compactTitle;
  }
  if (type === "tv") {
    const compactSeasonTitle = trimTitle(seasonTitle);

    if (season === "1") {
      return (
        resourceTitle === title ||
        resourceCompactTitle === compactTitle ||
        resourceTitle === seasonTitle ||
        resourceCompactTitle === compactSeasonTitle
      );
    }
    return resourceTitle === seasonTitle || resourceCompactTitle === compactSeasonTitle;
  }
  return false;
}

function isSimilar(title, titles) {
  return titles.map((t) => title.includes(t)).filter(Boolean).length > 1;
}

function isSimilarResource(title, titles, resource) {
  return (
    resource.subtitle.includes(title) ||
    resource.title.startsWith(title) ||
    isSimilar(resource.title, titles) ||
    isSimilar(resource.subtitle, titles)
  );
}

function handleTitle(tmdbId, title) {
  return shakeTitle(TITLE_MAPPING[title] || TITLE_MAPPING[`${title}(${tmdbId})`] || title);
}

async function handleIMDBId(tmdbId, imdbId, type, season) {
  if (imdbId && (type === "movie" || (type === "tv" && season === "1"))) {
    return imdbId;
  }
  return await getIMDBIdByTMDBId(tmdbId, type, season);
}

function trimTitle(title) {
  return title.replaceAll(/\s/g, "");
}

function shakeTitle(title) {
  return title
    .replace(/^【/, "")
    .replace(/】$/, "")
    .replaceAll("剧场版", "")
    .replaceAll(/（.+）/g, "")
    .replaceAll(/[。！？]+$/g, "")
    .trim();
}

function splitTitle(title) {
  if (/^[a-zA-Z0-9\s]+$/.test(title)) {
    return [title];
  }
  return title
    .replaceAll(/：|:/g, " ")
    .split(" ")
    .map((t, i) => {
      const nt = t.trim();
      if (i === 0 && !/^\d+$/.test(nt)) {
        return nt.replaceAll(/\d+$/g, "");
      }
      return nt;
    })
    .filter((t) => t !== "");
}

function resolveResource(resource) {
  return resource.episodes.map((ep, index) => {
    const name = ep.title.replace("HD", "") || "正片";
    const info = resource.description || "暂无简介";
    const resolution = resource.resolutions[index] || resource.resolutions[0] || "720p";
    const quality = `${resolution}|aac`;
    const description = [resource.title, "-----", info, "-----", quality].join("\n");
    return { name, description, url: ep.url };
  });
}

function generateCacheKey(type, tmdbId, season) {
  return `${WidgetMetadata.id}.${type}.${tmdbId}.${season}`;
}

async function getCacheValue(key) {
  const cacheValue = await Widget.storage.get(key);

  if (cacheValue) {
    const data = JSON.parse(cacheValue);
    const currentTime = Date.now();
    if (currentTime - data.time < CACHE_DURATION) {
      return data.data;
    }
    await Widget.storage.remove(key);
  }
  return null;
}

async function setCacheValue(key, value) {
  const time = Date.now();
  const data = { time, data: value };
  await Widget.storage.set(key, JSON.stringify(data));
}

async function searchResourceWithCache(title, tmdbId, imdbId, type, season) {
  const cacheKey = generateCacheKey(type, tmdbId, season);
  const cache = await getCacheValue(cacheKey);

  if (cache) {
    return cache;
  }
  if (type === "tv" && season) {
    const seasonNumber = parseInt(season);

    if (seasonNumber > 1) {
      const seasonOneCacheKey = generateCacheKey(type, tmdbId, "1");
      const seasonOneCache = await getCacheValue(seasonOneCacheKey);

      if (seasonOneCache) {
        const episodesLength = seasonOneCache.episodes.length;
        const episodeCount = await getSeasonEpisodeCount(tmdbId, 1);

        if (episodeCount > 0 && episodesLength > episodeCount) {
          await setCacheValue(cacheKey, seasonOneCache);
          return seasonOneCache;
        }
      }
    }
  }
  const newTitle = handleTitle(tmdbId, title);
  const newIMDBId = await handleIMDBId(tmdbId, imdbId, type, season);
  const seasonInfo = type === "movie" ? "" : `第${chineseNumber(season)}季`;
  const seasonTitle = !seasonInfo ? "" : handleTitle(tmdbId, `${newTitle}${seasonInfo}`);
  const resource = await searchResource(newTitle, tmdbId, newIMDBId, type, season, seasonTitle);

  if (resource) {
    await setCacheValue(cacheKey, resource);
    return resource;
  }
  return null;
}

async function loadResource(params) {
  const { seriesName, tmdbId, imdbId, type, season, episode } = params;

  try {
    const resource = await searchResourceWithCache(seriesName, tmdbId, imdbId, type, season);

    if (resource) {
      const results = resolveResource(resource);

      if (type === "tv" && episode) {
        const index = parseInt(episode) - 1;
        return results.slice(index, index + 1);
      }
      return results;
    }
    return [];
  } catch (error) {
    console.error("加载资源失败: ", error.message);
    return [];
  }
}
