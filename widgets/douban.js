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
      title: "影院热映",
      functionName: "showing",
      params: [],
    },
    {
      id: "hotGaia",
      title: "豆瓣热门",
      functionName: "hotGaia",
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
    const url = "https://dirs.deno.dev/forward/data/douban/showing.json";
    return (await Widget.http.get(url)).data;
  } catch (error) {
    return [];
  }
}

async function hotGaia() {
  try {
    const url = "https://dirs.deno.dev/forward/data/douban/hot-gaia.json";
    return (await Widget.http.get(url)).data;
  } catch (error) {
    return [];
  }
}

async function top250() {
  try {
    const url = "https://dirs.deno.dev/forward/data/douban/top250.json";
    return (await Widget.http.get(url)).data;
  } catch (error) {
    return [];
  }
}
