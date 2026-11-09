import logging
from langchain_core.tools import tool
from ddgs import DDGS

@tool(
    description="Perform a web search using DuckDuckGo and return the top results.",
)
def web_search_tool(query: str) -> str:
    logging.info(f"Performing web search for query: {query}")
    try:
        clean_query = query.strip().strip('"').strip("'")
        with DDGS() as d:
            results = []
            try:
                results = list(d.text(clean_query, region="us-en", max_results=3))
            except Exception as e:
                logging.warning(f"Initial web search failed for query '{clean_query}': {e}")

            if not results:
                # If an overly specific query returns 0 results, retry with first key terms
                words = clean_query.split()
                if len(words) > 6:
                    broader_query = " ".join(words[:6])
                    logging.info(f"Retrying with broader query: {broader_query}")
                    try:
                        results = list(d.text(broader_query, region="us-en", max_results=3))
                    except Exception as e:
                        logging.warning(f"Broader search failed for '{broader_query}': {e}")

            if not results:
                return f"[Query: {query}]\nNo search results found."

            formatted = []
            for r in results:
                title = r.get("title", "")
                link = r.get("href", "") or r.get("url", "")
                snippet = r.get("body", "") or r.get("snippet", "")
                formatted.append(f"[snippet: {snippet}, title: {title}, link: {link}]")

            return f"[Query: {query}]\n" + "\n".join(formatted)
    except Exception as e:
        logging.error(f"Error during web search: {e}")
        return f"Search error for '{query}': {str(e)}"

TOOLS = [web_search_tool]
TOOLS_BY_NAME = {t.name: t for t in TOOLS}
