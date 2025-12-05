export default class CzzyMovie {
  getConfig() {
    return {
      id: "czzy",
      name: "厂长资源 (CZZY)",
      type: 1,
      api: "https://www.czzymovie.com/",
      nsfw: false,
      status: true,
      extra: {
        js: {
          category: "getCategory",
          home: "getHome",
          search: "getSearch",
          detail: "getDetail",
          parseIframe: "parseIframe"
        }
      }
    };
  }

  async _get(url) {
    const res = await $http.get(url);
    return res.data;
  }

  async getCategory() {
    return [
      { text: "电影", id: "movie" },
      { text: "电视剧", id: "tv" },
      { text: "综艺", id: "variety" },
      { text: "动漫", id: "anime" }
    ];
  }

  _parseList(html) {
    const regex = /<a href="(\/vod\/[^\"]+)"[^>]*>\s*<img[^>]*data-original="([^"]+)"[^>]*alt="([^"]+)"[^>]*>/g;
    const list = [];
    let m;
    while ((m = regex.exec(html))) {
      list.push({ id: m[1], title: m[3], cover: m[2], remark: "" });
    }
    return list;
  }

  async getHome() {
    const html = await this._get("https://www.czzymovie.com/");
    return this._parseList(html);
  }

  async getSearch(key) {
    const url = `https://www.czzymovie.com/index.php/ajax/suggest?mid=1&wd=${encodeURIComponent(key)}`;
    try {
      const res = await $http.get(url);
      const data = JSON.parse(res.data || "{}");
      return (data.list || []).map(i => ({
        id: i.id,
        title: i.name,
        cover: i.pic,
        remark: ""
      }));
    } catch(e) {
      return [];
    }
  }

  async getDetail(id) {
    const url = id.startsWith("http") ? id : `https://www.czzymovie.com${id}`;
    const html = await this._get(url);
    const title = html.match(/<h1.*?>(.*?)<\/h1>/)?.[1] || "";
    const cover = html.match(/data-original="([^"]+)"/)?.[1] || "";
    const desc = html.match(/<div class="detail-content">([\s\S]*?)<\/div>/)?.[1]?.replace(/<[^>]+>/g, "") || "";
    const list = [];
    const regex = /<a[^>]+href="(\/vod\/play\/\d+-\d+-\d+\.html)"[^>]*>\s*(.*?)\s*<\/a>/g;
    let m;
    while ((m = regex.exec(html))) {
      list.push({ text: m[2], id: "$iframe_" + m[1] });
    }
    return { id, title, cover, desc, remark: "", playlist: list.length ? [{ name: "播放源", urls: list }] : [] };
  }

  async parseIframe(url) {
    url = url.replace("$iframe_", "");
    const html = await this._get("https://www.czzymovie.com" + url);
    const real = html.match(/source\s+src="([^"]+\.m3u8[^"]*)"/)?.[1] ||
                 html.match(/"file":"([^"]+\.m3u8[^"]*)"/)?.[1] ||
                 "";
    return real;
  }
}
