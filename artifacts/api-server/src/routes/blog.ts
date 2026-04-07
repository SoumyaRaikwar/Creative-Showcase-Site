import { Router } from "express";
import { db, blogPostsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import {
  ListBlogPostsQueryParams,
  CreateBlogPostBody,
  GetBlogPostParams,
  UpdateBlogPostParams,
  UpdateBlogPostBody,
  DeleteBlogPostParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/blog", async (req, res) => {
  try {
    const query = ListBlogPostsQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: "Invalid query parameters" });
      return;
    }
    const { page = 1, limit = 10, tag } = query.data;
    const offset = (page - 1) * limit;

    let baseQuery = db.select().from(blogPostsTable);

    if (tag) {
      baseQuery = baseQuery.where(sql`${blogPostsTable.tags} @> ARRAY[${tag}]::text[]`) as typeof baseQuery;
    }

    const [posts, countResult] = await Promise.all([
      baseQuery
        .orderBy(desc(blogPostsTable.publishedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(blogPostsTable)
        .then((rows) => rows[0]?.count ?? 0),
    ]);

    const total = Number(countResult);
    const totalPages = Math.ceil(total / limit);

    res.json({ posts, total, page, limit, totalPages });
  } catch (err) {
    req.log.error({ err }, "Failed to list blog posts");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/blog", async (req, res) => {
  try {
    const body = CreateBlogPostBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const [post] = await db
      .insert(blogPostsTable)
      .values({
        ...body.data,
        publishedAt: body.data.publishedAt ? new Date(body.data.publishedAt) : new Date(),
      })
      .returning();
    res.status(201).json(post);
  } catch (err) {
    req.log.error({ err }, "Failed to create blog post");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/blog/meta/tags", async (req, res) => {
  try {
    const result = await db
      .select({ tags: blogPostsTable.tags })
      .from(blogPostsTable);
    const allTags = Array.from(new Set(result.flatMap((r) => r.tags))).sort();
    res.json({ tags: allTags });
  } catch (err) {
    req.log.error({ err }, "Failed to get blog tags");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/blog/meta/recent", async (req, res) => {
  try {
    const posts = await db
      .select()
      .from(blogPostsTable)
      .orderBy(desc(blogPostsTable.publishedAt))
      .limit(3);
    res.json(posts);
  } catch (err) {
    req.log.error({ err }, "Failed to get recent blog posts");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/blog/:slug", async (req, res) => {
  try {
    const params = GetBlogPostParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid params" });
      return;
    }
    const [post] = await db
      .select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.slug, params.data.slug));
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    res.json(post);
  } catch (err) {
    req.log.error({ err }, "Failed to get blog post");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/blog/:slug", async (req, res) => {
  try {
    const params = UpdateBlogPostParams.safeParse(req.params);
    const body = UpdateBlogPostBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    const updateData: Record<string, unknown> = { ...body.data, updatedAt: new Date() };
    if (body.data.publishedAt) {
      updateData.publishedAt = new Date(body.data.publishedAt);
    }
    const [post] = await db
      .update(blogPostsTable)
      .set(updateData)
      .where(eq(blogPostsTable.slug, params.data.slug))
      .returning();
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    res.json(post);
  } catch (err) {
    req.log.error({ err }, "Failed to update blog post");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/blog/:slug", async (req, res) => {
  try {
    const params = DeleteBlogPostParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid params" });
      return;
    }
    await db
      .delete(blogPostsTable)
      .where(eq(blogPostsTable.slug, params.data.slug));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete blog post");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
