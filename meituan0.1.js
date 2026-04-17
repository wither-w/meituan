// ==UserScript==
// @name         meituan test
// @namespace    http://tampermonkey.net/
// @version      0.1
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
    'use strict';

    console.log("Tampermonkey 脚本已注入:", location.href);



    // ==== 全局拦截 JSON.parse，抓 productList ====
    (function hookJSONParse() {

        if (window.self === window.top) { return; }
        //if (window.__mtProductEable === false) { return; }
        //if (window.__mtJSONHooked) return;
        //window.__mtJSONHooked = true;

        const origParse = JSON.parse;
        JSON.parse = function (text, reviver) {
            // 先正常解析
            const result = origParse.call(this, text, reviver);

            try {
                // 只处理对象结果，避免无关数据
                if (result && typeof result === "object") {
                    const list = result?.data?.productList;
                    const root = window.top || window;
                    if (Array.isArray(list)) {
                        console.log("[jp-hook] 捕获到 productList:", list);
                        const firstId = list[0]?.id ?? "";
                        const lastId = list[list.length - 1]?.id ?? "";
                        const sig = `${list.length}|${firstId}|${lastId}`;

                        // 如果这次和上次一样，说明是同一批数据重复解析，跳过 push
                        if (root.__mtLastPushedSig === sig) {
                            // 可选：调试用
                            // console.log("[jp-hook] 重复 list，跳过 push", sig);
                            return result;
                        }

                        root.__mtLastPushedSig = sig;

                        // 只有“新的一批 list”才 push
                        root.__mtAllProductOrder = root.__mtAllProductOrder || [];
                        root.__mtAllProductOrder.push(...list);

                    }
                }
            } catch (e) {
                console.warn("[jp-hook] 处理 JSON.parse 结果时出错:", e);
            }

            return result;
        };
    })();



    // ==== 主界面按钮 ====
    const mainWidget = () => {
        // 只创建一次（避免重复注入导致按钮/事件重复）
        if (document.getElementById("mt-helper-container")) return;

        //主容器（主按钮+副容器）
        const container = document.createElement("div");
        container.id = "mt-helper-container";
        container.style.cssText = `
   position:fixed;
   top :110px;
   right:160px;
   z-index:9999;
   display:flex;
   flex-direction:column;
   align-items:flex-end;
    gap:6px;
    `;
        //主按钮
        const mainButton = document.createElement("button");
        mainButton.id = "mt-helper-main-button";
        mainButton.innerText = "工具按钮";
        mainButton.style.cssText = `
    padding:8px 12px;
    background-color:#000000;
    color:white;
    border:none;
    border-radius:4px;
    cursor:pointer;
    font-size:15px;
    box-shadow:0 2px 6px rgba(0,0,0,0.2);
    `;

        //二级容器
        const subContainer1 = document.createElement("div");
        subContainer1.id = "mt-helper-sub-container1";
        subContainer1.style.cssText = `
    display:none;
    flex-direction:column;
    align-items:flex-end;
    gap:6px;
    `;
        //二级按钮(商品列表)
        const subButton1 = document.createElement("button");
        subButton1.id = "mt-helper-sub-button1";
        subButton1.innerText = "商品列表";
        subButton1.style.cssText = `
    padding:8px 12px;
    background-color:#000000;
    color:white;
    border:none;
    border-radius:4px;
    cursor:pointer;
    font-size:14px;
    box-shadow:0 2px 6px rgba(0,0,0,0.2);
    `;
        subButton1.onclick = () => {
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

        //子按钮(翻页按钮)
        const subButton2 = document.createElement("button");
        subButton2.id = "mt-helper-sub-button2";
        subButton2.innerText = "自动翻页";
        subButton2.style.cssText = `
    padding:8px 12px;
    background-color:#000000;
    color:white;
    border:none;
    border-radius:4px;
    cursor:pointer;
    font-size:14px;
    box-shadow:0 2px 6px rgba(0,0,0,0.2);
    `;
        subButton2.onclick = () => {
            autofetchpage();
        }

        //三级容器下载(下载)

        const subContainer2 = document.createElement("div");
        subContainer2.id = "mt-helper-sub-container2";
        subContainer2.style.cssText = `
    display:flex;
    flex-direction:column;
    align-items:flex-end;
    gap:6px;
    `;

        //三级容器主按钮(下载按钮)
        const subButton3 = document.createElement("button");
        subButton3.id = "mt-helper-sub-button3";
        subButton3.innerText = "下载";
        subButton3.style.cssText = `
    padding:8px 12px;
    background-color:#000000;
    color:white;
    border:none;
    border-radius:4px;
    cursor:pointer;
    font-size:14px;
    box-shadow:0 2px 6px rgba(0,0,0,0.2);
    `;
        subButton3.onclick = () => {

        }
        const subContainer3 = document.createElement("div");
        subContainer3.id = "mt-helper-sub-container3";
        subContainer3.style.cssText = `
    display:none;
    flex-direction:column;
    align-items:flex-end;
    gap:6px;
    `;
        //三级按钮(美团按钮)
        const subButton4 = document.createElement("button");
        subButton4.id = "mt-helper-sub-button4";
        subButton4.innerText = "美团";
        subButton4.style.cssText = `
    padding:6px 10px;
    background-color:#000000;
    color:white;
    border:none;
    border-radius:4px;
    cursor:pointer;
    font-size:14px;
    box-shadow:0 2px 6px rgba(0,0,0,0.2);
    `;
        subButton4.onclick = () => {
            if (window.__mtDownloading) return;
            window.__mtDownloading = true;
            try {
                getproductList();
            } finally {
                setTimeout(() => { window.__mtDownloading = false; }, 300);
                window.__mtAllProductOrder = [];// 清空已下载列表
            }
        }
        //三级按钮(京东按钮)
        const subButton5 = document.createElement("button");
        subButton5.id = "mt-helper-sub-button5";
        subButton5.innerText = "京东";
        subButton5.style.cssText = `
    padding:6px 10px;
    background-color:#000000;
    color:white;
    border:none;
    border-radius:4px;
    cursor:pointer;
    font-size:14px;
    box-shadow:0 2px 6px rgba(0,0,0,0.2);
    `;
        subButton5.onclick = () => {

        }

        //三级按钮(图片按钮)
        const subButton6 = document.createElement("button");
        subButton6.id = "mt-helper-sub-button6";
        subButton6.innerText = "图片";
        subButton6.style.cssText = `
    padding:6px 10px;
    background-color:#000000;
    color:white;
    border:none;
    border-radius:4px;
    cursor:pointer;
    font-size:14px;
    box-shadow:0 2px 6px rgba(0,0,0,0.2);
    `;
        subButton6.onclick = () => {
            const picgroups = downsavepic();
            toimageZip(picgroups);
        }



        container.addEventListener("mouseleave", () => {
            subContainer1.style.display = "none";
        });
        container.addEventListener("mouseenter", () => {
            subContainer1.style.display = "flex";
        });

        subContainer2.addEventListener("mouseleave", () => {
            subContainer3.style.display = "none";
        });
        subContainer2.addEventListener("mouseenter", () => {
            subContainer3.style.display = "flex";
        });

        //组装

        subContainer3.appendChild(subButton4);
        subContainer3.appendChild(subButton5);
        subContainer3.appendChild(subButton6);

        subContainer2.appendChild(subButton3);
        subContainer2.appendChild(subContainer3);

        subContainer1.appendChild(subButton1);
        subContainer1.appendChild(subButton2);
        subContainer1.appendChild(subContainer2);

        container.appendChild(mainButton);
        container.appendChild(subContainer1);

        document.body.appendChild(container);


    }
    //提取文件json数据
    function getproductList() {
        const list = window.__mtAllProductOrder ||[];
        if (!list.length) {
            alert("未捕获到商品列表，请先打开商品列表页面");
            return;
        }
        const row = list.flatMap(spu => {
            const skus = Array.isArray(spu.wmProductSkus) ? spu.wmProductSkus : [];
            if (!skus.length) {
                return [{
                    //------Spu信息--------
                    name: spu.name,//中文名
                    productCategory: spu.wmProductSpuExtends?.["1200000210"]?.value || "",//商品类别
                    productskus: spu.wmProductSkus || "",
                    //------Sku信息--------
                    spec: "",//规格
                    price: "",//价格
                    stock: "",//库存
                    weight: "",//重量
                    sourcefoodcode: ""//店内码
                }];
            }
            return skus.map(sku => ({
                //------Spu信息--------
                name: spu.name,//中文名
                productCategory: spu.wmProductSpuExtends?.["1200000210"]?.value || "",//商品类别
                //------Sku信息--------
                spec: sku.spec,//规格
                // 价格：分转元，并保留 1 位小数（保持为 number）
                price: (sku.price).toFixed(1),//价格
                stock: sku.stock,//库存
                weight: sku.weight || "",//重量
                sourcefoodcode: sku.sourceFoodCode || ""//店内码

            }));
        })
        console.log("下载的商品列表", row);
        const columns = ["name", "productCategory", "spec", "price", "stock", "weight", "sourcefoodcode"];
        const headers = ["商品名称", "选择销售属性", "商品规格名称", "价格（元）", "库存", "重量", "店内码/货号"];
        const csv = toCSV(row, columns, headers);
        downloadCSV("meituan_products.csv", csv);


    }
    //自动翻页
    async function autofetchpage() {
        //const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const iframedoc = getIframedoc();
        const pagesizeinput = iframedoc.querySelector('.roo-pagination .dropdown input[readonly][placeholder="请选择"]')//当前页码
        const productnumber = iframedoc.querySelector('.src-pages-ProductList-components-FilterTab-index_count')//当前商品数量
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
            lines.push(columns.map(k => escapeCell(r[k])).join(","));
        }
        return lines.join("\r\n");
    }
    //下载CSV文件
    function downloadCSV(filename, csvText) {
        // 加 BOM，Excel 打开中文不乱码
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
    //抓取到iframe
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
                if(!url||!url.startsWith("http"))
                {return;}
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

    //建立image_zip
    async function toimageZip(picgroups) {
        const image_zip = new JSZip();
        //文件夹名字清理函数
        function sanitizeFolderName(name) {
            return (name || "unknown").replace(/[\/\\:*?"<>|]/g, "_").trim();
        }
        for (const [name, urls] of picgroups.entries()) {
            const folder = image_zip.folder(sanitizeFolderName(name))
            for (let i = 0; i < urls.length; i++) {
                const url = urls[i];
                const safeUrl = url.replace(/^http:\/\//, "https://"); // 混合内容问题

                const res = await fetch(safeUrl);
                if (!res.ok) { console.warn("下载失败", res.status, safeUrl); continue; }
                const blob = await res.blob();

                // 文件名：按顺序命名，你也可以改成 001.jpg 这种
                const filename = `${name}-${i+1}.jpg`;
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


        window.__mtProductEable = false;// 是否启用商品列表抓取
        window.__mtProductList = window.__mtProductList || []; // 抓取到的商品列表
        window.__mtAllProductOrder = window.__mtAllProductOrder || [];// 所有商品的顺序列表

        console.log("主页面已加载");
        await wait(2000);
        mainWidget();

    }
    main();

})();
