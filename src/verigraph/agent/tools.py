import logging
from langchain_core.tools import tool
from langchain_community.tools import DuckDuckGoSearchResults

search_engine = DuckDuckGoSearchResults(num_results=3)

@tool(
    description="Perform a web search using DuckDuckGo and return the top results.",
)
def web_search_tool(query: str) -> str:
  logging.info(f"Performing web search for query: {query}")
  try:
    results = search_engine.run(query)
    return f"[Query: {query}]\n{results}"
  except Exception as e:
    logging.error(f"Error during web search: {e}")
    return f"Search error for '{query}': {str(e)}"


TOOLS = [web_search_tool]
TOOLS_BY_NAME = {t.name: t for t in TOOLS}
