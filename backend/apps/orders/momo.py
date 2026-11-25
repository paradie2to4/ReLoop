"""
Minimal client for the MTN Mobile Money (MoMo) Collections API.

Flow ("Request to Pay"):
  1. Get an OAuth access token with the API user + API key (cached ~1 hour).
  2. POST /collection/v1_0/requesttopay with a unique X-Reference-Id (UUID).
     MTN answers 202 Accepted and pushes a USSD prompt to the payer's phone.
  3. The payer approves with their PIN. The payment stays PENDING until then.
  4. GET /collection/v1_0/requesttopay/{referenceId} returns PENDING,
     SUCCESSFUL or FAILED. We only ever trust this server-to-server answer,
     never a status sent by the browser or by an unauthenticated callback.

Uses the standard library (urllib) so there is no extra dependency.
Credentials come from environment variables (see backend/.env.example).
"""

import base64
import json
import logging
import re
import uuid
from urllib import error, request

from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

TOKEN_CACHE_KEY = "momo_collection_access_token"


class MomoError(Exception):
    """Raised when MTN MoMo can't be reached or rejects a request."""


class MomoNotFound(MomoError):
    """MTN has no record of the requested payment (HTTP 404)."""


def is_configured():
    return bool(settings.MOMO_SUBSCRIPTION_KEY and settings.MOMO_API_USER and settings.MOMO_API_KEY)


def _http(method, path, headers=None, body=None, timeout=20):
    url = settings.MOMO_BASE_URL.rstrip("/") + path
    all_headers = {"Ocp-Apim-Subscription-Key": settings.MOMO_SUBSCRIPTION_KEY}
    all_headers.update(headers or {})
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        all_headers["Content-Type"] = "application/json"
    req = request.Request(url, data=data, headers=all_headers, method=method)
    try:
        with request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            # Some MTN replies (e.g. 202 Accepted for Request to Pay) carry an
            # empty or non-JSON body; only parse when there is real JSON.
            try:
                return resp.status, (json.loads(raw) if raw and raw.strip() else None)
            except ValueError:
                return resp.status, None
    except error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")[:500]
        logger.warning("MoMo %s %s failed: %s %s", method, path, exc.code, detail)
        error_class = MomoNotFound if exc.code == 404 else MomoError
        raise error_class(f"MTN MoMo returned HTTP {exc.code}.") from exc
    except (error.URLError, TimeoutError) as exc:
        logger.warning("MoMo %s %s unreachable: %s", method, path, exc)
        raise MomoError("Could not reach MTN MoMo. Please try again.") from exc


def get_access_token():
    token = cache.get(TOKEN_CACHE_KEY)
    if token:
        return token
    credentials = base64.b64encode(f"{settings.MOMO_API_USER}:{settings.MOMO_API_KEY}".encode()).decode()
    _, data = _http("POST", "/collection/token/", headers={"Authorization": f"Basic {credentials}"})
    token = data["access_token"]
    # Refresh a minute early so we never send an expired token.
    cache.set(TOKEN_CACHE_KEY, token, max(int(data.get("expires_in", 3600)) - 60, 60))
    return token


def _auth_headers():
    return {
        "Authorization": f"Bearer {get_access_token()}",
        "X-Target-Environment": settings.MOMO_TARGET_ENVIRONMENT,
    }


def _safe_text(text):
    """MTN's gateway firewall rejects some characters (e.g. '#') in messages,
    so keep only letters, digits, spaces and simple punctuation."""
    return re.sub(r"[^A-Za-z0-9 .,:\-]", "", text)[:160].strip()


def request_to_pay(*, amount, phone, external_id, payer_message, payee_note):
    """Ask MTN to prompt `phone` to pay `amount`. Returns the reference id (UUID string)."""
    if not is_configured():
        raise MomoError("MTN MoMo payments are not configured on this server.")
    reference_id = str(uuid.uuid4())
    headers = _auth_headers()
    headers["X-Reference-Id"] = reference_id
    if settings.MOMO_CALLBACK_URL:
        headers["X-Callback-Url"] = settings.MOMO_CALLBACK_URL
    status, _ = _http(
        "POST",
        "/collection/v1_0/requesttopay",
        headers=headers,
        body={
            "amount": str(amount),
            "currency": settings.MOMO_CURRENCY,
            "externalId": _safe_text(external_id),
            "payer": {"partyIdType": "MSISDN", "partyId": phone},
            "payerMessage": _safe_text(payer_message),
            "payeeNote": _safe_text(payee_note),
        },
    )
    # MTN accepts a Request to Pay with exactly 202. Anything else (for example
    # a 200 "Request Rejected" page from its firewall) means it was not created.
    if status != 202:
        logger.warning("MoMo requesttopay not accepted: HTTP %s", status)
        raise MomoError("MTN MoMo did not accept the payment request. Please try again.")
    return reference_id


def get_payment_status(reference_id):
    """Returns MTN's view of a payment: {"status": ..., "financialTransactionId": ..., "reason": ...}."""
    _, data = _http("GET", f"/collection/v1_0/requesttopay/{reference_id}", headers=_auth_headers())
    return data or {}


def create_sandbox_api_user(callback_host):
    """Sandbox only: create an API user and key. Returns (api_user, api_key)."""
    api_user = str(uuid.uuid4())
    _http("POST", "/v1_0/apiuser", headers={"X-Reference-Id": api_user}, body={"providerCallbackHost": callback_host})
    _, data = _http("POST", f"/v1_0/apiuser/{api_user}/apikey")
    return api_user, data["apiKey"]
