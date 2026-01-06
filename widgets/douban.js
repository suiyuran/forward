WidgetMetadata = {
  id: "suiyuran.forward.widgets.douban",
  title: "豆瓣",
  description: "获取豆瓣的榜单数据",
  requiredVersion: "0.0.1",
  version: "1.0.2",
  author: "suiyuran",
  site: "https://github.com/suiyuran/forward",
  modules: [
    {
      id: "showing",
      title: "正在上映",
      functionName: "showing",
      params: [],
    },
    {
      id: "theater",
      title: "剧场",
      functionName: "theater",
      params: [
        {
          name: "name",
          title: "名称",
          type: "enumeration",
          enumOptions: [
            {
              title: "爱奇艺 迷雾剧场",
              value: "爱奇艺 迷雾剧场",
            },
            {
              title: "优酷 白夜剧场",
              value: "优酷 白夜剧场",
            },
            {
              title: "芒果 季风剧场",
              value: "芒果 季风剧场",
            },
            {
              title: "腾讯 X剧场",
              value: "腾讯 X剧场",
            },
          ],
        },
      ],
    },
    {
      id: "top250",
      title: "Top250",
      functionName: "top250",
      params: [],
    },
  ],
};

async function showing() {
  try {
    const url = "https://raw.githubusercontent.com/suiyuran/forward/main/data/douban/showing.json";
    return (await Widget.http.get(url)).data.data;
  } catch (error) {
    return [];
  }
}

async function theater(params) {
  try {
    const url = "https://raw.githubusercontent.com/suiyuran/forward/main/data/douban/theater.json";
    const data = (await Widget.http.get(url)).data.data;
    const name = params.name || "爱奇艺 迷雾剧场";
    return data[name] || [];
  } catch (error) {
    return [];
  }
}

async function top250() {
  try {
    const url = "https://raw.githubusercontent.com/suiyuran/forward/main/data/douban/top250.json";
    return (await Widget.http.get(url)).data.data;
  } catch (error) {
    return [];
  }
}
