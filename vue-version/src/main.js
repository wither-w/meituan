import { createApp, ref, computed } from 'vue'
import JSZip from 'jszip'

// ============ 原有逻辑函数（保留） ============

// 全局拦截 JSON.parse，抓 productList
function hookJSONParse() {
  if (window.self === window.top) { return; }

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

// 获取iframe中的文档
function getIframedoc() {
  const iframedocs = Array.from(document.querySelectorAll("iframe"));
  if (!iframedocs) {
    alert("拿不到iframe")
  }
  for (const f of iframedocs) {
    try {
      const win = f.contentWindow;
      const href = win?.location?.href || "";
      if (href.includes("/reuse/sc/product/views/product/list")) {
        return win.document;
      }
    } catch (e) {

    }
  }
  return null;
}

// 提取文件json数据
function getproductList() {
  const list = window.__mtAllProductOrder || [];
  if (!list.length) {
    alert("未捕获到商品列表，请先打开商品列表页面");
    return;
  }
  const row = list.flatMap(spu => {
    const skus = Array.isArray(spu.wmProductSkus) ? spu.wmProductSkus : [];
    if (!skus.length) {
      return [{
        name: spu.name,
        productCategory: spu.wmProductSpuExtends?.["1200000210"]?.value || "",
        productskus: spu.wmProductSkus || "",
        spec: "",
        price: "",
        stock: "",
        weight: "",
        sourcefoodcode: ""
      }];
    }
    return skus.map(sku => ({
      name: spu.name,
      productCategory: spu.wmProductSpuExtends?.["1200000210"]?.value || "",
      spec: sku.spec,
      price: (sku.price).toFixed(1),
      stock: sku.stock,
      weight: sku.weight || "",
      sourcefoodcode: sku.sourceFoodCode || ""
    }));
  })
  console.log("下载的商品列表", row);
  const columns = ["name", "productCategory", "spec", "price", "stock", "weight", "sourcefoodcode"];
  const headers = ["商品名称", "选择销售属性", "商品规格名称", "价格（元）", "库存", "重量", "店内码/货号"];
  const csv = toCSV(row, columns, headers);
  downloadCSV("meituan_products.csv", csv);
}

// 转换为CSV格式
function toCSV(row, columns, headers) {
  const escapeCell = (v) => {
    const s = (v ?? "").toString();
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lines = [];
  lines.push(headers.join(","));
  for (const r of row) {
    lines.push(columns.map(k => escapeCell(r[k])).join(","));
  }
  return lines.join("\r\n");
}

// 下载CSV文件
function downloadCSV(filename, csvText) {
  const blob = new Blob(["\ufeff" + csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

// 自动翻页
async function autofetchpage() {
  const iframedoc = getIframedoc();
  const pagesizeinput = iframedoc.querySelector('.roo-pagination .dropdown input[readonly][placeholder="请选择"]')
  const productnumber = iframedoc.querySelector('.src-pages-ProductList-components-FilterTab-index_count')
  if (!productnumber) { alert("没有productnumber") }
  const pagenumber = Number(productnumber.textContent.trim());
  if (!pagenumber) { alert("没有pagenumber") }
  else { console.log("商品数量：", pagenumber) }

  if (!pagesizeinput) {
    alert("未找到页码按钮")
    return
  }
  else {
    pagesizeinput.click();
    await wait(2000);
    const pagesize_hundred = iframedoc.querySelector('a.roo-selector-option-item[title="100 条/页"]')
    if (!pagesize_hundred) {
      alert("找不到100条/页")
    }
    else {
      pagesize_hundred.click();
    }
  }
  await wait(5000);
  const nextpage = iframedoc.querySelector('.roo-pagination a[aria-label="Next"]')
  if (!nextpage) {
    alert("找不到下一页按钮")
  }
  else {
    for (let i = 1; i < Math.ceil(pagenumber / 100); i++) {
      console.log("当前页数", i);
      await wait(3000);
      nextpage.click();
    }
  }
}

// 保存图片
function downsavepic() {
  const piclist = window.__mtAllProductOrder || [];
  if (!piclist.length) {
    alert("未捕获到商品列表，请先打开商品列表页面");
    return;
  }
  const pic_url = [];
  for (const pic_spu of piclist) {
    const pics = Array.isArray(pic_spu.pictures) ? pic_spu.pictures : [];
    pics.forEach((url, index) => {
      if (!url || !url.startsWith("http")) {
        return;
      }
      pic_url.push(
        {
          name: pic_spu.name,
          url,
          picindex: index,
        }
      )
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

// 建立image_zip
async function toimageZip(picgroups) {
  const image_zip = new JSZip();
  
  function sanitizeFolderName(name) {
    return (name || "unknown").replace(/[\/\\:*?"<>|]/g, "_").trim();
  }
  
  for (const [name, urls] of picgroups.entries()) {
    const folder = image_zip.folder(sanitizeFolderName(name))
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const safeUrl = url.replace(/^http:\/\//, "https://");

      const res = await fetch(safeUrl);
      if (!res.ok) { console.warn("下载失败", res.status, safeUrl); continue; }
      const blob = await res.blob();

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

// ============ Vue 组件 ============

const MenuComponent = {
  template: `
    <div class="mt-helper-container">
      <button 
        class="mt-helper-main-button"
        @mouseenter="showMenu = true"
        @mouseleave="showMenu = false"
      >
        工具按钮
      </button>
      
      <div 
        class="mt-helper-sub-container1"
        v-show="showMenu"
        @mouseenter="showMenu = true"
        @mouseleave="showMenu = false"
      >
        <button class="mt-helper-sub-button" @click="onProductList">
          商品列表
        </button>
        <button class="mt-helper-sub-button" @click="onAutoPage">
          自动翻页
        </button>
        
        <div 
          class="mt-helper-sub-container2"
          @mouseenter="showDownload = true"
          @mouseleave="showDownload = false"
        >
          <button class="mt-helper-sub-button">
            下载
          </button>
          
          <div 
            class="mt-helper-sub-container3"
            v-show="showDownload"
          >
            <button class="mt-helper-sub-button-small" @click="onDownloadMeituan">
              美团
            </button>
            <button class="mt-helper-sub-button-small" @click="onDownloadJD">
              京东
            </button>
            <button class="mt-helper-sub-button-small" @click="onDownloadImages">
              图片
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const showMenu = ref(false);
    const showDownload = ref(false);

    const onProductList = () => {
      window.__mtProductEable = true;
      const productList_btn = document.querySelector('[data-key="Sub.ProductManageList"]');
      if (productList_btn) {
        productList_btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        return;
      }
      else {
        alert("未找到商品列表");
      }
    }

    const onAutoPage = () => {
      autofetchpage();
    }

    const onDownloadMeituan = () => {
      if (window.__mtDownloading) return;
      window.__mtDownloading = true;
      try {
        getproductList();
      } finally {
        setTimeout(() => { window.__mtDownloading = false; }, 300);
        window.__mtAllProductOrder = [];
      }
    }

    const onDownloadJD = () => {
      alert("京东下载功能开发中");
    }

    const onDownloadImages = () => {
      const picgroups = downsavepic();
      if (picgroups && picgroups.size > 0) {
        toimageZip(picgroups);
      }
    }

    return {
      showMenu,
      showDownload,
      onProductList,
      onAutoPage,
      onDownloadMeituan,
      onDownloadJD,
      onDownloadImages
    }
  }
}

// CSS样式
const styles = document.createElement('style');
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
  .mt-helper-sub-button-small {
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

  .mt-helper-main-button {
    font-size: 15px;
  }

  .mt-helper-sub-button-small {
    padding: 6px 10px;
    font-size: 12px;
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
  }
`;
document.head.appendChild(styles);

// ============ 主函数 ============

const main = async () => {
  if (window.self !== window.top) return;

  if (window.__mtHelperInited === true) return;
  window.__mtHelperInited = true;

  window.__mtProductEable = false;
  window.__mtProductList = window.__mtProductList || [];
  window.__mtAllProductOrder = window.__mtAllProductOrder || [];

  console.log("主页面已加载");
  
  hookJSONParse();
  
  await wait(2000);

  const app = createApp(MenuComponent);
  const container = document.createElement('div');
  container.id = 'mt-vue-app';
  document.body.appendChild(container);
  app.mount(container);
}

main();
