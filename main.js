/**
 * الإعدادات العامة
 */
const CONFIG = {
    API_KEY: "941681125b79fe3fc18aeba1",
    REFRESH_INTERVAL: 15000, // 10 ثواني
    GOLD_CONVERSION: 31.1034768 // أونصة إلى جرام
};

let lastState = {}; // لتخزين الأسعار السابقة ومقارنة الصعود/الهبوط

/**
 * دالة جلب البيانات من المصادر الخارجية
 */
async function syncMarket() {
    try {
        const [currencyRes, goldRes] = await Promise.all([
            fetch(`https://v6.exchangerate-api.com/v6/${CONFIG.API_KEY}/latest/USD`),
            fetch("https://api.gold-api.com/price/XAU")
        ]);

        if (!currencyRes.ok || !goldRes.ok) throw new Error("Network Response Error");

        const currencyData = await currencyRes.json();
        const goldData = await goldRes.json();

        const egpRate = currencyData.conversion_rates.EGP;
        const goldGramPrice = goldData.price / CONFIG.GOLD_CONVERSION;

        // مصفوفة البيانات: سهلة التعديل، أضف أو احذف من هنا
        const marketItems = [
            { id: 'g24', name: 'ذهب عيار 24', symbol: 'XAU/24K', usd: goldGramPrice, egp: goldGramPrice * egpRate },
            { id: 'g21', name: 'ذهب عيار 21', symbol: 'XAU/21K', usd: goldGramPrice * 0.875, egp: (goldGramPrice * 0.875) * egpRate },
            { id: 'g18', name: 'ذهب عيار 18', symbol: 'XAU/18K', usd: goldGramPrice * 0.75, egp: (goldGramPrice * 0.75) * egpRate },
            { id: 'usd', name: 'الدولار الأمريكي', symbol: 'USD/EGP', usd: 1, egp: egpRate },
            { id: 'eur', name: 'اليورو', symbol: 'EUR/USD', usd: 1 / currencyData.conversion_rates.EUR, egp: egpRate / currencyData.conversion_rates.EUR },
            { id: 'sar', name: 'الريال السعودي', symbol: 'SAR/USD', usd: 1 / currencyData.conversion_rates.SAR, egp: egpRate / currencyData.conversion_rates.SAR },
            { id: 'aed', name: 'الدرهم الإماراتي', symbol: 'AED/USD', usd: 1 / currencyData.conversion_rates.AED, egp: egpRate / currencyData.conversion_rates.AED }
        ];

        renderUI(marketItems);
        updateTimestamp();

    } catch (err) {
        console.error("حدث خطأ أثناء مزامنة البيانات:", err);
    }
}

/**
 * دالة بناء واجهة المستخدم
 */
function renderUI(items) {
    const tableBody = document.getElementById('market-data');
    let rowsHtml = "";

    items.forEach(item => {
        // تحديد كلاس اللون بناءً على السعر السابق
        const trendClass = getTrendClass(item.id, item.egp);
        lastState[item.id] = item.egp;

        rowsHtml += `
            <tr>
                <td class="asset-name text-right">${item.name}</td>
                <td><span class="symbol">${item.symbol}</span></td>
                <td class="${trendClass}">${formatNumber(item.egp, 2, 4)}</td>
                <td style="color:#666">$${formatNumber(item.usd, 2, 4)}</td>
            </tr>
        `;
    });

    tableBody.innerHTML = rowsHtml;
}

/**
 * وظائف مساعدة (Helpers)
 */
function getTrendClass(id, currentPrice) {
    if (!lastState[id]) return "";

    const prev = Number(lastState[id]);
    const curr = Number(currentPrice);

    if (curr > prev) return "up";
    if (curr < prev) return "down";
    return "";
}


function formatNumber(num, min, max) {
    return num.toLocaleString('en-US', { minimumFractionDigits: min, maximumFractionDigits: max });
}

function updateTimestamp() {
    document.getElementById('timer').innerText = new Date().toLocaleTimeString('ar-EG');
}

// البدء والتشغيل الدوري
syncMarket();
setInterval(syncMarket, CONFIG.REFRESH_INTERVAL);
// ###############################