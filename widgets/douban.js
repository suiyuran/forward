WidgetMetadata = {
  id: "suiyuran.forward.widgets.douban",
  title: "豆瓣",
  description: "获取豆瓣的榜单数据",
  requiredVersion: "0.0.1",
  version: "1.0.1",
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

async function top250() {
  try {
    const url = "https://raw.githubusercontent.com/suiyuran/forward/main/data/douban/top250.json";
    return (await Widget.http.get(url)).data.data;
  } catch (error) {
    return [];
  }
}
