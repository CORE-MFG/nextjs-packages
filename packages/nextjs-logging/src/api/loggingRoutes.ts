// src/api/loggingRoutes.ts

import { NextRequest, NextResponse } from 'next/server';

export function getLoggingHandler(req: NextRequest) {
  return NextResponse.json({ message: 'GET logging' });
}

export function postLoggingHandler(req: NextRequest) {
  return NextResponse.json({ message: 'POST logging' });
}

// optional: bundle as an object
export const loggingHandlers = {
  GET: getLoggingHandler,
  POST: postLoggingHandler,
};
