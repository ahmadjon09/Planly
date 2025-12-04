import Product from "../models/product.js";

export const fixPriceTypes = async () => {
    try {
        console.log("⏳ PriceType avtomatik tekshirilmoqda...");

        const products = await Product.find();

        for (const p of products) {
            let newType = p.priceType;

            // USD → en
            if (["usd", "USD", "Usd"].includes(p.priceType)) {
                newType = "en";
            }

            // UZ → uz
            if (["uz", "UZ", "Uz"].includes(p.priceType)) {
                newType = "uz";
            }

            // Agar o'zgargan bo'lsa, saqlaymiz
            if (newType !== p.priceType) {
                p.priceType = newType;
                await p.save();
                console.log(`✔ ${p.title} yangilandi → ${newType}`);
            }
        }

        console.log("✅ PriceType yangilanishi tugadi.\n");

    } catch (error) {
        console.error("❌ PriceType yangilashda xato:", error);
    }
};
