"use client";

import { Session } from "next-auth";
import { useEffect, useState } from "react";
import CreateApiKey from "./CreateApiKey";
import { ApiKeySession, BrowserSession, SessionData } from "@/types";
import Popup from "./Popup";
import useCsrf from "@/query/useCsrf";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loading } from "./Loading";
import { ErrorMsg } from "./ErrorMsg";

interface props {
  session: Session | null;
}

async function fetchSessions(): Promise<SessionData> {
  const res = await fetch("/api/sessions");
  if (!res.ok) throw new Error("Could not fetch sessions");
  return res.json();
}

export default function AmcatSessions({ session }: props) {
  const queryClient = useQueryClient();
  const { data: sessionData, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });
  const { data: csrfToken } = useCsrf();

  async function closeSessions(amcatSessionIds: string[]) {
    const config = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amcatSessionIds, csrfToken }),
    };

    const res = await fetch(`/api/closeSessions`, config);
    if (!res.ok) throw new Error("Could not close sessions");
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
    return res.json();
  }

  if (isLoading) <Loading />;
  if (!session) return null;
  if (!sessionData) return <ErrorMsg>Could not fetch sessions</ErrorMsg>;

  return (
    <div className="SessionData fadeIn">
      <style jsx>{`
        .SessionData {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
          color: white;
          padding: 2rem;
          margin-top: 2rem;
        }
        .AmcatSessions {
          flex: 1 1 auto;

          text-align: center;
          border: 1px solid var(--primary);
          border-radius: 1rem;
          box-shadow: 0px 1px 10px 0px var(--primary);
        }
      `}</style>

      <div className="AmcatSessions">
        <div className="Header">
          <h2>Browser sessions</h2>
          <h4 className="PrimaryColor">
            Monitor connections across browsers and devices
          </h4>
          {sessionData?.browser?.length ? null : (
            <h4>- No active sessions -</h4>
          )}
        </div>
        {sessionData.browser.map((session) => {
          return (
            <BrowserSessionRow
              key={session.id}
              session={session}
              closeSessions={closeSessions}
            />
          );
        })}
      </div>
      <div className="AmcatSessions">
        <div className="Header">
          <h2>API Keys</h2>
          <h4 className="SecondaryColor">Manage and create API keys</h4>
          {sessionData?.apiKey?.length ? null : <h4>- No active API Keys -</h4>}
        </div>
        <CreateApiKey
          csrfToken={csrfToken || ""}
          fetchSessions={fetchSessions}
        />
        {sessionData.apiKey.map((session) => {
          return (
            <ApiKeySessionRow
              key={session.id}
              session={session}
              closeSessions={closeSessions}
            />
          );
        })}
      </div>
    </div>
  );
}

function BrowserSessionRow({
  session,
  closeSessions,
}: {
  session: BrowserSession;
  closeSessions: (ids: string[]) => void;
}) {
  const date = new Date(session.createdAt);

  return (
    <div className={`AmcatSession`}>
      <div className="Details">
        <div className="Context">
          {date.toDateString()} - {session.createdOn}
        </div>
        <div className="Label">{session.label}</div>
      </div>
      <div className="Buttons">
        <button
          className="PrimaryColor"
          onClick={() => closeSessions([session.id])}
        >
          close
        </button>
      </div>
    </div>
  );
}

function calcExpiresIn(expires: Date) {
  const expiresDate = new Date(expires);
  return Number(expiresDate.getTime() - Date.now());
}

function ApiKeySessionRow({
  session,
  closeSessions,
}: {
  session: ApiKeySession;
  closeSessions: (ids: string[]) => void;
}) {
  const [expiresIn, setExpiresIn] = useState<number>(
    calcExpiresIn(session.expires)
  );
  const date = new Date(session.createdAt);

  const expiresInMinutes = expiresIn / (1000 * 60);
  const threshold = expiresInMinutes > 60 * 24 * 2;
  const expiresInLabel = threshold ? "days" : "minutes";
  const expiresInValue = threshold
    ? Math.floor(expiresInMinutes / 60 / 24)
    : Math.floor(expiresInMinutes);

  useEffect(() => {
    const expiresIn = calcExpiresIn(session.expires);
    const expiresInChanges = expiresIn % (1000 * 60);
    const timer = setTimeout(() => setExpiresIn(expiresIn), expiresInChanges);
    return () => clearTimeout(timer);
  });

  return (
    <div className={`AmcatSession`}>
      <div className="Details">
        <div className="Context">
          {date.toDateString()} - {session.createdOn}
        </div>
        <div className="Label">{session.label}</div>
      </div>
      <div className="Buttons">
        <Popup
          trigger={
            <button>
              <div style={{ minWidth: "4rem" }}>{expiresInValue}</div>
              <div>{expiresInLabel}</div>
            </button>
          }
        >
          <h4>Add a form to change the expiration date</h4>
        </Popup>
        <Popup trigger={<button>delete</button>}>
          <h4>Are you certain?</h4>
          <button
            style={{
              borderColor: "var(--secondary)",
              color: "white",
              fontSize: "1.3rem",
            }}
            onClick={() => closeSessions([session.id])}
          >
            Yes, delete
          </button>
        </Popup>
      </div>
    </div>
  );
}
