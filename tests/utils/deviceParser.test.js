const { parseVisitMeta } = require("../../utils/deviceParser");

const mockReq = (overrides = {}) => ({
    headers: {
        "user-agent": "",
        ...overrides,
    },
});

describe("parseVisitMeta", () => {
    describe("device detection", () => {
        it("returns 'Desktop' for standard desktop user-agents", () => {
            const req = mockReq({
                "user-agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
            });
            expect(parseVisitMeta(req).device).toBe("Desktop");
        });

        it("returns 'Mobile' for mobile user-agents", () => {
            const req = mockReq({
                "user-agent":
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
            });
            expect(parseVisitMeta(req).device).toBe("Mobile");
        });

        it("returns 'Tablet' for tablet user-agents", () => {
            const req = mockReq({
                "user-agent":
                    "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
            });
            expect(parseVisitMeta(req).device).toBe("Tablet");
        });

        it("defaults to 'Desktop' when user-agent is empty", () => {
            expect(parseVisitMeta(mockReq()).device).toBe("Desktop");
        });
    });

    describe("browser detection", () => {
        it("detects Chrome", () => {
            const req = mockReq({
                "user-agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
            });
            expect(parseVisitMeta(req).browser).toBe("Chrome");
        });

        it("detects Safari", () => {
            const req = mockReq({
                "user-agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
            });
            expect(parseVisitMeta(req).browser).toBe("Safari");
        });

        it("returns 'Unknown' for empty user-agent", () => {
            expect(parseVisitMeta(mockReq()).browser).toBe("Unknown");
        });
    });

    describe("referrer", () => {
        it("extracts referer header", () => {
            const req = mockReq({ referer: "https://google.com/search?q=creator" });
            expect(parseVisitMeta(req).referrer).toBe("https://google.com/search?q=creator");
        });

        it("falls back to referrer header (alternative spelling)", () => {
            const req = mockReq({ referrer: "https://twitter.com/intent" });
            expect(parseVisitMeta(req).referrer).toBe("https://twitter.com/intent");
        });

        it("returns 'Direct' when no referrer headers present", () => {
            expect(parseVisitMeta(mockReq()).referrer).toBe("Direct");
        });
    });

    describe("country", () => {
        it("reads x-vercel-ip-country header", () => {
            const req = mockReq({ "x-vercel-ip-country": "US" });
            expect(parseVisitMeta(req).country).toBe("US");
        });

        it("falls back to cf-ipcountry header", () => {
            const req = mockReq({ "cf-ipcountry": "IN" });
            expect(parseVisitMeta(req).country).toBe("IN");
        });

        it("returns 'Unknown' when no country headers present", () => {
            expect(parseVisitMeta(mockReq()).country).toBe("Unknown");
        });
    });

    describe("return shape", () => {
        it("returns an object with device, browser, referrer, country", () => {
            const result = parseVisitMeta(mockReq());
            expect(result).toHaveProperty("device");
            expect(result).toHaveProperty("browser");
            expect(result).toHaveProperty("referrer");
            expect(result).toHaveProperty("country");
        });
    });
});
