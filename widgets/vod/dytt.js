WidgetMetadata = {
  id: "suiyuran.forward.widgets.vod.dytt",
  title: "电影天堂",
  description: "获取电影天堂的 VOD 资源",
  requiredVersion: "0.0.1",
  version: "1.0.9",
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

const URL = "http://caiji.dyttzyapi.com/api.php/provide/vod/from/dyttm3u8/at/json/";

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const CACHE_DURATION = 24 * 60 * 60 * 1000;

async function getIdMapping() {
  try {
    const url = "https://raw.githubusercontent.com/suiyuran/forward/main/data/id-mapping.json";
    return (await Widget.http.get(url)).data;
  } catch (error) {
    console.error("获取 ID 映射失败: ", error.message);
    return {};
  }
}

async function getTitleMapping() {
  try {
    const url = "https://raw.githubusercontent.com/suiyuran/forward/main/data/title-mapping.json";
    return (await Widget.http.get(url)).data;
  } catch (error) {
    console.error("获取标题映射失败: ", error.message);
    return {};
  }
}

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
  const idMapping = await getIdMapping();
  const key = `douban.${doubanId}`;

  if (idMapping[key]) {
    return idMapping[key];
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
    const idMapping = await getIdMapping();
    const key = type === "movie" ? `tmdb.${tmdbId}` : `tmdb.${tmdbId}.${season}`;
    return idMapping[key] || "";
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
  };
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

async function handleTitle(tmdbId, title) {
  const titleMapping = await getTitleMapping();
  return shakeTitle(titleMapping[title] || titleMapping[`${title}(${tmdbId})`] || title);
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
  return resource.episodes.map((ep) => {
    const name = ep.title.replace("HD", "") || "正片";
    const info = resource.description || "暂无简介";
    const quality = "1080p|aac";
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
  const newTitle = await handleTitle(tmdbId, title);
  const newIMDBId = await handleIMDBId(tmdbId, imdbId, type, season);
  const seasonInfo = type === "movie" ? "" : `第${chineseNumber(season)}季`;
  const seasonTitle = !seasonInfo ? "" : await handleTitle(tmdbId, `${newTitle}${seasonInfo}`);
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
