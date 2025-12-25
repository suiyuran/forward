WidgetMetadata = {
  id: "suiyuran.forward.widgets.douban",
  title: "豆瓣",
  description: "获取豆瓣的榜单数据",
  requiredVersion: "0.0.1",
  version: "1.0.0",
  author: "suiyuran",
  site: "https://github.com/suiyuran/forward",
  modules: [
    {
      id: "top250",
      title: "Top250",
      functionName: "top250",
      params: [],
    },
  ],
};

async function top250() {
  try {
    const url = "https://dirs.deno.dev/forward/data/douban/top250.json";
    return (await Widget.http.get(url)).data;
  } catch (error) {
    return [];
  }
}
