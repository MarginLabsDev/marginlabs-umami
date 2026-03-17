import { type NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: '/:path*',
};

const TRACKER_PATH = '/script.js';
const COLLECT_PATH = '/api/send';
const LOGIN_PATH = '/login';

const apiHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, POST, PUT',
  'Access-Control-Max-Age': process.env.CORS_MAX_AGE || '86400',
  'Cache-Control': 'no-cache',
};

const trackerHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=86400, must-revalidate',
};

const robotsHeaders = {
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
};

function customCollectEndpoint(request: NextRequest) {
  const collectEndpoint = process.env.COLLECT_API_ENDPOINT;

  if (collectEndpoint) {
    const url = request.nextUrl.clone();

    if (url.pathname.endsWith(collectEndpoint)) {
      url.pathname = COLLECT_PATH;
      return NextResponse.rewrite(url, { headers: { ...apiHeaders, ...robotsHeaders } });
    }
  }
}

function customScriptName(request: NextRequest) {
  const scriptName = process.env.TRACKER_SCRIPT_NAME;

  if (scriptName) {
    const url = request.nextUrl.clone();
    const names = scriptName.split(',').map(name => name.trim().replace(/^\/+/, ''));

    if (names.find(name => url.pathname.endsWith(name))) {
      url.pathname = TRACKER_PATH;
      return NextResponse.rewrite(url, { headers: { ...trackerHeaders, ...robotsHeaders } });
    }
  }
}

function customScriptUrl(request: NextRequest) {
  const scriptUrl = process.env.TRACKER_SCRIPT_URL;

  if (scriptUrl && request.nextUrl.pathname.endsWith(TRACKER_PATH)) {
    return NextResponse.rewrite(scriptUrl, { headers: { ...trackerHeaders, ...robotsHeaders } });
  }
}

function disableLogin(request: NextRequest) {
  const loginDisabled = process.env.DISABLE_LOGIN;

  if (loginDisabled && request.nextUrl.pathname.endsWith(LOGIN_PATH)) {
    return new NextResponse('Access denied', { status: 403 });
  }
}

export default function middleware(req: NextRequest) {
  const fns = [customCollectEndpoint, customScriptName, customScriptUrl, disableLogin];

  for (const fn of fns) {
    const res = fn(req);
    if (res) {
      return res;
    }
  }

  const res = NextResponse.next();
  res.headers.set('X-Robots-Tag', robotsHeaders['X-Robots-Tag']);
  return res;
}
