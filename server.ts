import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import type { BakeryTask, Project } from "./src/types";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getOvens,
  updateOven,
  seedDatabase,
  getDatabaseHealth,
  isSupabaseConfigured,
} from "./server/supabase";

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
    supabaseConfigured: isSupabaseConfigured(),
    time: new Date().toISOString(),
  });
});

// -----------------------------------------------------------------------------
// Supabase Database & Health Endpoints
// -----------------------------------------------------------------------------
app.get("/api/db/status", async (_req: Request, res: Response) => {
  try {
    const health = await getDatabaseHealth();
    res.json(health);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to inspect database health" });
  }
});

app.post("/api/db/seed", async (_req: Request, res: Response) => {
  try {
    const result = await seedDatabase();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to seed database" });
  }
});

app.get("/api/db/schema", (_req: Request, res: Response) => {
  try {
    const schemaPath = path.join(process.cwd(), "supabase", "schema.sql");
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, "utf-8");
      res.type("text/plain").send(sql);
    } else {
      res.status(404).send("-- Schema file not found");
    }
  } catch (err: any) {
    res.status(500).send(`-- Error reading schema: ${err.message}`);
  }
});

// -----------------------------------------------------------------------------
// Tasks CRUD Endpoints (Connected to Supabase PostgreSQL)
// -----------------------------------------------------------------------------
app.get("/api/tasks", async (_req: Request, res: Response) => {
  try {
    const tasks = await getTasks();
    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch tasks" });
  }
});

app.post("/api/tasks", async (req: Request, res: Response) => {
  try {
    const created = await createTask(req.body);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create task" });
  }
});

app.put("/api/tasks/:id", async (req: Request, res: Response) => {
  try {
    const updated = await updateTask(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update task" });
  }
});

app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
  try {
    const success = await deleteTask(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete task" });
  }
});

// -----------------------------------------------------------------------------
// Projects CRUD Endpoints (Connected to Supabase PostgreSQL)
// -----------------------------------------------------------------------------
app.get("/api/projects", async (_req: Request, res: Response) => {
  try {
    const projects = await getProjects();
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch projects" });
  }
});

app.post("/api/projects", async (req: Request, res: Response) => {
  try {
    const created = await createProject(req.body);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create project" });
  }
});

app.put("/api/projects/:id", async (req: Request, res: Response) => {
  try {
    const updated = await updateProject(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update project" });
  }
});

app.delete("/api/projects/:id", async (req: Request, res: Response) => {
  try {
    const success = await deleteProject(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete project" });
  }
});

// -----------------------------------------------------------------------------
// Ovens Telemetry Endpoints (Connected to Supabase PostgreSQL)
// -----------------------------------------------------------------------------
app.get("/api/ovens", async (_req: Request, res: Response) => {
  try {
    const ovens = await getOvens();
    res.json(ovens);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch ovens" });
  }
});

app.put("/api/ovens/:id", async (req: Request, res: Response) => {
  try {
    const updated = await updateOven(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update oven" });
  }
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

// -----------------------------------------------------------------------------
// AI-Powered Natural Language Record Search Endpoint
// -----------------------------------------------------------------------------
app.post("/api/ai/natural-search", async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const cleanQuery = query.trim();

    // Retrieve active records (from request body or database)
    let tasks: BakeryTask[] = Array.isArray(req.body.tasks) && req.body.tasks.length > 0 ? req.body.tasks : [];
    let projects: Project[] = Array.isArray(req.body.projects) && req.body.projects.length > 0 ? req.body.projects : [];

    if (tasks.length === 0) {
      tasks = await getTasks();
    }
    if (projects.length === 0) {
      projects = await getProjects();
    }

    const ai = getGeminiClient();

    if (!ai) {
      const fallbackResult = performFallbackNaturalSearch(cleanQuery, tasks, projects);
      return res.json(fallbackResult);
    }

    // Prepare token-optimized summary representation of records
    const tasksContext = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      desc: t.description,
      station: t.station,
      priority: t.priority,
      status: t.status,
      due: t.dueTime,
      minutes: t.estimatedMinutes,
      baker: t.assignedBaker,
      tags: t.tags || [],
      oven: t.ovenSlot || "",
    }));

    const projectsContext = projects.map((p) => ({
      id: p.id,
      name: p.name,
      client: p.client || "",
      deadline: p.deadline,
      status: p.status,
      targetUnits: p.targetUnits,
      lead: p.assignedLead,
      category: p.category,
    }));

    const systemPrompt = `You are the AI Search & Retrieval Specialist for the Crumb & Crust Bakery Management System.
Analyze the user's natural language search query against active bakery records (tasks and wholesale orders/projects).
Match relevant records based on semantics, station keywords, priority words, baker names, baking stages (prep, proofing, baking, finishing, completed), time horizons, and ingredients (sourdough, croissant, brioche, cake, focaccia).

Available Tasks:
${JSON.stringify(tasksContext, null, 2)}

Available Projects / Orders:
${JSON.stringify(projectsContext, null, 2)}

Return ONLY valid JSON matching this schema:
{
  "interpretation": "Short 1-sentence summary of what the query is looking for",
  "extractedFilters": {
    "station": "Specific station name or 'ALL'",
    "status": "Specific status (prep/proofing/baking/finishing/completed) or 'ALL'",
    "priority": "Specific priority (Urgent/High/Medium/Low) or 'ALL'",
    "assignedBaker": "Specific baker name or 'ALL'",
    "minEstimatedMinutes": null,
    "maxEstimatedMinutes": null,
    "timeframe": "Optional timeframe note"
  },
  "matchingTasks": [
    {
      "taskId": "task-id",
      "relevanceScore": 95,
      "matchReason": "Why this task matches the query"
    }
  ],
  "matchingProjects": [
    {
      "projectId": "proj-id",
      "relevanceScore": 90,
      "matchReason": "Why this project matches the query"
    }
  ],
  "suggestedFollowUps": [
    "Suggested natural query 1",
    "Suggested natural query 2"
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `User Natural Language Search Query: "${cleanQuery}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    let parsed: any;
    try {
      parsed = JSON.parse(response.text?.trim() || "{}");
    } catch (parseErr) {
      console.warn("Failed to parse Gemini natural search JSON, using fallback:", parseErr);
      const fallbackResult = performFallbackNaturalSearch(cleanQuery, tasks, projects);
      return res.json(fallbackResult);
    }

    const tasksMap = new Map(tasks.map((t) => [t.id, t]));
    const projectsMap = new Map(projects.map((p) => [p.id, p]));

    const matchingTasks = (Array.isArray(parsed.matchingTasks) ? parsed.matchingTasks : [])
      .filter((m: any) => m && m.taskId && tasksMap.has(m.taskId))
      .map((m: any) => ({
        task: tasksMap.get(m.taskId)!,
        relevanceScore: typeof m.relevanceScore === "number" ? Math.min(100, Math.max(10, m.relevanceScore)) : 85,
        matchReason: m.matchReason || "Matched search criteria",
      }))
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

    const matchingProjects = (Array.isArray(parsed.matchingProjects) ? parsed.matchingProjects : [])
      .filter((m: any) => m && m.projectId && projectsMap.has(m.projectId))
      .map((m: any) => ({
        project: projectsMap.get(m.projectId)!,
        relevanceScore: typeof m.relevanceScore === "number" ? Math.min(100, Math.max(10, m.relevanceScore)) : 80,
        matchReason: m.matchReason || "Matched order criteria",
      }))
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

    return res.json({
      query: cleanQuery,
      interpretation: parsed.interpretation || `Search results for "${cleanQuery}"`,
      extractedFilters: parsed.extractedFilters || {},
      matchingTasks,
      matchingProjects,
      suggestedFollowUps: parsed.suggestedFollowUps || [
        "What tasks are currently in the ovens?",
        "Show urgent tasks for Chef Marcus",
        "Wholesale orders due today",
      ],
      isAiPowered: true,
    });
  } catch (error: any) {
    console.error("Gemini Natural Search error, using smart fallback:", error);
    const tasks = req.body.tasks || (await getTasks());
    const projects = req.body.projects || (await getProjects());
    const fallback = performFallbackNaturalSearch(req.body.query || "", tasks, projects);
    return res.json(fallback);
  }
});

// Heuristic fallback search parser when offline or API key is absent
function performFallbackNaturalSearch(query: string, tasks: BakeryTask[], projects: Project[]) {
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);

  const extractedFilters: any = {
    station: "ALL",
    status: "ALL",
    priority: "ALL",
    assignedBaker: "ALL",
  };

  // Detect station
  if (q.includes("bread") || q.includes("sourdough") || q.includes("batard") || q.includes("baguette") || q.includes("focaccia")) {
    extractedFilters.station = "Breads";
  } else if (q.includes("croissant") || q.includes("viennoiserie") || q.includes("pastry") || q.includes("chocolat") || q.includes("lamination")) {
    extractedFilters.station = "Viennoiserie";
  } else if (q.includes("cake") || q.includes("sponge") || q.includes("wedding") || q.includes("tier")) {
    extractedFilters.station = "Custom Cakes";
  } else if (q.includes("prep") || q.includes("autolyse") || q.includes("dough") || q.includes("mix")) {
    extractedFilters.station = "Prep & Doughs";
  } else if (q.includes("oven") || q.includes("deck") || q.includes("rack") || q.includes("bake") || q.includes("steam")) {
    extractedFilters.station = "Ovens";
  } else if (q.includes("finish") || q.includes("pack") || q.includes("box") || q.includes("dispatch")) {
    extractedFilters.station = "Finishing & Packaging";
  }

  // Detect status
  if (q.includes("proofing") || q.includes("proof") || q.includes("retard")) {
    extractedFilters.status = "proofing";
  } else if (q.includes("baking") || q.includes("in oven")) {
    extractedFilters.status = "baking";
  } else if (q.includes("prep") || q.includes("preparing")) {
    extractedFilters.status = "prep";
  } else if (q.includes("finishing") || q.includes("decorat")) {
    extractedFilters.status = "finishing";
  } else if (q.includes("completed") || q.includes("done") || q.includes("finished") || q.includes("ready")) {
    extractedFilters.status = "completed";
  }

  // Detect priority
  if (q.includes("urgent") || q.includes("asap") || q.includes("rush")) {
    extractedFilters.priority = "Urgent";
  } else if (q.includes("high")) {
    extractedFilters.priority = "High";
  } else if (q.includes("medium")) {
    extractedFilters.priority = "Medium";
  } else if (q.includes("low")) {
    extractedFilters.priority = "Low";
  }

  // Detect baker
  if (q.includes("marcus")) {
    extractedFilters.assignedBaker = "Chef Marcus";
  } else if (q.includes("sophie")) {
    extractedFilters.assignedBaker = "Baker Sophie";
  } else if (q.includes("claire")) {
    extractedFilters.assignedBaker = "Pastry Chef Claire";
  } else if (q.includes("leo")) {
    extractedFilters.assignedBaker = "Chef Leo";
  }

  // Score Tasks
  const scoredTasks = tasks.map((task) => {
    let score = 0;
    const reasons: string[] = [];
    const tTitle = task.title.toLowerCase();
    const tDesc = task.description.toLowerCase();
    const tStation = task.station.toLowerCase();
    const tBaker = task.assignedBaker.toLowerCase();
    const tTags = (task.tags || []).join(" ").toLowerCase();

    // Priority matching
    if (extractedFilters.priority !== "ALL") {
      if (task.priority === extractedFilters.priority) {
        score += 35;
        reasons.push(`${task.priority} priority`);
      }
    }

    // Status matching
    if (extractedFilters.status !== "ALL") {
      if (task.status === extractedFilters.status) {
        score += 35;
        reasons.push(`in '${task.status}' stage`);
      }
    }

    // Station matching
    if (extractedFilters.station !== "ALL") {
      if (task.station === extractedFilters.station) {
        score += 30;
        reasons.push(`at ${task.station} station`);
      }
    }

    // Baker matching
    if (extractedFilters.assignedBaker !== "ALL") {
      if (task.assignedBaker.toLowerCase().includes(extractedFilters.assignedBaker.toLowerCase())) {
        score += 35;
        reasons.push(`assigned to ${task.assignedBaker}`);
      }
    }

    // Token matching across text
    let tokenMatches = 0;
    for (const token of tokens) {
      if (token.length <= 2) continue;
      if (tTitle.includes(token)) {
        score += 20;
        tokenMatches++;
      } else if (tDesc.includes(token) || tTags.includes(token)) {
        score += 12;
        tokenMatches++;
      } else if (tStation.includes(token) || tBaker.includes(token)) {
        score += 10;
        tokenMatches++;
      }
    }

    if (tokenMatches > 0 && reasons.length === 0) {
      reasons.push(`mentions '${tokens.slice(0, 3).join(", ")}'`);
    }

    // Duration keywords
    if (q.includes("quick") || q.includes("short") || q.includes("< 30") || q.includes("under 30")) {
      if (task.estimatedMinutes <= 30) {
        score += 20;
        reasons.push(`quick turnaround (${task.estimatedMinutes}m)`);
      }
    }

    return {
      task,
      relevanceScore: Math.min(99, Math.max(10, score)),
      matchReason: reasons.length > 0 ? reasons.join(", ") : "Text match in task records",
    };
  });

  const matchingTasks = scoredTasks
    .filter((st) => st.relevanceScore >= 30)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Score Projects
  const scoredProjects = projects.map((project) => {
    let score = 0;
    const reasons: string[] = [];
    const pName = project.name.toLowerCase();
    const pClient = (project.client || "").toLowerCase();
    const pDesc = project.description.toLowerCase();
    const pLead = project.assignedLead.toLowerCase();

    if (extractedFilters.assignedBaker !== "ALL" && pLead.includes(extractedFilters.assignedBaker.toLowerCase())) {
      score += 35;
      reasons.push(`led by ${project.assignedLead}`);
    }

    if (q.includes("order") || q.includes("wholesale") || q.includes("client") || q.includes("project")) {
      score += 25;
      reasons.push("wholesale / event order record");
    }

    for (const token of tokens) {
      if (token.length <= 2) continue;
      if (pName.includes(token) || pClient.includes(token)) {
        score += 25;
        reasons.push(`matches client or title`);
      } else if (pDesc.includes(token)) {
        score += 15;
      }
    }

    return {
      project,
      relevanceScore: Math.min(99, Math.max(10, score)),
      matchReason: reasons.length > 0 ? reasons.join(", ") : "Matched project parameters",
    };
  });

  const matchingProjects = scoredProjects
    .filter((sp) => sp.relevanceScore >= 30)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  const interpretation = `Filtered bakery records based on query criteria (Station: ${extractedFilters.station}, Priority: ${extractedFilters.priority}, Status: ${extractedFilters.status})`;

  return {
    query,
    interpretation,
    extractedFilters,
    matchingTasks,
    matchingProjects,
    suggestedFollowUps: [
      "What tasks are currently in the ovens?",
      "Show urgent tasks for Chef Marcus",
      "Wholesale orders due today",
      "Viennoiserie proofing tasks",
    ],
    isAiPowered: false,
  };
}

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
