const axios = require("axios");

const getWikipediaKnowledge = async (question) => {
    try {
        console.log("Searching Wikipedia for:", question);

        // Step 1: Search for the most relevant Wikipedia article
        const searchResponse = await axios.get(
            "https://en.wikipedia.org/w/api.php",
            {
                params: {
                    action: "query",
                    list: "search",
                    srsearch: question,
                    format: "json",
                    utf8: 1
                },
                headers: {
                    "User-Agent":
                        "SmartReasoningAssistant/1.0"
                }
            }
        );

        const searchResults =
            searchResponse.data?.query?.search || [];

        if (searchResults.length === 0) {
            console.log("No Wikipedia search result found.");

            return {
                title: null,
                content: null
            };
        }

        const title = searchResults[0].title;

        console.log(
            "Wikipedia article found:",
            title
        );

        // Step 2: Fetch the article introduction
        const contentResponse = await axios.get(
            "https://en.wikipedia.org/w/api.php",
            {
                params: {
                    action: "query",
                    prop: "extracts",
                    exintro: true,
                    explaintext: true,
                    redirects: 1,
                    titles: title,
                    format: "json"
                },
                headers: {
                    "User-Agent":
                        "SmartReasoningAssistant/1.0"
                }
            }
        );

        const pages =
            contentResponse.data?.query?.pages;

        if (!pages) {
            return {
                title,
                content: null
            };
        }

        const page = Object.values(pages)[0];

        const content =
            page?.extract?.trim() || null;

        console.log(
            "Wikipedia content retrieved:",
            content
                ? content.substring(0, 100)
                : "No content"
        );

        return {
            title,
            content
        };

    } catch (error) {
        console.error(
            "Wikipedia Service Error:",
            error.response?.data ||
            error.message
        );

        return {
            title: null,
            content: null
        };
    }
};

module.exports = getWikipediaKnowledge;