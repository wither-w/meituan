// ==UserScript==
// @name         meituan test
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  dowmload All file in store
// @author       wither
// @match        https://shangoue.meituan.com/*
// @run-at       document-idle
// @grant none
// @downloadURL https://raw.githubusercontent.com/wither-w/meituan/refs/heads/main/meituan%20test-0.5.user.js
// @updateURL   https://raw.githubusercontent.com/wither-w/meituan/refs/heads/main/meituan%20test-0.5.user.js
// @require https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js
// ==/UserScript==

(function () {
  "use strict";

  console.log("Tampermonkey 脚本已注入:", location.href);

  // ==== 全局拦截 JSON.parse，抓 productList ====
  function hookJSONParse() {
    if (!window.JSON) return;
    // 防重复 hook
    if (window.__mtJSONHooked) return;
    window.__mtJSONHooked = true;
    const origParse = JSON.parse;
    JSON.parse = function (text, reviver) {
      const result = origParse.call(this, text, reviver);
      try {
        if (result && typeof result === "object") {
          const list = result?.data?.productList;
          const root = window.top || window;
          if (Array.isArray(list)) {
            console.log("[jp-hook] 捕获到 productList:", list);
            const firstId = list[0]?.id ?? "";
            const lastId = list[list.length - 1]?.id ?? "";
            const sig = `${list.length}|${firstId}|${lastId}`;

            if (root.__mtLastPushedSig === sig) {
              return result;
            }

            root.__mtLastPushedSig = sig;
            root.__mtAllProductOrder = root.__mtAllProductOrder || [];
            root.__mtAllProductOrder.push(...list);
          }
        }
      } catch (e) {
        console.warn("[jp-hook] 处理 JSON.parse 结果时出错:", e);
      }

      return result;
    };
  }

  // iframe 中注入 JSON.parse hook
  if (window.self !== window.top) {
    hookJSONParse(window);
  }

  // ==== 主界面按钮 ====
  const mainWidget = () => {
    if (document.getElementById("mt-helper-container")) return;

    if (!document.getElementById("mt-helper-style")) {
      const styles = document.createElement("style");
      styles.id = "mt-helper-style";
      styles.textContent = `
  .mt-helper-container {
    position: fixed;
    top: 110px;
    right: 160px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }

  .mt-helper-main-button,
  .mt-helper-sub-button,
  .mt-helper-sub-button-small{
    padding: 8px 12px;
    background-color: #000000;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    transition: opacity 0.3s;
  }

  .mt-helper-sub-button-small {
    padding: 6px 10px;
    font-size: 12px;
  }

  .mt-helper-sub-container2 {
    animation: slideDown 0.2s ease-out;
  }

  .mt-helper-sub-mt-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }

  .mt-helper-sub-mt-container2 {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    animation: slideDown 0.2s ease-out;
  }

  .mt-helper-main-button {
    font-size: 15px;
  }

  .mt-helper-main-button:hover,
  .mt-helper-sub-button:hover,
  .mt-helper-sub-button-small:hover {
    opacity: 0.8;
  }

  .mt-helper-sub-container1,
  .mt-helper-sub-container2,
  .mt-helper-sub-container3 {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }

  .mt-helper-sub-container1 {
    animation: slideDown 0.2s ease-out;
  }

  .mt-helper-sub-container3 {
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }`;
      document.head.appendChild(styles);
    }

    const container = document.createElement("div");
    container.id = "mt-helper-container";
    container.className = "mt-helper-container";

    const mainButton = document.createElement("button");
    mainButton.className = "mt-helper-main-button";
    mainButton.textContent = "工具按钮";

    const subContainer1 = document.createElement("div");
    subContainer1.className = "mt-helper-sub-container1";
    subContainer1.style.display = "none";

    const productButton = document.createElement("button");
    productButton.className = "mt-helper-sub-button";
    productButton.textContent = "商品列表";
    productButton.onclick = () => {
      window.__mtProductEable = true;
      const productListBtn = document.querySelector(
        '[data-key="Sub.ProductManageList"]',
      );
      if (productListBtn) {
        productListBtn.dispatchEvent(
          new MouseEvent("click", { bubbles: true }),
        );
        return;
      }
      alert("未找到商品列表");
    };

    const mtContainer = document.createElement("div");
    mtContainer.className = "mt-helper-sub-mt-container";

    const mtButton = document.createElement("button");
    mtButton.className = "mt-helper-sub-button";
    mtButton.textContent = "美团";

    const mtContainer2 = document.createElement("div");
    mtContainer2.className = "mt-helper-sub-mt-container2";
    mtContainer2.style.display = "none";

    const mtSomeButton = document.createElement("button");
    mtSomeButton.className = "mt-helper-sub-button-small";
    mtSomeButton.textContent = "下载勾选";
    mtSomeButton.onclick = () => {
      if (window.__mtDownloadSomeImage) return;
      window.__mtDownloadSomeImage = true;

      try {
        const iframedoc = getIframedoc();
        if (!iframedoc) {
          alert("拿不到iframedoc3");
          return;
        }

        const selected = Array.from(
          iframedoc.querySelectorAll(".roo-checkbox input:checked"),
        ).map((input) => {
          const row = input.closest("tr");

          return {
            id: row?.dataset?.rowKey, // ✅ 正确拿ID
            name: row.innerText,
          };
        });

        const piclist = window.__mtAllProductOrder || [];
        if (!piclist.length) {
          alert("未捕获到商品列表，请先打开商品列表页面");
          return;
        }
        const newpiclist = [];
        for (const s of selected) {
          const s_id = s.id;
          for (const item of piclist) {
          }
        }

        const pic_url = [];
        for (const pic_spu of piclist) {
          //多图
          const pics = Array.isArray(pic_spu.pictures) ? pic_spu.pictures : [];
          pics.forEach((url, index) => {
            if (!url || !url.startsWith("http")) {
              return;
            }
            pic_url.push({
              id: pic_spu.id,
              name: pic_spu.name,
              url,
              picindex: index,
            });
          });
        }
        const picgroups = new Map();
        for (const item of pic_url) {
          const key = item.name;
          if (!picgroups.has(key)) {
            picgroups.set(key, []);
          }
          picgroups.get(key).push(item.url);
        }
        console.log(picgroups);
        return picgroups;

        console.log("选中的ID:", selected);
      } finally {
        window.__mtDownloadSomeImage = false;
      }
    };

    const mtAllButton = document.createElement("button");
    mtAllButton.className = "mt-helper-sub-button-small";
    mtAllButton.textContent = "下载所有";
    mtAllButton.onclick = async () => {
      hookJSONParse();
      if (window.__mtDownloadAllImage) return;
      window.__mtDownloadAllImage = true;
      try {
        window.__mtAllProductOrder = [];
        window.__mtLastPushedSig = "";
        productButton.onclick();
        await wait(2500);
        const all = await autofetchpage();
        window.__mtAllProductOrder = all;
        const picgroups = downsavepic();
        if (!picgroups || picgroups.size === 0) {
          alert("未抓到可下载图片");
          return;
        }
        await toimageZip(picgroups);
      } finally {
        window.__mtDownloadAllImage = false;
      }
    };

    const jdButton = document.createElement("button");
    jdButton.className = "mt-helper-sub-button";
    jdButton.textContent = "京东";
    jdButton.onclick = () => {
      alert("京东下载功能开发中");
    };

    container.addEventListener("mouseenter", () => {
      subContainer1.style.display = "flex";
    });
    container.addEventListener("mouseleave", () => {
      subContainer1.style.display = "none";
      mtContainer2.style.display = "none";
    });

    mtContainer.addEventListener("mouseenter", () => {
      mtContainer2.style.display = "flex";
    });
    mtContainer.addEventListener("mouseleave", () => {
      mtContainer2.style.display = "none";
    });

    mtContainer2.appendChild(mtSomeButton);
    mtContainer2.appendChild(mtAllButton);
    mtContainer.appendChild(mtButton);
    mtContainer.appendChild(mtContainer2);

    subContainer1.appendChild(productButton);
    subContainer1.appendChild(mtContainer);
    subContainer1.appendChild(jdButton);

    container.appendChild(mainButton);
    container.appendChild(subContainer1);
    document.body.appendChild(container);
  };
  //提取文件json数据
  function getproductList() {
    const list = window.__mtAllProductOrder || [];
    if (!list.length) {
      alert("未捕获到商品列表，请先打开商品列表页面");
      return;
    }
    const row = list.flatMap((spu) => {
      const skus = Array.isArray(spu.wmProductSkus) ? spu.wmProductSkus : [];
      if (!skus.length) {
        return [
          {
            //------Spu信息--------
            name: spu.name, //中文名
            productCategory:
              spu.wmProductSpuExtends?.["1200000210"]?.value || "", //商品类别
            productskus: spu.wmProductSkus || "",
            //------Sku信息--------
            spec: "", //规格
            price: "", //价格
            stock: "", //库存
            weight: "", //重量
            sourcefoodcode: "", //店内码
          },
        ];
      }
      return skus.map((sku) => ({
        //------Spu信息--------
        name: spu.name, //中文名
        productCategory: spu.wmProductSpuExtends?.["1200000210"]?.value || "", //商品类别
        //------Sku信息--------
        spec: sku.spec, //规格
        // 价格：分转元，并保留 1 位小数（保持为 number）
        price: sku.price.toFixed(1), //价格
        stock: sku.stock, //库存
        weight: sku.weight || "", //重量
        sourcefoodcode: sku.sourceFoodCode || "", //店内码
      }));
    });
    console.log("下载的商品列表", row);
    const columns = [
      "name",
      "productCategory",
      "spec",
      "price",
      "stock",
      "weight",
      "sourcefoodcode",
    ];
    const headers = [
      "商品名称",
      "选择销售属性",
      "商品规格名称",
      "价格（元）",
      "库存",
      "重量",
      "店内码/货号",
    ];
    const csv = toCSV(row, columns, headers);
    downloadCSV("meituan_products.csv", csv);
  }
  //自动翻页
  async function autofetchpage() {
    const iframedoc = getIframedoc();
    if (!iframedoc) {
      alert("拿不到iframedoc2");
      return [];
    }

    const productnumber = iframedoc.querySelector(
      ".src-pages-ProductList-components-FilterTab-index_count",
    );
    if (!productnumber) {
      alert("没有productnumber");
      return [];
    }
    const pagenumber = Number(productnumber.textContent.trim());
    if (!pagenumber) {
      alert("没有pagenumber");
      return [];
    } else {
      console.log("商品数量：", pagenumber);
    }

    const pagesizeinput = iframedoc.querySelector(
      '.roo-pagination .dropdown input[readonly][placeholder="请选择"]',
    );
    if (!pagesizeinput) {
      alert("未找到页码按钮");
      return [];
    } else {
      pagesizeinput.click();
      await wait(2000);
      const pagesize_hundred = iframedoc.querySelector(
        'a.roo-selector-option-item[title="100 条/页"]',
      );
      if (!pagesize_hundred) {
        alert("找不到100条/页");
        return [];
      } else {
        pagesize_hundred.click();
      }
    }

    await wait(2000);
    let guard = 0;
    const maxTurns = Math.ceil(pagenumber / 100) + 5;

    const isNextDisabled = (nextpage) =>
      !nextpage ||
      nextpage.getAttribute("aria-disabled") === "true" ||
      nextpage.classList.contains("disabled") ||
      nextpage.classList.contains("is-disabled") ||
      nextpage.parentElement?.classList.contains("disabled");

    while (guard++ < maxTurns) {
      const nextpage = iframedoc.querySelector(
        '.roo-pagination a[aria-label="Next"]',
      );
      if (isNextDisabled(nextpage)) break;

      const prevSig = window.__mtLastPushedSig || "";
      nextpage.click();

      const start = Date.now();
      let changed = false;
      while (Date.now() - start < 12000) {
        const curSig = window.__mtLastPushedSig || "";
        if (curSig && curSig !== prevSig) {
          changed = true;
          break;
        }
        await wait(200);
      }
      if (!changed) break;
      await wait(500);
    }

    const all = window.__mtAllProductOrder || [];
    const deduped = [];
    const seen = new Set();
    for (const spu of all) {
      const id = spu?.id ?? spu?.name;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      deduped.push(spu);
    }

    return deduped;
  }
  //转换为CSV格式
  function toCSV(row, columns, headers) {
    const escapeCell = (v) => {
      const s = (v ?? "").toString();
      // 需要转义：包含 " 或 , 或 换行
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const lines = [];
    // 表头
    lines.push(headers.join(","));
    // 内容
    for (const r of row) {
      lines.push(columns.map((k) => escapeCell(r[k])).join(","));
    }
    return lines.join("\r\n");
  }
  //下载CSV文件
  function downloadCSV(filename, csvText) {
    // 加 BOM，Excel 打开中文不乱码
    const blob = new Blob(["\ufeff" + csvText], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }
  //抓取到iframe
  function getIframedoc() {
    const iframe = document.querySelector("#hashframe");
    if (!iframe) return null;

    try {
      return iframe.contentDocument || iframe.contentWindow.document;
    } catch (e) {
      console.log("拿不到 iframe doc", e);
      return null;
    }

    // const iframedocs = Array.from(document.querySelectorAll("iframe"));
    // const iframe = document.querySelector("#hashframe");
    // const doc = iframe.contentDocument;

    // console.log(iframedocs);

    // if (!iframedocs.length) {
    //   alert("拿不到iframe1");
    //   console.log("1");
    // }
    // console.log("2");
    // for (const f of iframedocs) {
    //   try {
    //     const win = f.contentWindow;
    //     const href = win?.location?.href || "";
    //     if (href.includes("/reuse/sc/product/views/product/list")) {
    //       console.log("3");
    //       return win.document;
    //     }
    //   } catch (e) {}
    // }
    // return null;
  }
  //保存图片
  function downsavepic() {
    const piclist = window.__mtAllProductOrder || [];
    if (!piclist.length) {
      alert("未捕获到商品列表，请先打开商品列表页面");
      return;
    }
    const pic_url = [];
    for (const pic_spu of piclist) {
      //多图
      const pics = Array.isArray(pic_spu.pictures) ? pic_spu.pictures : [];
      pics.forEach((url, index) => {
        if (!url || !url.startsWith("http")) {
          return;
        }
        pic_url.push({
          id: pic_spu.id,
          name: pic_spu.name,
          url,
          picindex: index,
        });
      });
    }
    const picgroups = new Map();
    for (const item of pic_url) {
      const key = item.name;
      if (!picgroups.has(key)) {
        picgroups.set(key, []);
      }
      picgroups.get(key).push(item.url);
    }
    console.log(picgroups);
    return picgroups;
  }

  //建立image_zip
  async function toimageZip(picgroups) {
    const image_zip = new JSZip();
    //文件夹名字清理函数
    function sanitizeFolderName(name) {
      return (name || "unknown").replace(/[\/\\:*?"<>|]/g, "_").trim();
    }
    for (const [name, urls] of picgroups.entries()) {
      const folder = image_zip.folder(sanitizeFolderName(name));
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const safeUrl = url.replace(/^http:\/\//, "https://"); // 混合内容问题

        const res = await fetch(safeUrl);
        if (!res.ok) {
          console.warn("下载失败", res.status, safeUrl);
          continue;
        }
        const blob = await res.blob();

        // 文件名：按顺序命名，你也可以改成 001.jpg 这种
        const filename = `${name}-${i + 1}.jpg`;
        folder.file(filename, blob);
      }
    }
    const zipBlob = await image_zip.generateAsync({ type: "blob" });
    downloadBlob("meituan_images.zip", zipBlob);
  }

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  //main 函数
  const main = async () => {
    if (window.self !== window.top) return;

    // 只初始化一次（防止页面内部重载/重复注入）
    if (window.__mtHelperInited === true) return;
    window.__mtHelperInited = true;

    window.__mtProductEable = false; // 是否启用商品列表抓取
    window.__mtProductList = window.__mtProductList || []; // 抓取到的商品列表
    window.__mtAllProductOrder = window.__mtAllProductOrder || []; // 所有商品的顺序列表
    hookJSONParse();

    console.log("主页面已加载");
    await wait(2000);
    mainWidget();
  };
  main();
})();
