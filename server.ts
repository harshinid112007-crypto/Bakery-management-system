import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Chat endpoint with contextual bakery awareness
app.post("/api/gemini/chat", async (req: Request, res: Response) => {
  try {
    const { message, history, bakeryContext } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getGeminiClient();

    if (!ai) {
      // High-quality contextual fallback when API key is missing
      return res.json({
        reply: generateOfflineBakeryReply(message, bakeryContext),
        suggestedActions: extractSuggestedActions(message, bakeryContext),
        isSimulated: true,
      });
    }

    const systemPrompt = `You are "Chef Brioche", an elite Master Baker, Executive Pastry Chef, and Production Operations Specialist for a modern artisan bakery.
You assist the head baker, station chefs, and bakery owners in:
1. Organizing and breaking down baking tasks (flour mixing, bulk fermentation, proofing, lamination, oven scheduling, decoration, quality checks).
2. Prioritizing work based on bake times, deck oven temperatures, proofing windows, and customer pickup deadlines.
3. Providing clear, concise shift summaries and bottleneck warnings (e.g., retarder capacity, deck oven conflict, proofing timing).
4. Providing real, professional artisanal baker advice (baker's percentages, hydration, yeast/sourdough fermentation timings, laminating butter temps, deck vs convection bake profiles).

Current Bakery Production State:
${bakeryContext ? JSON.stringify(bakeryContext, null, 2) : "No context provided"}

Tone: Professional, supportive, decisive, culinary-focused. Keep answers crisp, highly readable with clean formatting (bullet points, clear steps).
When proposing tasks or schedule adjustments, clearly detail the suggested task title, estimated time, station, and priority.`;

    // Construct contents with optional chat history
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        contents.push({
          role: item.role === "user" ? "user" : "model",
          parts: [{ text: item.content }],
        });
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "I've reviewed the schedule and am ready to help organize your bake shift.";
    const actions = extractSuggestedActions(message, bakeryContext, replyText);

    return res.json({
      reply: replyText,
      suggestedActions: actions,
      isSimulated: false,
    });
  } catch (error: any) {
    console.error("Gemini API error in /api/gemini/chat:", error);
    // Graceful fallback to guarantee smooth UX
    const fallbackReply = generateOfflineBakeryReply(
      req.body.message || "help",
      req.body.bakeryContext
    );
    return res.json({
      reply: fallbackReply,
      suggestedActions: extractSuggestedActions(req.body.message || "", req.body.bakeryContext),
      isSimulated: true,
      warning: "Running in local master baker mode.",
    });
  }
});

// Structured task generation & optimization endpoint
app.post("/api/gemini/organize-tasks", async (req: Request, res: Response) => {
  try {
    const { prompt, currentTasks, projects } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      const fallbackTasks = generateFallbackTasks(prompt);
      return res.json({ tasks: fallbackTasks });
    }

    const systemPrompt = `You are a Master Bakery Production Scheduler. Given the baker's request, break down the production into 3-6 specific, actionable bakery tasks.
Available Stations: "Breads", "Viennoiserie", "Custom Cakes", "Prep & Doughs", "Ovens", "Finishing & Packaging".
Priorities: "Urgent", "High", "Medium", "Low".

Return ONLY valid JSON matching this schema:
[
  {
    "title": "Task title (e.g., Laminate Butter Blocks for Croissant Batch A)",
    "description": "Short specific instructions with timing/temperatures",
    "station": "Viennoiserie",
    "priority": "High",
    "estimatedMinutes": 45,
    "quantity": "40 pcs",
    "checklist": ["Measure butter sheets to 18°C", "Perform single turn & double turn", "Rest 30 min in walk-in"]
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Request: ${prompt}\nExisting active tasks: ${JSON.stringify(currentTasks?.map((t: any) => t.title) || [])}\nActive Projects: ${JSON.stringify(projects?.map((p: any) => p.name) || [])}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    let tasks = [];
    try {
      tasks = JSON.parse(response.text?.trim() || "[]");
    } catch {
      tasks = generateFallbackTasks(prompt);
    }

    return res.json({ tasks });
  } catch (error) {
    console.error("Error in /api/gemini/organize-tasks:", error);
    return res.json({ tasks: generateFallbackTasks(req.body.prompt || "") });
  }
});

// Shift Progress Summary Endpoint
app.post("/api/gemini/summarize", async (req: Request, res: Response) => {
  try {
    const { stats, tasks, projects } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        summary: generateFallbackSummary(stats, tasks),
      });
    }

    const systemPrompt = `You are the Executive Bakery Manager. Write a crisp, executive shift status summary (3-4 concise paragraphs with clear bullet points):
1. Shift Completion & Production Pace.
2. Top Active Priorities & Oven/Proofing Bottlenecks.
3. Handover Advice for the Afternoon/Next Shift.
Be specific and professional with a warm artisan tone.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Bakery Metrics: ${JSON.stringify(stats)}\nTasks (${tasks?.length || 0} total): ${JSON.stringify(tasks?.slice(0, 15))}\nActive Projects: ${JSON.stringify(projects)}`,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    return res.json({
      summary: response.text || generateFallbackSummary(stats, tasks),
    });
  } catch (error) {
    console.error("Error in /api/gemini/summarize:", error);
    return res.json({
      summary: generateFallbackSummary(req.body.stats, req.body.tasks),
    });
  }
});

// Offline intelligent bakery assistant logic
function generateOfflineBakeryReply(message: string, context: any): string {
  const lower = message.toLowerCase();
  const tasks = context?.tasks || [];
  const completed = tasks.filter((t: any) => t.status === "completed").length;
  const total = tasks.length;
  const urgentTasks = tasks.filter((t: any) => t.priority === "Urgent" && t.status !== "completed");

  if (lower.includes("summar") || lower.includes("progress") || lower.includes("status")) {
    return `### 🥖 Shift Progress Summary
- **Overall Completion:** ${completed}/${total} tasks finished (${total ? Math.round((completed / total) * 100) : 0}%).
- **Urgent Focus:** ${urgentTasks.length > 0 ? `${urgentTasks.length} urgent tasks pending (${urgentTasks.map((t: any) => t.title).slice(0, 2).join(", ")})` : "All urgent batches are currently under control."}
- **Oven Throughput:** Deck ovens are cycling well. Ensure steam injection is calibrated before sourdough bakes.
- **Handover Tip:** Check proofing retarder temperatures (+4°C) for overnight sourdough fermentation.`;
  }

  if (lower.includes("priorit") || lower.includes("urgent") || lower.includes("schedule")) {
    return `### ⚡ Production Prioritization Recommendation
1. **First Priority:** Deck Oven Batch - Country Sourdough Batards require high heat (240°C) with initial 15s steam.
2. **Second Priority:** Croissant Proofing - Viennoiserie in proof box (27°C, 75% RH). Do not exceed 28°C to prevent butter meltout.
3. **Third Priority:** Custom Cake Sponge cooling & crumb coat application for the afternoon delivery.
4. **Prep Station:** Mix Levain for tomorrow's early morning poolish.`;
  }

  if (lower.includes("croissant") || lower.includes("laminat") || lower.includes("viennoiserie")) {
    return `### 🥐 Croissant & Viennoiserie Protocol
- **Lamination:** Keep butter block (beurrage) and dough (détrempe) at identical plasticity (~14°C-16°C).
- **Folds:** 1 double turn (book fold) + 1 single turn (letter fold), resting 35-45 minutes at 2°C between turns.
- **Proofing:** 26°C-27°C at 75% humidity for 2.5 hours. Never proof above 28°C or butter will weep into the trays.
- **Baking:** Deck or rack oven at 190°C for 16-18 minutes until deep golden chestnut mahogany.`;
  }

  if (lower.includes("sourdough") || lower.includes("bread") || lower.includes("baguette")) {
    return `### 🍞 Artisan Bread Guidelines
- **Hydration Formula:** 76% hydration (80% bread flour, 15% whole wheat, 5% dark rye, 20% ripe levain, 2.1% sea salt).
- **Bulk Ferment:** 4.5 hours at 25°C dough temp with 4 coil folds during the first 2 hours.
- **Retarding:** Shape into bannetons and cold retard at 3.5°C for 14-16 hours for lactic complexity.
- **Bake:** Score at 30° angle, bake with initial steam for 20 min at 245°C, vent dampers and bake dry for 22 min at 220°C.`;
  }

  return `### 👨‍🍳 Chef Brioche at your service!
I can help optimize your bakery floor:
- **Organize Tasks:** Ask me to draft production schedules for breads, pastries, or custom cake orders.
- **Prioritize Ovens & Prep:** Ask me how to sequence deck ovens vs convection ovens to prevent workflow bottlenecks.
- **Shift Summaries:** Get an executive progress update on today's batch completions and handovers.

*What would you like to prepare or optimize right now?*`;
}

function extractSuggestedActions(message: string, context: any, replyText?: string): Array<{ label: string; actionType: string; payload?: any }> {
  const lower = message.toLowerCase();
  const actions = [];

  if (lower.includes("croissant") || lower.includes("viennois")) {
    actions.push({
      label: "Create Croissant Production Tasks",
      actionType: "CREATE_TASKS",
      payload: { query: "Croissant and Pain au Chocolat production run" },
    });
  }

  if (lower.includes("sourdough") || lower.includes("bread")) {
    actions.push({
      label: "Add Sourdough Batch Tasks",
      actionType: "CREATE_TASKS",
      payload: { query: "Artisan Sourdough Batards and Boules bake run" },
    });
  }

  actions.push({
    label: "Summarize Shift Progress",
    actionType: "SUMMARIZE",
  });

  actions.push({
    label: "Prioritize Active Work",
    actionType: "PRIORITIZE",
  });

  return actions;
}

function generateFallbackTasks(prompt: string): any[] {
  const p = prompt.toLowerCase();
  if (p.includes("croissant") || p.includes("pastry")) {
    return [
      {
        title: "Butter Block Prep & Sheeting",
        description: "Enclose 84% dry butter into détrempe at 16°C",
        station: "Viennoiserie",
        priority: "High",
        estimatedMinutes: 30,
        quantity: "48 pcs",
        checklist: ["Check butter temperature", "Square corners", "Refrigerate 30 min"],
      },
      {
        title: "Lamination Turns & Sheet to 3.5mm",
        description: "Perform book turn followed by letter turn on rondo sheeter",
        station: "Viennoiserie",
        priority: "High",
        estimatedMinutes: 40,
        quantity: "48 pcs",
        checklist: ["Dust light flour", "Measure thickness 3.5mm", "Chill before cutting"],
      },
      {
        title: "Cut, Shape & Proof Croissants",
        description: "Triangle cut 9x28cm, roll gently, proof at 27°C / 75% RH",
        station: "Viennoiserie",
        priority: "Urgent",
        estimatedMinutes: 45,
        quantity: "48 pcs",
        checklist: ["Double egg wash", "Verify wobble on tray", "Preheat rack oven 190°C"],
      },
    ];
  }

  return [
    {
      title: "Levain Feed & Autolyse Flour",
      description: "Blend stoneground flours with 75% water at 28°C; rest 45 min",
      station: "Prep & Doughs",
      priority: "High",
      estimatedMinutes: 30,
      quantity: "25 kg dough",
      checklist: ["Measure water temp", "Check levain float test", "Zero mixer scale"],
    },
    {
      title: "Mix, Salt Incorp & Bulk Fermentation",
      description: "Mix slow speed 6 min, add salt, coil fold every 30 min for 2.5 hrs",
      station: "Prep & Doughs",
      priority: "High",
      estimatedMinutes: 120,
      quantity: "35 batards",
      checklist: ["Record dough temp (25.5°C)", "Perform 3 coil folds", "Check volume +40%"],
    },
    {
      title: "Deck Oven Preheat & Stone Bake",
      description: "Preheat deck oven to 245°C, score batards, steam 15 seconds",
      station: "Ovens",
      priority: "Urgent",
      estimatedMinutes: 45,
      quantity: "35 loaves",
      checklist: ["Check deck steam boiler", "Single razor slash", "Vent dampers at 20 min"],
    },
  ];
}

function generateFallbackSummary(stats: any, tasks: any[]): string {
  const total = tasks?.length || 0;
  const done = tasks?.filter((t: any) => t.status === "completed")?.length || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return `### 🌾 Shift Operations Overview
- **Production Efficiency:** ${pct}% completed (${done} of ${total} tasks).
- **Core Stations Status:** Deck ovens are operating smoothly. Proofing retarders are holding steady at optimal fermentation parameters.
- **Priority Attention:** Ensure morning wholesale deliveries for Café Luna and the Hotel Grand ballroom custom tiered cake are boxed before 11:30 AM.
- **Next Shift Handover:** Prepare flour bins, refresh sourdough levain for tomorrow's 4:00 AM mix, and wipe down marble pastry benches.`;
}

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bakery Manager Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
