// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { apiFetch, ApiError } from "@/lib/api";

const { Button, Input, Label, Table, THead, TBody, TR, TH, TD, Empty } = UI;

const { Check, Upload } = Icons;

export default function Screen() {
  const [file, setFile] = React.useState(null);
  const [inputKey, setInputKey] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState(null);

  const ink = brand.primaryColor;
  const accent = brand.accentColor;
  const muted = brand.neutralColor;
  const rule = "2px solid " + ink;
  const label = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: ink,
  };

  const onPick = (e) => {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
    setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!file) {
      setError("Choose a CSV file first. Nothing has been uploaded.");
      return;
    }
    if (!/\.csv$/i.test(file.name)) {
      setError(
        '"' +
          file.name +
          '" is not a .csv file. Export your sheet as CSV and try again. Nothing was added.',
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await apiFetch("/admin/movies/upload", { method: "POST", body });
      const rows = res.rejected
        .map((r) => ({ ...r, status: "Rejected" }))
        .concat(res.skipped.map((r) => ({ ...r, status: "Skipped" })))
        .sort((x, y) => x.row - y.row);
      setResult({
        fileName: file.name,
        added: res.added,
        skipped: res.skipped.length,
        rejected: res.rejected.length,
        total: res.added + res.skipped.length + res.rejected.length,
        rows,
      });
      setFile(null);
      setInputKey((k) => k + 1);
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      if (status === 401 || status === 403) {
        setError("Access denied: only admins can upload movies. Nothing was added.");
      } else {
        const detail =
          err instanceof ApiError && typeof err.detail === "string"
            ? err.detail
            : "The upload failed. Try again.";
        setError(detail + " Nothing was added.");
      }
    } finally {
      setBusy(false);
    }
  };

  const sizeLabel = file
    ? file.size < 1024
      ? file.size + " B"
      : (file.size / 1024).toFixed(1) + " KB"
    : "";

  const cards = !result
    ? []
    : [
        {
          id: "b-3-0",
          name: "Added",
          value: result.added,
          hint: "Rows inserted as new movies",
          flag: false,
        },
        {
          id: "b-3-1",
          name: "Skipped as duplicates",
          value: result.skipped,
          hint: "Same title and year already exists",
          flag: false,
        },
        {
          id: "b-3-2",
          name: "Rejected",
          value: result.rejected,
          hint: "Failed validation, listed below",
          flag: result.rejected > 0,
        },
      ];

  const problemRows = result ? result.rows : [];

  return (
    <div
      style={{
        backgroundColor: brand.backgroundColor,
        color: ink,
        fontFamily: brand.fontBody,
        minHeight: "100%",
      }}
    >
      <style>{`
        .wn-focus:focus-visible { outline: 2px solid ${accent}; outline-offset: 2px; }
        .wn-link { background: none; border: 0; padding: 0; font: inherit; color: ${ink}; text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 2px; cursor: pointer; }
        .wn-link:hover { color: ${accent}; }
        .wn-btn { transition: background-color 120ms, color 120ms; }
        .wn-btn:hover:not(:disabled) { background-color: #ffffff !important; color: ${ink} !important; }
        .wn-btn:active:not(:disabled) { transform: translateY(1px); }
        .wn-row { animation: wn-in 220ms ease-out both; }
        @keyframes wn-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
        @keyframes wn-bar { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
        .wn-bar { animation: wn-bar 900ms linear infinite; }
        @media (prefers-reduced-motion: reduce) { .wn-row, .wn-bar { animation: none; } .wn-btn { transition: none; } }
      `}</style>

      <div className="mx-auto w-full px-4 py-6 md:px-8 md:py-8" style={{ maxWidth: 1120 }}>
        {/* Row 1 */}
        <header data-wf="b-0-0" className="pb-3" style={{ borderBottom: rule }}>
          <p style={{ ...label, color: muted, margin: 0 }}>Admin · Catalog</p>
          <h1
            style={{
              fontSize: 36,
              lineHeight: 1.1,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              margin: "4px 0 0",
            }}
          >
            Upload movies
          </h1>
        </header>

        {/* Row 2 */}
        <p
          data-wf="b-1-0"
          className="mt-4"
          style={{ fontSize: 15, lineHeight: 1.5, maxWidth: 680, margin: "16px 0 0" }}
        >
          Upload a CSV with columns: <strong>title, year, genres, director, cast, plot</strong>.
          Separate multiple genres or cast members with <strong>|</strong>.
        </p>
        <p
          style={{
            fontSize: 12,
            color: muted,
            margin: "8px 0 0",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          Example row:{" "}
          <code style={{ color: ink }}>
            Arrival,2016,Drama|Sci-Fi,Denis Villeneuve,Amy Adams|Jeremy Renner,"A linguist is
            recruited to decode alien speech."
          </code>
        </p>

        {/* Row 3 */}
        <form
          onSubmit={onSubmit}
          noValidate
          className="mt-6 grid grid-cols-1 items-end gap-4 md:grid-cols-12"
          aria-label="CSV upload"
        >
          <div data-wf="b-2-0" className="md:col-span-8" style={{ border: rule, padding: 12 }}>
            <Label htmlFor="csv-file" style={label}>
              CSV file
            </Label>
            <Input
              key={inputKey}
              id="csv-file"
              data-wf="i-2-0-0"
              type="file"
              accept=".csv,text/csv"
              onChange={onPick}
              disabled={busy}
              aria-describedby={error ? "csv-error csv-help" : "csv-help"}
              aria-invalid={error ? "true" : undefined}
              className="wn-focus mt-2 w-full"
              style={{
                border: "2px solid " + (error ? accent : ink),
                borderRadius: 2,
                padding: 8,
                fontSize: 14,
                backgroundColor: "#ffffff",
                color: ink,
                height: "auto",
              }}
            />
            <p
              id="csv-help"
              style={{
                fontSize: 12,
                color: muted,
                margin: "8px 0 0",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {file ? (
                <span style={{ color: ink, fontWeight: 600 }}>
                  {file.name} · {sizeLabel}. Ready to upload.
                </span>
              ) : (
                "Header row first. Row 1 is the first data row after the header."
              )}
            </p>
            {error ? (
              <div
                id="csv-error"
                role="alert"
                className="wn-row mt-3 flex items-start gap-2"
                style={{
                  borderLeft: "2px solid " + accent,
                  paddingLeft: 8,
                  color: accent,
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                <Icons.AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}
          </div>
          <Button
            data-wf="b-2-1"
            type="submit"
            disabled={busy}
            className="wn-btn wn-focus md:col-span-4 inline-flex w-full items-center justify-center gap-2"
            style={{
              backgroundColor: ink,
              color: "#ffffff",
              border: rule,
              borderRadius: 2,
              height: 44,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              cursor: busy ? "progress" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            <Icons.Plus aria-hidden="true" className="h-4 w-4" />
            {busy ? "Uploading…" : "Upload"}
          </Button>
        </form>

        {busy ? (
          <div role="status" className="mt-3" style={{ fontSize: 13 }}>
            <span style={{ fontWeight: 600 }}>
              Reading {file ? file.name : "file"}, checking rows and rebuilding similarity…
            </span>
            <div
              style={{
                height: 2,
                backgroundColor: "#ffffff",
                border: "1px solid " + ink,
                marginTop: 8,
                overflow: "hidden",
              }}
            >
              <div
                className="wn-bar"
                style={{ height: "100%", width: "40%", backgroundColor: ink }}
              />
            </div>
          </div>
        ) : null}

        {/* Result summary */}
        <section aria-labelledby="result-heading" className="mt-8">
          <div
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-2"
            style={{ borderBottom: rule }}
          >
            <h2
              id="result-heading"
              style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}
            >
              Upload result
            </h2>
            <p
              aria-live="polite"
              style={{ fontSize: 12, color: muted, margin: 0, fontVariantNumeric: "tabular-nums" }}
            >
              {result ? result.fileName + " · " + result.total + " data rows" : "No upload yet"}
            </p>
          </div>

          {result && result.added > 0 ? (
            <p
              className="wn-row"
              role="status"
              style={{
                fontSize: 13,
                margin: "12px 0 0",
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Icons.CheckCircle aria-hidden="true" className="h-4 w-4" />
              <span>
                <strong>
                  {result.added} {result.added === 1 ? "movie" : "movies"} added.
                </strong>{" "}
                Similarity is rebuilt, so they already appear in search, similar lists and For you.
              </span>
            </p>
          ) : null}
          {result && result.added === 0 ? (
            <p className="wn-row" role="status" style={{ fontSize: 13, margin: "12px 0 0" }}>
              <strong>No new movies were added.</strong> Every row was skipped or rejected; see the
              table below.
            </p>
          ) : null}

          {!result ? (
            <div className="mt-4">
              <Empty
                title="No upload yet"
                description="Choose a CSV file and press Upload to see the added, skipped and rejected counts."
              />
            </div>
          ) : null}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
            {cards.map((c) => (
              <div
                key={c.id}
                data-wf={c.id}
                role="group"
                aria-label={c.name + ": " + c.value}
                className="md:col-span-4"
                style={{
                  border: rule,
                  borderLeft: c.flag ? "6px solid " + accent : rule,
                  padding: 12,
                }}
              >
                <div style={{ ...label, color: c.flag ? accent : ink }}>{c.name}</div>
                <div
                  style={{
                    fontSize: 40,
                    lineHeight: 1.1,
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    fontVariantNumeric: "tabular-nums",
                    margin: "8px 0 4px",
                    color: c.flag ? accent : ink,
                  }}
                >
                  {c.value}
                </div>
                <div style={{ fontSize: 12, color: muted }}>{c.hint}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Row 5 */}
        <section data-wf="b-4-0" aria-labelledby="rows-heading" className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2">
            <h2
              id="rows-heading"
              style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}
            >
              Rejected and skipped rows
            </h2>
            <p
              style={{ fontSize: 12, color: muted, margin: 0, fontVariantNumeric: "tabular-nums" }}
            >
              {problemRows.length} {problemRows.length === 1 ? "row" : "rows"} need attention
            </p>
          </div>
          {problemRows.length === 0 ? (
            <div style={{ border: rule, padding: 24 }}>
              <Empty
                title={result ? "Every row went in cleanly" : "No upload yet"}
                description={
                  result
                    ? "No rows were rejected or skipped in this upload, so there is nothing to fix in your file."
                    : "Rejected and skipped rows appear here after an upload."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto" style={{ borderTop: rule, borderBottom: rule }}>
              <Table
                className="w-full"
                style={{
                  borderCollapse: "collapse",
                  fontSize: 13,
                  fontVariantNumeric: "tabular-nums",
                  minWidth: 560,
                }}
              >
                <THead>
                  <TR style={{ borderBottom: rule }}>
                    <TH
                      scope="col"
                      data-wf="i-4-0-0"
                      style={{
                        ...label,
                        textAlign: "left",
                        padding: "8px 12px",
                        width: 112,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Row number
                    </TH>
                    <TH
                      scope="col"
                      data-wf="i-4-0-1"
                      style={{ ...label, textAlign: "left", padding: "8px 12px", width: "24%" }}
                    >
                      Title
                    </TH>
                    <TH
                      scope="col"
                      data-wf="i-4-0-2"
                      style={{ ...label, textAlign: "left", padding: "8px 12px", width: 128 }}
                    >
                      Status
                    </TH>
                    <TH
                      scope="col"
                      data-wf="i-4-0-3"
                      style={{ ...label, textAlign: "left", padding: "8px 12px" }}
                    >
                      Reason
                    </TH>
                  </TR>
                </THead>
                <TBody>
                  {problemRows.map((r) => {
                    const rejected = r.status === "Rejected";
                    return (
                      <TR
                        key={r.row + r.status}
                        className="wn-row"
                        style={{ borderBottom: "1px solid " + ink }}
                      >
                        <TD
                          style={{
                            padding: "8px 12px",
                            fontWeight: 700,
                            borderLeft: rejected ? "6px solid " + accent : "6px solid transparent",
                          }}
                        >
                          {r.row}
                        </TD>
                        <TD style={{ padding: "8px 12px" }}>
                          {r.title ? (
                            r.title
                          ) : (
                            <span style={{ color: muted, fontStyle: "italic" }}>(empty)</span>
                          )}
                        </TD>
                        <TD style={{ padding: "8px 12px" }}>
                          <span
                            className="inline-flex items-center gap-1"
                            style={{
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              fontSize: 11,
                              color: rejected ? accent : ink,
                            }}
                          >
                            {rejected ? (
                              <Icons.X aria-hidden="true" className="h-3.5 w-3.5" />
                            ) : (
                              <Icons.ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
                            )}
                            {r.status}
                          </span>
                        </TD>
                        <TD style={{ padding: "8px 12px", lineHeight: 1.4 }}>{r.reason}</TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>
          )}
          <p
            style={{
              fontSize: 12,
              color: muted,
              margin: "12px 0 0",
              maxWidth: 680,
              lineHeight: 1.5,
            }}
          >
            Uploads only add movies. A row with the same title and year as an existing movie is
            skipped, ignoring letter case. Added movies can’t be edited or deleted here.
          </p>
        </section>
      </div>
    </div>
  );
}
