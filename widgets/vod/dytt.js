WidgetMetadata = {
  id: "suiyuran.forward.widgets.vod.dytt",
  title: "电影天堂",
  description: "获取电影天堂VOD资源",
  requiredVersion: "0.0.1",
  version: "1.0.0",
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

function resolveResource(resource) {
  return {
    title: resource.vod_name,
    type: resource.vod_play_url.includes("集") ? "tv" : "movie",
    episodes: resource.vod_play_url
      .split("#")
      .filter((item) => item.trim() !== "")
      .map((item) => {
        const infos = item.split("$");
        return { title: infos[0], url: infos[1] };
      }),
  };
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
    console.error("搜索电影天堂VOD资源失败: ", error.message);
    return [];
  }
}

async function loadResource(params) {
  const { type, seriesName } = params;

  if (type === "tv") {
    return [];
  }

  try {
    const searchedResources = await search(seriesName);
    const resources = searchedResources.map((item) => resolveResource(item));
    const resource = resources.find((res) => {
      return res.type === type && res.title === seriesName;
    });

    if (resource) {
      return resource.episodes.map((ep) => {
        const name = ep.title.replace("HD", "");
        const description = [resource.title, "-----", "1080p"].join("\n");
        const url = ep.url;
        return { name, description, url };
      });
    }
    return [];
  } catch (error) {
    console.error("加载电影天堂VOD资源失败: ", error.message);
    return [];
  }
}
