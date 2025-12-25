import React, { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo.png";
/**
 * AgendaViewer
 * - Props: { program } where program matches the provided JSON structure
 * - Highlights current session in real time (updates every 60s)
 * - Styles finished sessions as muted, current session with accent
 */
export default function AgendaViewer({ program }) {
  const [now, setNow] = useState(new Date());

  // Update time every 60 seconds
  useEffect(() => {
    setNow(new Date()); // initial
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Selected day for fullscreen/day-view (modal or separate page)
  const [selectedDay, setSelectedDay] = useState(null);

  const openDay = (day) => {
    setSelectedDay(day);
    // update URL hash so the view is shareable
    try {
      window.history.pushState(null, "", `#day=${day.date}`);
    } catch (e) {}
  };

  const closeDay = () => {
    setSelectedDay(null);
    try {
      if (location.hash && location.hash.startsWith("#day=")) {
        window.history.pushState(null, "", window.location.pathname);
      }
    } catch (e) {}
  };

  // Listen to hash changes (so a direct link like #day=2025-12-29 opens the day view)
  useEffect(() => {
    const onHash = () => {
      const m = location.hash.match(/#day=(\d{4}-\d{2}-\d{2})/);
      if (m) {
        const day = program.days?.find((d) => d.date === m[1]);
        if (day) setSelectedDay(day);
      }
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onHash);

    const onKey = (e) => {
      if (e.key === "Escape") closeDay();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onHash);
      window.removeEventListener("keydown", onKey);
    };
  }, [program.days]);

  // Helper: parse date + HH:MM into a local Date
  const parseDateTime = (dateStr, timeStr) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const [hh, mm] = timeStr.split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm, 0);
  };

  const formatTime = (d) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Format a day date string 'YYYY-MM-DD' to readable weekday + date
  // Example: 'Monday, December 29, 2025'
  const formatDayDate = (dateStr) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const dateRange = useMemo(() => {
    if (!program?.days?.length) return "";
    const first = program.days[0].date;
    const last = program.days[program.days.length - 1].date;

    if (first === last) {
      // Format single date: "December 29, 2025"
      const [y, m, d] = first.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } else {
      // Format date range: "December 29 — 31, 2025"
      const [y1, m1, d1] = first.split("-").map(Number);
      const [y2, m2, d2] = last.split("-").map(Number);
      const dt1 = new Date(y1, m1 - 1, d1);
      const dt2 = new Date(y2, m2 - 1, d2);

      const month1 = dt1.toLocaleDateString(undefined, { month: "long" });
      const month2 = dt2.toLocaleDateString(undefined, { month: "long" });
      const year1 = dt1.getFullYear();
      const year2 = dt2.getFullYear();

      if (month1 === month2 && year1 === year2) {
        // Same month and year: "December 29 — 31, 2025"
        return `${month1} ${d1} — ${d2}, ${year1}`;
      } else if (year1 === year2) {
        // Same year, different months: "December 29 — January 2, 2025"
        return `${month1} ${d1} — ${month2} ${d2}, ${year1}`;
      } else {
        // Different years: "December 29, 2025 — January 2, 2026"
        return `${month1} ${d1}, ${year1} — ${month2} ${d2}, ${year2}`;
      }
    }
  }, [program]);

  const sessionStatus = (session, dayDate) => {
    const start = parseDateTime(dayDate, session.startTime);
    const end = parseDateTime(dayDate, session.endTime);
    if (now >= start && now < end) return "current";
    if (now >= end) return "finished";
    return "upcoming";
  };

  // Fullscreen day view component (modal-like). Kept simple and self-contained.
  function DayModal({ day, onClose }) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-50 to-blue-100 overflow-auto py-4 px-2 sm:py-8 sm:px-8">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-2 sm:p-4">
          <div className="flex items-start justify-between mb-6 sm:mb-8">
            <div>
              <div className="text-3xl font-bold text-blue-900">
                {formatDayDate(day.date)}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="inline-flex items-center px-6 py-3 rounded-full bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {day.sessions.map((session, i) => {
              const status = sessionStatus(session, day.date);
              const start = parseDateTime(day.date, session.startTime);
              const end = parseDateTime(day.date, session.endTime);

              const cardVariant =
                status === "current"
                  ? "bg-gradient-to-r from-blue-50 to-blue-100 border-l-8 border-blue-600 shadow-lg"
                  : status === "finished"
                  ? "bg-gray-50 opacity-80 shadow-md"
                  : "bg-white shadow-md hover:shadow-lg transition-shadow duration-200";

              return (
                <div
                  key={i}
                  className={`p-4 sm:p-6 rounded-xl border ${cardVariant}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-medium text-gray-700">
                      {formatTime(start)} — {formatTime(end)}
                    </div>
                    {status === "current" && (
                      <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold animate-pulse">
                        Happening now
                      </div>
                    )}
                  </div>

                  <div className="text-2xl font-bold text-blue-800 mb-3">
                    {session.title}
                  </div>
                  <div className="text-base text-gray-500">
                    {session.speakers.join(", ")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white overflow-y-auto">
      {selectedDay && <DayModal day={selectedDay} onClose={closeDay} />}
      {/* Header (blue palette, centered) */}
      <div className="w-full bg-gradient-to-r from-blue-600 to-blue-800 p-4 sm:p-10 text-center shadow-2xl flex flex-col justify-center items-center">
        {/* Logo */}
        <img src={logo} alt="Organization Logo" className="mb-6 w-48 h-auto" />

        {program.organization && (
          <div className="text-2xl text-blue-200 font-medium mb-4">
            {program.organization}
          </div>
        )}

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
          {program.programName}
        </h1>

        {program.programLabel && (
          <div className="text-xl text-blue-200 italic mb-6">
            {program.programLabel}
          </div>
        )}

        <div className="flex flex-col items-center justify-center gap-4">
          <div className="inline-flex items-center text-white text-lg font-medium">
            Date: {dateRange}
          </div>
          <div className="inline-flex items-center text-white text-lg font-medium">
            Location: {program.venue}
          </div>
        </div>

        {/* Down arrow indicator */}
        <button
          onClick={() =>
            document
              .getElementById("agenda")
              .scrollIntoView({ behavior: "smooth" })
          }
          className="mt-8 inline-flex items-center px-8 py-4 rounded-full bg-yellow-400 text-black font-semibold shadow-lg border border-yellow-600 hover:bg-yellow-500 transition-colors duration-200 animate-bounce"
        >
          Agenda ↓
        </button>
      </div>

      <div
        id="agenda"
        className="max-w-5xl mx-auto space-y-4 sm:space-y-8 mt-8 p-4 sm:p-8"
      >
        {/* Days */}
        {program.days.map((day) => (
          <section key={day.date} className="mb-8">
            <div
              role="button"
              tabIndex={0}
              onClick={() => openDay(day)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openDay(day);
              }}
              className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl p-3 sm:p-6 shadow-lg border border-blue-300 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
                <div className="text-left">
                  <div className="text-2xl font-bold text-blue-900">
                    {formatDayDate(day.date)}
                  </div>
                  <div className="text-base text-blue-700 mt-2">
                    {new Date(day.date).toLocaleDateString()}
                  </div>
                </div>

                <div className="hidden md:flex items-center justify-end">
                  <div className="text-sm text-blue-600 font-medium">
                    Click to view full-day
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 space-y-4">
              {day.sessions.map((session, idx) => {
                const status = sessionStatus(session, day.date);
                const start = parseDateTime(day.date, session.startTime);
                const end = parseDateTime(day.date, session.endTime);

                const base =
                  "p-3 sm:p-6 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center shadow-md hover:shadow-lg transition-all duration-200";
                const timeCol =
                  "text-base font-medium text-gray-700 w-full sm:w-32";
                const bodyCol = "flex-1 mt-4 sm:mt-0 sm:ml-6";
                const titleClass =
                  status === "finished"
                    ? "font-semibold text-gray-500"
                    : "font-semibold text-blue-900";
                const speakersClass =
                  status === "finished"
                    ? "text-sm text-gray-400 mt-2"
                    : "text-sm text-gray-600 mt-2";

                const variant =
                  status === "current"
                    ? "bg-gradient-to-r from-blue-50 to-blue-100 border-l-8 border-blue-600"
                    : status === "finished"
                    ? "bg-gray-50 opacity-70"
                    : "bg-white hover:bg-blue-50";

                return (
                  <article
                    key={idx}
                    className={`${base} ${variant}`}
                    aria-current={status === "current" ? "true" : undefined}
                  >
                    <div className={timeCol}>
                      {formatTime(start)} — {formatTime(end)}
                    </div>

                    <div className={bodyCol}>
                      <div className="flex items-center mb-2">
                        <div className={titleClass}>{session.title}</div>
                        {status === "current" && (
                          <span className="ml-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white animate-pulse">
                            Now
                          </span>
                        )}
                      </div>

                      <div className={speakersClass}>
                        {session.speakers.join(", ")}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        <footer className="mt-12 text-center text-sm text-gray-500 bg-white rounded-xl p-6 shadow-md">
          <div className="mb-2">
            Copyrights © 2026 All Rights Reserved by Faculty of Management
            Studies and Commerce, University of Jaffna.
          </div>
          <div>
            Designed by{" "}
            <a
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
              href="https://www.achchuthan.lk"
              target="_blank"
              rel="noopener noreferrer"
            >
              Y. Achchuthan
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
