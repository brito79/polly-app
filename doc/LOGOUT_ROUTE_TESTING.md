# Logout Route - Security & Edge Case Testing Guide

## 🧪 Comprehensive Test Scenarios

### HTTP Method Validation
```bash
# ❌ GET request should return 405
curl -X GET http://localhost:3000/api/auth/logout

# ❌ PUT request should return 405
curl -X PUT http://localhost:3000/api/auth/logout

# ❌ DELETE request should return 405
curl -X DELETE http://localhost:3000/api/auth/logout

# ❌ PATCH request should return 405
curl -X PATCH http://localhost:3000/api/auth/logout

# ✅ POST request is the only allowed method
curl -X POST http://localhost:3000/api/auth/logout
```

### Session State Scenarios
```bash
# ✅ Valid session logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: session_cookie=valid_session_token"

# ✅ No active session (idempotent - should return 200)
curl -X POST http://localhost:3000/api/auth/logout

# ✅ Expired session (should return 200 with SESSION_EXPIRED)
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: session_cookie=expired_session_token"

# ✅ Invalid session format (should return 200 or 401)
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: session_cookie=malformed_token"
```

### Service Availability Tests
```bash
# Test with various network conditions
# Note: These require specific test environments

# ❌ Supabase service unavailable (503 - SERVICE_UNAVAILABLE)
# Simulate by blocking Supabase endpoints

# ❌ Network timeout during logout (503 - NETWORK_ERROR with Retry-After)
# Simulate by introducing artificial delays
```

### Security Headers Verification
```bash
# Check for security headers in response
curl -X POST http://localhost:3000/api/auth/logout -v

# Check for cache prevention headers
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cache-Control: max-age=3600" -v
```

Expected security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cache-Control: no-store, no-cache, must-revalidate, private`
- `Pragma: no-cache`

### Request ID Tracking
```bash
# Each request should return a unique requestId for tracking
curl -X POST http://localhost:3000/api/auth/logout \
  -s | jq '.requestId'

# Multiple requests should have different request IDs
for i in {1..3}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/auth/logout \
    -s | jq '.requestId'
done
```

### Error Handling Tests
```bash
# Test various error conditions

# ❌ Service configuration error (simulated)
# Would require misconfigured environment variables

# ❌ Invalid session during logout (401 - INVALID_SESSION)
# Requires manipulated session token

# ❌ Network error during logout (503 - NETWORK_ERROR)
# Requires network simulation
```

### Security Monitoring Tests
```bash
# Test with suspicious request patterns

# Multiple rapid logout attempts (should log all attempts)
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/auth/logout &
done
wait

# Logout with unusual User-Agent
curl -X POST http://localhost:3000/api/auth/logout \
  -H "User-Agent: Suspicious-Bot/1.0"

# Logout with no User-Agent
curl -X POST http://localhost:3000/api/auth/logout \
  -H "User-Agent:"

# Logout from different IP (use proxy if available)
curl -X POST http://localhost:3000/api/auth/logout \
  -H "X-Forwarded-For: 192.168.1.100"
```

## 🔍 HTTP Status Code Reference

| Status | Code | Scenario |
|--------|------|----------|
| 200 | OK | Successful logout, no session, expired session |
| 401 | Unauthorized | Invalid session during logout |
| 405 | Method Not Allowed | Non-POST HTTP methods |
| 500 | Internal Server Error | Unexpected server errors |
| 503 | Service Unavailable | Supabase unavailable, network errors |

## 🛡️ Security Features

### Enhanced Security Headers
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Cache-Control: no-store, no-cache, must-revalidate, private
Pragma: no-cache
```

### Request Tracking
Every request gets a unique `requestId` using `crypto.randomUUID()`:
```json
{
  "message": "Logout successful",
  "code": "LOGOUT_SUCCESS",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-09-17T10:30:00.000Z"
}
```

### Comprehensive Logging
```javascript
// Structured logging format
[AUTH] Logout attempt initiated - RequestID: ${requestId}, IP: ${clientIP}, Time: ${timestamp}
[AUTH] Processing logout - RequestID: ${requestId}, User: ${userId}, Email: ${email}***, SessionAge: ${age}, IP: ${ip}
[AUTH] Successful logout - RequestID: ${requestId}, User: ${userId}, Origin: ${origin}, Referer: ${referer}
```

### Error Code System
```json
{
  "error": "Human readable message",
  "code": "MACHINE_READABLE_CODE",
  "requestId": "unique-request-id"
}
```

**Error Codes:**
- `SERVICE_UNAVAILABLE` - Supabase client creation failed
- `NO_ACTIVE_SESSION` - No session found (successful idempotent operation)
- `SESSION_EXPIRED` - Session already expired
- `NETWORK_ERROR` - Network issues during logout (with Retry-After)
- `INVALID_SESSION` - Session validation failed
- `LOGOUT_FAILED` - Generic logout failure
- `METHOD_NOT_ALLOWED` - Wrong HTTP method
- `INVALID_REQUEST_DATA` - Type errors in request
- `SERVICE_CONFIGURATION_ERROR` - Server configuration issues
- `SERVICE_ERROR` - Unexpected server errors

### Session Validation
- ✅ Checks for active session
- ✅ Validates session expiry
- ✅ Handles missing sessions gracefully
- ✅ Idempotent operation (multiple logouts are safe)

### Network Resilience
- ✅ Handles Supabase connection failures
- ✅ Manages network timeouts
- ✅ Provides retry guidance with `Retry-After` headers
- ✅ Graceful degradation for service unavailability

## 🎯 Advanced Testing Scenarios

### Load Testing
```bash
# Test concurrent logout requests
seq 1 100 | xargs -n1 -P10 -I{} curl -X POST http://localhost:3000/api/auth/logout

# Test with valid sessions (requires authentication setup)
# Would need to create multiple authenticated sessions first
```

### Security Testing
```bash
# Test header injection attempts
curl -X POST http://localhost:3000/api/auth/logout \
  -H "X-Forwarded-For: <script>alert('xss')</script>"

# Test with malformed cookies
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: session='; DROP TABLE users; --"

# Test with very long user agents
curl -X POST http://localhost:3000/api/auth/logout \
  -H "User-Agent: $(python3 -c 'print("A" * 10000)')"
```

### Edge Case Testing
```bash
# Test with missing headers
curl -X POST http://localhost:3000/api/auth/logout \
  --header "Host:" \
  --header "User-Agent:"

# Test with IPv6 addresses
curl -X POST http://localhost:3000/api/auth/logout \
  -H "X-Forwarded-For: 2001:db8::1"

# Test with multiple forwarded IPs
curl -X POST http://localhost:3000/api/auth/logout \
  -H "X-Forwarded-For: 192.168.1.1, 10.0.0.1, 203.0.113.1"
```

## 📊 Response Examples

### Successful Logout
```json
{
  "message": "Logout successful",
  "code": "LOGOUT_SUCCESS",
  "details": {
    "sessionStatus": "completed",
    "logoutTime": "2025-09-17T10:30:00.000Z"
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-09-17T10:30:00.000Z"
}
```

### No Active Session
```json
{
  "message": "Logout successful",
  "code": "NO_ACTIVE_SESSION", 
  "details": "No active session found, already logged out",
  "requestId": "550e8400-e29b-41d4-a716-446655440001",
  "timestamp": "2025-09-17T10:30:01.000Z"
}
```

### Service Unavailable
```json
{
  "error": "Authentication service unavailable",
  "code": "SERVICE_UNAVAILABLE",
  "requestId": "550e8400-e29b-41d4-a716-446655440002"
}
```

### Method Not Allowed
```json
{
  "error": "Method not allowed. Use POST to logout.",
  "code": "METHOD_NOT_ALLOWED",
  "allowedMethods": ["POST"]
}
```

## 🎯 Production Recommendations

1. **Monitor Request IDs**: Use request IDs for distributed tracing
2. **Rate Limiting**: Implement IP-based rate limiting for abuse prevention  
3. **Session Analytics**: Track logout patterns for security insights
4. **Alert Systems**: Set up alerts for unusual logout patterns
5. **Audit Logging**: Store logout events in permanent audit logs
6. **Remove Legacy Route**: Consider removing this unused endpoint entirely

## 🔄 Idempotency

The logout endpoint is **idempotent** - calling it multiple times has the same effect:
- First call: Logs out active session → 200 OK
- Subsequent calls: No session to logout → 200 OK with NO_ACTIVE_SESSION
- This prevents client-side errors from failed logout attempts