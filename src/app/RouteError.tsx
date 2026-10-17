import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { createLogger, errorData } from "@/lib/logger";
import styles from "./RouteError.module.css";

const log = createLogger("router");

/** Shown for unknown URLs and for errors thrown while loading or rendering a page. */
export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  if (!notFound) log.error("route failed", errorData(error));
  const message = isRouteErrorResponse(error)
    ? String(error.data)
    : error instanceof Error
      ? error.message
      : "Something went wrong.";
  return (
    <div className={styles.box} role="alert">
      <p className={styles.code}>{notFound ? "404" : "Error"}</p>
      <h2>{notFound ? "Nothing on this pin." : "This page stopped working."}</h2>
      <p>{message}</p>
      <Link to="/">Back to your lesson</Link>
    </div>
  );
}
