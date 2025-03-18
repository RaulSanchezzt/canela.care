export default async function handler(req, res) {
  const { OPENROUTER_API_KEY } = process.env;

  // 1. Verificar si existe la API KEY
  if (!OPENROUTER_API_KEY) {
    console.error("❌ Missing OpenRouter API Key");
    return res.status(500).json({ error: "Missing OpenRouter API key" });
  }

  try {
    // 2. Prompt para el modelo (simplificado para que evite Markdown)
    const prompt = `
        Generate 3 short daily health tasks as a JSON array of strings.
        Return only raw JSON. Do not include Markdown formatting or code blocks.
      `;

    // 3. Llamada al endpoint de OpenRouter con el modelo Gemma 3 27B IT
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          // Estos headers son opcionales pero útiles si estás en producción
          "HTTP-Referer": "https://tu-app.vercel.app",
          "X-Title": "Tech App AI",
        },
        body: JSON.stringify({
          model: "google/gemma-3-1b-it:free",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 200,
        }),
      }
    );

    // 4. Parsear la respuesta JSON del fetch
    const data = await response.json();

    console.log("🟢 OpenRouter raw response:", JSON.stringify(data, null, 2));

    // 5. Verificar si hay choices en la respuesta
    if (!data.choices || !data.choices.length) {
      console.error("❌ No choices returned:", data);
      return res
        .status(500)
        .json({ error: "Invalid response from OpenRouter", raw: data });
    }

    // 6. Capturamos el contenido del mensaje
    const message = data.choices[0].message.content;

    console.log("🟢 AI message content:", message);

    // 7. Limpiamos el mensaje de posibles bloque Markdown ```json ... ```
    let cleanedMessage = message.trim();

    if (cleanedMessage.startsWith("```")) {
      cleanedMessage = cleanedMessage
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    }

    // 8. Parseamos el JSON de forma segura
    let tasks;
    try {
      tasks = JSON.parse(cleanedMessage);
    } catch (error) {
      console.error(
        "❌ JSON parse error:",
        error,
        "Original cleaned message:",
        cleanedMessage
      );
      return res
        .status(500)
        .json({ error: "Failed to parse tasks from AI response" });
    }

    // 9. Devolvemos el resultado final
    res.status(200).json({ tasks });
  } catch (error) {
    console.error("❌ API handler error:", error);
    res.status(500).json({ error: "Something went wrong generating tasks" });
  }
}
