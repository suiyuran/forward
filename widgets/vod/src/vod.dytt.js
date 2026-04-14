WidgetMetadata = {
  id: "suiyuran.forward.widgets.vod.dytt",
  title: "电影天堂",
  description: "获取电影天堂的 VOD 资源",
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

const URL = "http://caiji.dyttzyapi.com/api.php/provide/vod/from/dyttm3u8/at/json/";
