WidgetMetadata = {
  id: "suiyuran.forward.widgets.bangumi",
  title: "Bangumi",
  description: "获取Bangumi每日放送",
  requiredVersion: "0.0.1",
  version: "1.0.0",
  author: "suiyuran",
  site: "https://github.com/suiyuran/forward",
  modules: [
    {
      id: "today",
      title: "每日放送",
      functionName: "today",
      params: [],
    },
  ],
};

async function today() {
  return [];
}
