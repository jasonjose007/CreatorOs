const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const CreatorRateCard = require("../model/creatorRateCard");
const rateCardController = require("../controller/rateCardController");

const app = express();
app.use(express.json());
app.get("/api/rate-cards/public/:slug", rateCardController.getPublicRateCard);

describe("GET /api/rate-cards/public/:slug — commission data leak prevention", () => {
    let testCreatorId;

    beforeEach(async () => {
        await CreatorRateCard.deleteMany({});
        testCreatorId = new mongoose.Types.ObjectId();
    });

    it("does NOT include agencyCommissionPercent in the public response", async () => {
        await CreatorRateCard.create({
            creatorId: testCreatorId,
            title: "Test Rate Card",
            slug: "test-rate-card",
            isPublic: true,
            agencyCommissionPercent: 15,
            rates: [
                { platform: "YouTube", contentType: "Sponsored Video", basePrice: 5000 },
            ],
        });

        const res = await request(app).get("/api/rate-cards/public/test-rate-card");

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.card).toBeDefined();
        // The critical assertion: agencyCommissionPercent must NOT appear
        expect(res.body.card.agencyCommissionPercent).toBeUndefined();
    });

    it("still includes public fields like title, rates, and slug", async () => {
        await CreatorRateCard.create({
            creatorId: testCreatorId,
            title: "Creator Rates",
            slug: "creator-rates",
            isPublic: true,
            agencyCommissionPercent: 20,
            rates: [
                { platform: "Instagram", contentType: "Reel", basePrice: 2000 },
            ],
        });

        const res = await request(app).get("/api/rate-cards/public/creator-rates");

        expect(res.statusCode).toBe(200);
        expect(res.body.card.title).toBe("Creator Rates");
        expect(res.body.card.slug).toBe("creator-rates");
        expect(res.body.card.rates).toBeDefined();
        expect(res.body.card.rates.length).toBe(1);
    });

    it("returns 404 for a non-existent slug", async () => {
        const res = await request(app).get("/api/rate-cards/public/does-not-exist");

        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
    });

    it("returns 404 for a private rate card", async () => {
        await CreatorRateCard.create({
            creatorId: testCreatorId,
            title: "Private Card",
            slug: "private-card",
            isPublic: false,
            agencyCommissionPercent: 10,
        });

        const res = await request(app).get("/api/rate-cards/public/private-card");

        expect(res.statusCode).toBe(404);
    });
});
