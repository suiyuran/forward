WidgetMetadata = {
  id: "suiyuran.forward.widgets.vod.ffzy",
  title: "非凡影视",
  description: "获取非凡影视的VOD资源",
  requiredVersion: "0.0.1",
  version: "1.0.2",
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

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36";
const URL = "https://api.ffzyapi.com/api.php/provide/vod/from/ffm3u8/at/json/";

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
  const desc = await getDoubanDesc(doubanId);
  const match = desc.match(/(tt\d+)/);

  if (match && match[1]) {
    return match[1];
  }
  return "";
}

async function isAnime(doubanId) {
  const desc = await getDoubanDesc(doubanId);
  return desc.includes("动画") && desc.includes("日本");
}

async function getIMDBIdByTMDBId(tmdbId, season) {
  try {
    const url = `tv/${tmdbId}/season/${season}/episode/1/external_ids`;
    return (await Widget.tmdb.get(url)).imdb_id || "";
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

async function searchResource(title, imdbId, type, season) {
  const titles = splitTitle(title);
  const searchedResults = await search(titles[0]);
  const resources = searchedResults.map((item) => transformResource(item)).filter((res) => !res.genre.includes("短剧"));
  const sameTypeResources = resources.filter((res) => res.type === type);
  const titleToMatch = isSimpleMatch(type, season) ? title : `${title}第${chineseNumber(season)}季`;
  const sameNameResources = sameTypeResources.filter((res) => res.title === titleToMatch);
  const similarResources = sameTypeResources.filter((res) => isSimilarResource(title, titles, res));
  const allResources = [...sameNameResources, ...similarResources];

  let resource = null;

  for (const res of allResources) {
    const resIMDBId = await getIMDBIdByDoubanId(res.doubanId);

    if (resIMDBId && resIMDBId === imdbId) {
      resource = res;
      break;
    }
  }

  if (!resource && sameNameResources.length === 1) {
    const anime = await isAnime(sameNameResources[0].doubanId);

    if (anime) {
      resource = sameNameResources[0];
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

function isSimpleMatch(type, season) {
  return type === "movie" || (type === "tv" && season === "1");
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

async function handleTitle(seriesName) {
  const titleMapping = await getTitleMapping();
  const title = titleMapping[seriesName] || seriesName;
  return title.replaceAll("？", "");
}

async function handleIMDBId(tmdbId, imdbId, type, season) {
  if (isSimpleMatch(type, season)) {
    return imdbId;
  }
  return await getIMDBIdByTMDBId(tmdbId, season);
}

function splitTitle(title) {
  return title
    .replace("剧场版", "")
    .replaceAll("：", " ")
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t !== "");
}

function resolveResource(resource) {
  return resource.episodes.map((ep) => {
    const name = ep.title.replace("HD", "") || "正片";
    const description = [resource.title, "-----", resource.description || "暂无简介", "-----", "1080p|aac"].join("\n");
    return { name, description, url: ep.url };
  });
}

async function loadResource(params) {
  const { seriesName, tmdbId, type, season, episode } = params;

  try {
    const title = await handleTitle(seriesName);
    const imdbId = await handleIMDBId(tmdbId, params.imdbId, type, season);

    if (imdbId) {
      const resource = await searchResource(title, imdbId, type, season);

      if (resource) {
        const results = resolveResource(resource);

        if (type === "tv" && episode) {
          const index = parseInt(episode) - 1;
          return results.slice(index, index + 1);
        }
        return results;
      }
    }
    return [];
  } catch (error) {
    console.error("加载资源失败: ", error.message);
    return [];
  }
}
