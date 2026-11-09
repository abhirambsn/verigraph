const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

export async function agentStream(task: string, onMessage: (message: string) => void): Promise<void> {
  const response = await fetch(`${API_BASE}/api/research/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ task }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server returned ${response.status}: ${errorText}`);
  }

  if (!response.body) throw new Error("ReadableStream not supported");

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  const processBlock = (block: string) => {
    const lines = block.split(/\r?\n/);
    let eventType = "message";
    const dataParts: string[] = [];

    for (const line of lines) {
      if (line.startsWith(":")) continue; // SSE comment or ping
      if (line.startsWith("event:")) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataParts.push(line.slice(5).trim());
      }
    }

    if (dataParts.length === 0) return;
    try {
      const parsed = JSON.parse(dataParts.join("\n"));
      onMessage(JSON.stringify({ event: eventType, data: parsed }));
    } catch (e) {
      console.warn("Failed to parse SSE JSON payload:", dataParts.join("\n"), e);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      if (buffer.trim()) {
        processBlock(buffer);
      }
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    while (true) {
      const crlfIdx = buffer.indexOf("\r\n\r\n");
      const lfIdx = buffer.indexOf("\n\n");

      let delimIdx = -1;
      let delimLen = 0;

      if (crlfIdx !== -1 && lfIdx !== -1) {
        if (crlfIdx < lfIdx) {
          delimIdx = crlfIdx;
          delimLen = 4;
        } else {
          delimIdx = lfIdx;
          delimLen = 2;
        }
      } else if (crlfIdx !== -1) {
        delimIdx = crlfIdx;
        delimLen = 4;
      } else if (lfIdx !== -1) {
        delimIdx = lfIdx;
        delimLen = 2;
      } else {
        break;
      }

      const block = buffer.slice(0, delimIdx);
      buffer = buffer.slice(delimIdx + delimLen);

      if (block.trim()) {
        processBlock(block);
      }
    }
  }
}
