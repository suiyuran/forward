WidgetMetadata = {
  id: "suiyuran.forward.widgets.vod.dytt",
  title: "电影天堂",
  description: "获取电影天堂VOD资源",
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

const BASE_URL = "http://caiji.dyttzyapi.com/api.php/provide/vod/from/dyttm3u8/at/json";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36";

function numberToChinese(num) {
  const units = ["", "十", "百", "千", "万", "亿"];
  const chars = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

  if (num === "0") return chars[0];
  let str = "";

  for (let i = 0; i < num.length; i++) {
    const n = Number(num[i]);
    const unit = units[num.length - 1 - i];

    if (n === 0) {
      if (!str.endsWith(chars[0]) && i !== num.length - 1) str += chars[0];
    } else {
      str += chars[n] + unit;
    }
  }

  return str.replace(/^一十/, "十").replace(/零+$/, "").replace(/零+/g, "零");
}

function resolveResource(resource) {
  return {
    title: resource.vod_name,
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

async function getSeriesNameMap() {
  try {
    const url = "https://dirs.deno.dev/forward/data/series-name-map.json";
    return (await Widget.http.get(url)).data;
  } catch (error) {
    console.error("获取剧集名称映射表失败: ", error.message);
    return {};
  }
}

async function search(keyword, page = 1) {
  try {
    const response = await Widget.http.get(BASE_URL, {
      params: { ac: "detail", wd: keyword, pg: page },
      timeout: 10000,
    });

    if (response.data.code === 1 && response.data.list.length > 0) {
      const resources = response.data.list;

      if (page < response.data.pagecount) {
        resources.push(...(await search(keyword, page + 1)));
      }
      return resources;
    }
    return [];
  } catch (error) {
    console.error("搜索电影天堂 VOD 资源失败: ", error.message);
    return [];
  }
}

async function getIMDBIdByDoubanId(doubanId) {
  try {
    const url = `https://www.douban.com/doubanapp/h5/movie/${doubanId}/desc`;
    const headers = {
      "User-Agent": UA,
      "Referer": `https://m.douban.com/movie/subject/${doubanId}/`,
    };
    const response = await Widget.http.get(url, { headers, timeout: 10000 });
    const match = response.data.match(/(tt\d+)/);

    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.error("通过豆瓣 ID 获取 IMDB ID 失败: ", error.message);
    return null;
  }
}

async function loadResource(params) {
  const { imdbId, seriesName, type, season } = params;
  const seriesNameMap = await getSeriesNameMap();
  const title = (seriesNameMap[seriesName] || seriesName).replaceAll("？", "");

  try {
    let resource = null;
    const searchedResults = await search(title);
    const resources = searchedResults.map((item) => resolveResource(item));
    const sameTypeResources = resources.filter((res) => res.type === type && !res.genre.includes("短剧"));
    const sameTitleResources = sameTypeResources.filter((res) => res.title === title);

    if (sameTitleResources.length === 1) {
      resource = sameTitleResources[0];
    } else if (sameTitleResources.length > 1) {
      if (imdbId) {
        for (const res of sameTitleResources) {
          const id = await getIMDBIdByDoubanId(res.doubanId);

          if (id && id === imdbId) {
            resource = res;
            break;
          }
        }
      } else {
        resource = sameTitleResources[0];
      }
    } else if (type === "tv" && season) {
      const seasonChinese = numberToChinese(season);
      const seasonTitle = `第${seasonChinese}季`;
      const seasonResource = sameTypeResources.find((res) => res.title === `${title}${seasonTitle}`);

      if (seasonResource) {
        resource = seasonResource;
      }
    } else if (imdbId && title.length > 2) {
      const prefix = title.slice(0, 3);
      const samePrefixResources = sameTypeResources.filter((res) => res.title.startsWith(prefix));

      for (const res of samePrefixResources) {
        const id = await getIMDBIdByDoubanId(res.doubanId);

        if (id && id === imdbId) {
          resource = res;
          break;
        }
      }
    }

    if (resource) {
      return resource.episodes.map((ep) => {
        const name = ep.title.replace("HD", "");
        const description = [resource.title, "-----", resource.description, "-----", "1080p|aac"].join("\n");
        return { name, description, url: ep.url };
      });
    }
    return [];
  } catch (error) {
    console.error("加载电影天堂 VOD 资源失败: ", error.message);
    return [];
  }
}
