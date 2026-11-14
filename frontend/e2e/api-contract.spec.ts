import { test, expect, type APIRequestContext } from "@playwright/test";
import { adminCredentials } from "./support/admin";

const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";
const HEADER = "title,year,genres,director,cast,plot";

async function viewerHeaders(request: APIRequestContext) {
  const res = await request.post(`${API}/auth/signup`, {
    data: { email: `v-${crypto.randomUUID()}@example.com`, password: crypto.randomUUID() },
  });
  expect(res.status()).toBe(201);
  return { Authorization: `Bearer ${(await res.json()).token}` };
}

async function adminHeaders(request: APIRequestContext) {
  const res = await request.post(`${API}/auth/login`, { data: adminCredentials() });
  expect(res.status()).toBe(200);
  return { Authorization: `Bearer ${(await res.json()).token}` };
}

function csvFile(name: string, body: string) {
  return { file: { name, mimeType: "text/csv", buffer: Buffer.from(body) } };
}

test("[API-MOVIES] signed-out calls to movie, like, for-you and upload endpoints return 401", async ({
  request,
}) => {
  for (const [method, path] of [
    ["GET", "/movies"],
    ["GET", "/movies/1"],
    ["GET", "/movies/1/similar"],
    ["PUT", "/movies/1/like"],
    ["DELETE", "/movies/1/like"],
    ["GET", "/me/likes"],
    ["GET", "/me/for-you"],
  ] as const) {
    const res = await request.fetch(`${API}${path}`, { method });
    expect(res.status(), `${method} ${path}`).toBe(401);
  }
  const up = await request.post(`${API}/admin/movies/upload`, { multipart: csvFile("m.csv", HEADER) });
  expect(up.status()).toBe(401);
});

test("[API-MOVIES] like and unlike are idempotent, per user, and unknown movies return 404", async ({
  request,
}) => {
  const admin = await adminHeaders(request);
  const viewer = await viewerHeaders(request);
  const other = await viewerHeaders(request);
  const title = `Contract ${crypto.randomUUID().slice(0, 8)}`;
  const up = await request.post(`${API}/admin/movies/upload`, {
    headers: admin,
    multipart: csvFile("m.csv", `${HEADER}\n${title},2001,Drama,Dir,A|B,A plot of contract tests\n`),
  });
  expect(up.status()).toBe(200);
  expect((await up.json()).added).toBe(1);
  const found = await request.get(`${API}/movies`, { headers: viewer, params: { q: title.toUpperCase() } });
  const body = await found.json();
  expect(body.total).toBe(1);
  const id = body.items[0].id as number;

  for (let i = 0; i < 2; i++) {
    const put = await request.put(`${API}/movies/${id}/like`, { headers: viewer });
    expect(put.status()).toBe(200);
    expect(await put.json()).toEqual({ movie_id: id, liked: true });
  }
  const likes = await (await request.get(`${API}/me/likes`, { headers: viewer })).json();
  expect(likes.items.map((m: { id: number }) => m.id)).toEqual([id]);
  expect((await (await request.get(`${API}/me/likes`, { headers: other })).json()).items).toEqual([]);
  const forYou = await (await request.get(`${API}/me/for-you`, { headers: other })).json();
  expect(forYou).toEqual({ has_likes: false, items: [] });

  for (let i = 0; i < 2; i++) {
    const del = await request.delete(`${API}/movies/${id}/like`, { headers: viewer });
    expect(del.status()).toBe(200);
    expect(await del.json()).toEqual({ movie_id: id, liked: false });
  }
  expect((await (await request.get(`${API}/me/likes`, { headers: viewer })).json()).items).toEqual([]);

  for (const path of ["/movies/99999999", "/movies/abc", "/movies/99999999/similar"]) {
    expect((await request.get(`${API}${path}`, { headers: viewer })).status(), path).toBe(404);
  }
  expect((await request.put(`${API}/movies/99999999/like`, { headers: viewer })).status()).toBe(404);
});

test("[API-UPLOAD] a viewer gets 403, a bad file or header gets 400, and a mixed file reports row-numbered issues", async ({
  request,
}) => {
  const admin = await adminHeaders(request);
  const viewer = await viewerHeaders(request);
  const t = crypto.randomUUID().slice(0, 8);

  const denied = await request.post(`${API}/admin/movies/upload`, {
    headers: viewer,
    multipart: csvFile("m.csv", `${HEADER}\nDenied ${t},2000,Drama,D,A,P\n`),
  });
  expect(denied.status()).toBe(403);
  const none = await request.get(`${API}/movies`, { headers: admin, params: { q: `Denied ${t}` } });
  expect((await none.json()).total).toBe(0);

  const notCsv = await request.post(`${API}/admin/movies/upload`, {
    headers: admin,
    multipart: csvFile("m.txt", `${HEADER}\nX ${t},2000,Drama,D,A,P\n`),
  });
  expect(notCsv.status()).toBe(400);
  expect(typeof (await notCsv.json()).detail).toBe("string");
  const badHeader = await request.post(`${API}/admin/movies/upload`, {
    headers: admin,
    multipart: csvFile("m.csv", `title,year\nX ${t},2000\n`),
  });
  expect(badHeader.status()).toBe(400);
  expect(
    (await (await request.get(`${API}/movies`, { headers: admin, params: { q: `X ${t}` } })).json())
      .total,
  ).toBe(0);

  const body = [
    HEADER,
    `New ${t},2001,Drama|Comedy,Dir,A|B,A plot`,
    `new ${t},2001,Drama,Dir,A,Same title in file`,
    `,2002,Drama,Dir,A,No title`,
  ].join("\n");
  const res = await request.post(`${API}/admin/movies/upload`, {
    headers: admin,
    multipart: csvFile("m.csv", body),
  });
  expect(res.status()).toBe(200);
  const out = await res.json();
  expect([out.added, out.skipped, out.rejected]).toEqual([1, 1, 1]);
  expect(out.issues.map((i: { row: number; status: string }) => [i.row, i.status])).toEqual([
    [2, "skipped"],
    [3, "rejected"],
  ]);
  const again = await (
    await request.post(`${API}/admin/movies/upload`, {
      headers: admin,
      multipart: csvFile("m.csv", body),
    })
  ).json();
  expect([again.added, again.skipped, again.rejected]).toEqual([0, 2, 1]);
});

test("[API-SIMILAR] similar and For you rank a uniquely shared-term movie first and exclude liked ones", async ({
  request,
}) => {
  const admin = await adminHeaders(request);
  const viewer = await viewerHeaders(request);
  const t = crypto.randomUUID().replace(/[^a-z0-9]/g, "").slice(0, 8);
  const csv = [
    HEADER,
    `Sa ${t},2001,Genre${t},Dir${t},Cast${t},zebra${t} comet${t}`,
    `Sb ${t},2001,Genre${t},Dir${t},Cast${t},zebra${t} comet${t}`,
    `Sc ${t},2001,Other${t},,,zebra${t}`,
  ].join("\n");
  const up = await request.post(`${API}/admin/movies/upload`, {
    headers: admin,
    multipart: csvFile("m.csv", csv),
  });
  expect((await up.json()).added).toBe(3);
  const list = await (
    await request.get(`${API}/movies`, { headers: viewer, params: { q: ` ${t}` } })
  ).json();
  const idOf = (prefix: string) =>
    list.items.find((m: { title: string }) => m.title.startsWith(prefix)).id as number;
  const [a, b, c] = [idOf("Sa"), idOf("Sb"), idOf("Sc")];

  const sim = await (await request.get(`${API}/movies/${a}/similar`, { headers: viewer })).json();
  expect(sim.items.map((i: { id: number }) => i.id)).toEqual([b, c]);
  expect(sim.items[0].score).toBeGreaterThan(sim.items[1].score);

  await request.put(`${API}/movies/${a}/like`, { headers: viewer });
  const fy = await (await request.get(`${API}/me/for-you`, { headers: viewer })).json();
  expect(fy.has_likes).toBe(true);
  expect(fy.items.slice(0, 2).map((i: { id: number }) => i.id)).toEqual([b, c]);
  expect(fy.items.map((i: { id: number }) => i.id)).not.toContain(a);
});
