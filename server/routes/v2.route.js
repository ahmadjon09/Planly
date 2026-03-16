import express from "express";
import Product from "../models/product.js";

const router = express.Router();

const DEFAULT_UNIT = "дона";
const PRICE_TYPE_LABELS = {
    uz: "сўм",
    en: "$"
};

/* ------------------------------------------------
   HELPERS
------------------------------------------------ */

function normalizePattern(value = "") {
    return String(value).trim().replace(/\s+/g, "").toUpperCase();
}

function normalizePriceType(value = "") {
    return value === "en" ? "en" : "uz";
}

/* ------------------------------------------------
   TITLE ICHIDAN AUTO PATTERNLARNI TOPISH
   Hozircha:
   - 150D
   - 75D
   - B.
   - A107, A143 kabi kodlar
------------------------------------------------ */

function extractPatternsFromTitle(title = "") {
    const source = String(title).toUpperCase().trim();
    if (!source) return [];

    const regex = /(\b\d+\s*D\b)|(\b[A-Z]+\d+\b)|(B\.)/gi;
    const matches = [...source.matchAll(regex)];

    if (!matches.length) return [];

    return matches.map((m) => normalizePattern(m[0]));
}

/* ------------------------------------------------
   HAMMA PRODUCTLARDAN UNIQUE PATTERNLARNI OLISH
------------------------------------------------ */

function extractAllPatterns(products = []) {
    const seen = new Set();
    const patterns = [];

    for (const product of products) {
        const found = extractPatternsFromTitle(product?.title || "");

        for (const pattern of found) {
            if (!seen.has(pattern)) {
                seen.add(pattern);
                patterns.push(pattern);
            }
        }
    }

    return patterns;
}

/* ------------------------------------------------
   MANUAL KEYLARNI PARSE QILISH
------------------------------------------------ */

function parseManualKeys(keyParam) {
    if (!keyParam) return [];

    return String(keyParam)
        .split(",")
        .map((item) => normalizePattern(item))
        .filter(Boolean);
}

/* ------------------------------------------------
   AUTO MODE
------------------------------------------------ */

function getFirstAutoPattern(title = "") {
    const found = extractPatternsFromTitle(title);
    return found.length ? found[0] : null;
}

/* ------------------------------------------------
   MANUAL MODE
------------------------------------------------ */

function getFirstManualMatchedKey(title = "", keys = []) {
    const source = normalizePattern(title);
    if (!source || !keys.length) return null;

    for (const rawKey of keys) {
        const key = normalizePattern(rawKey);
        if (!key) continue;

        if (source.includes(key)) {
            return key;
        }
    }

    return null;
}

/* ------------------------------------------------
   PRICE FORMATTER
------------------------------------------------ */

function createPriceSummary(priceTypeTotals = {}) {
    return {
        uz: {
            value: Number(priceTypeTotals.uz || 0),
            currency: PRICE_TYPE_LABELS.uz,
            text: `${Number(priceTypeTotals.uz || 0)} ${PRICE_TYPE_LABELS.uz}`
        },
        en: {
            value: Number(priceTypeTotals.en || 0),
            currency: PRICE_TYPE_LABELS.en,
            text: `${Number(priceTypeTotals.en || 0)} ${PRICE_TYPE_LABELS.en}`
        }
    };
}

/* ------------------------------------------------
   BIR XIL SUMMARY BUILDER
------------------------------------------------ */

function buildProductsSummary(products = []) {
    let totalKg = 0;
    let totalStock = 0;
    let totalCount = 0;
    let totalProducts = 0;

    const unitTotals = {};
    const priceTypeTotals = {
        uz: 0,
        en: 0
    };

    for (const product of products) {
        const stock = Number(product?.stock || 0);
        const count = Number(product?.count || 0);
        const price = Number(product?.price || 0);
        const unit = product?.unit || DEFAULT_UNIT;
        const priceType = normalizePriceType(product?.priceType);

        totalProducts += 1;
        totalStock += stock;
        totalCount += count;

        if (unit === "кг") {
            totalKg += stock;
        }

        if (!unitTotals[unit]) {
            unitTotals[unit] = 0;
        }
        unitTotals[unit] += stock;

        priceTypeTotals[priceType] += price * stock;
    }

    return {
        totalProducts,
        totalStock,
        totalCount,
        totalKg,
        unitTotals,
        priceTotals: createPriceSummary(priceTypeTotals)
    };
}

/* ------------------------------------------------
   GROUP RESULT
------------------------------------------------ */

function buildGroupResult(pattern, ready, matchedProducts = []) {
    return {
        pattern,
        ready,
        ...buildProductsSummary(matchedProducts),
        products: matchedProducts
    };
}

/* ------------------------------------------------
   READY BO'YICHA AJRATISH
------------------------------------------------ */

function filterByReady(products = [], readyValue = false) {
    return products.filter((p) => Boolean(p?.ready) === readyValue);
}

/* ------------------------------------------------
   AUTO GROUP + UNGROUPED
------------------------------------------------ */

function groupProductsAuto(products = [], readyValue = false) {
    const filteredProducts = filterByReady(products, readyValue);
    const patterns = extractAllPatterns(filteredProducts);
    const used = new Set();
    const groups = [];

    for (const pattern of patterns) {
        const matched = [];

        for (const product of filteredProducts) {
            const id = String(product?._id || "");
            if (!id) continue;
            if (used.has(id)) continue;

            const firstPattern = getFirstAutoPattern(product?.title || "");
            if (firstPattern === pattern) {
                matched.push(product);
                used.add(id);
            }
        }

        if (!matched.length) continue;

        groups.push(buildGroupResult(pattern, readyValue, matched));
    }

    const unGroupedProducts = filteredProducts.filter((product) => {
        const id = String(product?._id || "");
        return id && !used.has(id);
    });

    return {
        groups,
        unGroupedProducts,
        possibleKeys: patterns
    };
}

/* ------------------------------------------------
   MANUAL GROUP + UNGROUPED
------------------------------------------------ */

function groupProductsByManualKeys(products = [], keys = [], readyValue = false) {
    const filteredProducts = filterByReady(products, readyValue);
    const normalizedKeys = keys.map((key) => normalizePattern(key)).filter(Boolean);

    const used = new Set();
    const groups = [];

    for (const key of normalizedKeys) {
        const matched = [];

        for (const product of filteredProducts) {
            const id = String(product?._id || "");
            if (!id) continue;
            if (used.has(id)) continue;

            const firstMatchedKey = getFirstManualMatchedKey(product?.title || "", normalizedKeys);
            if (firstMatchedKey === key) {
                matched.push(product);
                used.add(id);
            }
        }

        if (!matched.length) continue;

        groups.push(buildGroupResult(key, readyValue, matched));
    }

    const unGroupedProducts = filteredProducts.filter((product) => {
        const id = String(product?._id || "");
        return id && !used.has(id);
    });

    return {
        groups,
        unGroupedProducts,
        possibleKeys: extractAllPatterns(filteredProducts)
    };
}

/* ------------------------------------------------
   SINGLE KEY FILTER + UNGROUPED
------------------------------------------------ */

function filterProductsBySingleKey(products = [], key = "", readyValue = false) {
    const normalizedKey = normalizePattern(key);
    const filteredProducts = filterByReady(products, readyValue);

    if (!normalizedKey) {
        return {
            groups: [],
            unGroupedProducts: filteredProducts,
            possibleKeys: extractAllPatterns(filteredProducts)
        };
    }

    const matched = [];
    const used = new Set();

    for (const product of filteredProducts) {
        const id = String(product?._id || "");
        const title = normalizePattern(product?.title || "");

        if (!id) continue;

        if (title.includes(normalizedKey)) {
            matched.push(product);
            used.add(id);
        }
    }

    const groups = matched.length
        ? [buildGroupResult(normalizedKey, readyValue, matched)]
        : [];

    const unGroupedProducts = filteredProducts.filter((product) => {
        const id = String(product?._id || "");
        return id && !used.has(id);
    });

    return {
        groups,
        unGroupedProducts,
        possibleKeys: extractAllPatterns(filteredProducts)
    };
}

/* ------------------------------------------------
   READY SECTION BUILDER
------------------------------------------------ */

function buildReadySection(readyValue, groupedData) {
    const groups = groupedData?.groups || [];
    const unGroupedProducts = groupedData?.unGroupedProducts || [];
    const possibleKeys = groupedData?.possibleKeys || [];

    const groupedProductsFlat = groups.flatMap((group) => group.products || []);

    const groupedSummary = buildProductsSummary(groupedProductsFlat);
    const unGroupedSummary = buildProductsSummary(unGroupedProducts);
    const allSummary = buildProductsSummary([...groupedProductsFlat, ...unGroupedProducts]);

    return {
        ready: readyValue,

        totalGroups: groups.length,
        possibleKeys,

        groupedSummary,
        unGroupedSummary,
        totalSummary: allSummary,

        groups,
        unGroupedProducts
    };
}

/* ------------------------------------------------
   ROUTE
------------------------------------------------

GET /api/product-groups
GET /api/product-groups?key=150D
GET /api/product-groups?key=150D,B.
GET /api/product-groups?key=150D&single=true

------------------------------------------------ */

router.get("/", async (req, res) => {
    try {
        const { key, single } = req.query;

        const products = await Product.find({})
            .sort({ createdAt: -1, title: 1 })
            .lean();

        let readyTrueData;
        let readyFalseData;
        let mode = "auto";

        if (key) {
            const manualKeys = parseManualKeys(key);

            if (manualKeys.length) {
                if (String(single) === "true" && manualKeys.length === 1) {
                    mode = "single-key";
                    readyTrueData = filterProductsBySingleKey(products, manualKeys[0], true);
                    readyFalseData = filterProductsBySingleKey(products, manualKeys[0], false);
                } else {
                    mode = "manual-keys";
                    readyTrueData = groupProductsByManualKeys(products, manualKeys, true);
                    readyFalseData = groupProductsByManualKeys(products, manualKeys, false);
                }
            } else {
                mode = "auto";
                readyTrueData = groupProductsAuto(products, true);
                readyFalseData = groupProductsAuto(products, false);
            }
        } else {
            mode = "auto";
            readyTrueData = groupProductsAuto(products, true);
            readyFalseData = groupProductsAuto(products, false);
        }

        const readyTrue = buildReadySection(true, readyTrueData);
        const readyFalse = buildReadySection(false, readyFalseData);

        const overallSummary = buildProductsSummary(products);

        return res.status(200).json({
            success: true,
            mode,
            overallSummary,
            data: {
                readyTrue,
                readyFalse
            }
        });
    } catch (error) {
        console.error("product-groups error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

export default router;