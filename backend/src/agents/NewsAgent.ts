import axios from 'axios';

const TAVILY_KEY = process.env.TAVILY_API_KEY;

export interface NewsResult {
    summary: string;
    sources: { title: string; url: string }[];
}

export class NewsAgent {
    async searchWeb(query: string, maxResults: number = 5): Promise<{ title: string; url: string }[]> {
        if (!TAVILY_KEY) {
            return [
                { title: "(mock) Industry brief", url: "https://example.com/brief" },
                { title: "(mock) Company earnings", url: "https://example.com/earnings" },
            ];
        }
        try {
            const response = await axios.post("https://api.tavily.com/search", {
                api_key: TAVILY_KEY,
                query: query,
                max_results: maxResults
            });
            const results = response.data.results || [];
            return results.map((res: any) => ({
                title: res.title || "result",
                url: res.url
            }));
        } catch (error) {
            console.error("Tavily search failed", error);
            return [{ title: "No results", url: "" }];
        }
    }

    async analyze(sector: string): Promise<NewsResult> {
        const query = `${sector} sector India outlook 2025 2026 news trends`;
        const sources = await this.searchWeb(query, 5);

        // In a real LLM app, we would summarize the content of these URLs here.
        // For now, we return the sources and a placeholder summary.
        return {
            summary: `Recent news indicates strong momentum in the ${sector} sector, driven by digital transformation and global demand. Key themes include AI adoption and supply chain resilience.`,
            sources
        };
    }
}
