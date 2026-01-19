WidgetMetadata = {
  id: "suiyuran.forward.widgets.bangumi",
  title: "Bangumi",
  description: "获取 Bangumi 的动画数据",
  requiredVersion: "0.0.1",
  version: "1.0.1",
  author: "suiyuran",
  site: "https://github.com/suiyuran/forward",
  modules: [
    {
      id: "calendar",
      title: "每日放送",
      functionName: "calendar",
      params: [
        {
          name: "day",
          title: "星期",
          type: "enumeration",
          enumOptions: [
            {
              title: "今天",
              value: "today",
            },
            {
              title: "星期一",
              value: "星期一",
            },
            {
              title: "星期二",
              value: "星期二",
            },
            {
              title: "星期三",
              value: "星期三",
            },
            {
              title: "星期四",
              value: "星期四",
            },
            {
              title: "星期五",
              value: "星期五",
            },
            {
              title: "星期六",
              value: "星期六",
            },
            {
              title: "星期日",
              value: "星期日",
            },
          ],
        },
      ],
    },
  ],
};

async function calendar(params) {
  try {
    const url = "https://raw.githubusercontent.com/suiyuran/forward/main/data/bangumi/calendar.json";
    const data = (await Widget.http.get(url)).data.data;
    let day = params.day || "today";

    if (day === "today") {
      const today = new Date();
      const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
      day = weekdays[today.getDay()];
    }
    return data[day] || [];
  } catch (error) {
    return [];
  }
}
