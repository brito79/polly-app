# Login Route - Security & Edge Case Testing Guide

## 🧪 Comprehensive Test Scenarios

### HTTP Method Validation
```bash
# ❌ GET request should return 405
curl -X GET http://localhost:3000/api/auth/login

# ❌ PUT request should return 405
curl -X PUT http://localhost:3000/api/auth/login

# ❌ DELETE request should return 405
curl -X DELETE http://localhost:3000/api/auth/login

# ✅ POST request is the only allowed method
curl -X POST http://localhost:3000/api/auth/login
```

### Content-Type Validation
```bash
# ❌ Missing Content-Type (415 Unsupported Media Type)
curl -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"test@example.com","password":"password123"}'

# ❌ Wrong Content-Type (415 Unsupported Media Type)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: text/plain" \
  -d '{"email":"test@example.com","password":"password123"}'

# ✅ Correct Content-Type
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### JSON Format Validation
```bash
# ❌ Invalid JSON (400 Bad Request - INVALID_JSON)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password"}'

# ❌ Malformed JSON (400 Bad Request - INVALID_JSON)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email""test@example.com","password":"test"}'
```

### Required Fields Validation
```bash
# ❌ Missing both email and password (400 - MISSING_CREDENTIALS)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{}'

# ❌ Missing email (400 - MISSING_EMAIL)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"password123"}'

# ❌ Missing password (400 - MISSING_PASSWORD)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Data Type Validation
```bash
# ❌ Email as number (400 - INVALID_FIELD_TYPE)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":123,"password":"password123"}'

# ❌ Password as boolean (400 - INVALID_FIELD_TYPE)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":true}'

# ❌ Both as arrays (400 - INVALID_FIELD_TYPE)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":["test@example.com"],"password":["password123"]}'
```

### Email Validation Tests
```bash
# ❌ Empty email after trim (400 - EMPTY_EMAIL)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"   ","password":"password123"}'

# ❌ Email too long - over 254 chars (400 - EMAIL_TOO_LONG)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"verylongemailaddressthatshouldexceedthelimitoftwofiftyfourcharacterswhichisdefinedinrfc5321andthisemailshouldberejectedbecauseitiswaytoolongforanormalemailaddressandcouldpotentiallycauseissueswithdatabasestorageorprocessinglogic@example.com","password":"password123"}'

# ❌ Invalid email format (400 - INVALID_EMAIL_FORMAT)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email","password":"password123"}'

# ❌ Email without @ (400 - INVALID_EMAIL_FORMAT)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testexample.com","password":"password123"}'

# ❌ Email without domain (400 - INVALID_EMAIL_FORMAT)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@","password":"password123"}'

# ✅ Valid email formats
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user.name+tag@example.co.uk","password":"password123"}'
```

### Password Validation Tests
```bash
# ❌ Empty password after trim (400 - EMPTY_PASSWORD)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"   "}'

# ❌ Password too long - over 128 chars (400 - PASSWORD_TOO_LONG)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"thispasswordiswaytoolongandexceedstheonehundredtwentyeightcharacterlimitwhichisreasonableforapassword"}'
```

### Authentication Error Scenarios
```bash
# ❌ Invalid credentials (401 - INVALID_CREDENTIALS)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com","password":"wrongpassword"}'

# ❌ Unconfirmed email (403 - EMAIL_NOT_CONFIRMED)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"unconfirmed@example.com","password":"correctpassword"}'

# ❌ Rate limited (429 - RATE_LIMITED)
# This would require multiple rapid requests to trigger Supabase rate limiting
```

### Security Headers Verification
```bash
# Check for security headers in response
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -v
```

Expected security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 🔍 HTTP Status Code Reference

| Status | Code | Scenario |
|--------|------|----------|
| 200 | OK | Successful authentication |
| 400 | Bad Request | Invalid input, malformed JSON, validation errors |
| 401 | Unauthorized | Invalid credentials, authentication failed |
| 403 | Forbidden | Email not confirmed, account disabled |
| 405 | Method Not Allowed | Non-POST HTTP methods |
| 415 | Unsupported Media Type | Invalid Content-Type |
| 429 | Too Many Requests | Rate limiting (with Retry-After header) |
| 500 | Internal Server Error | Server errors, service unavailable |
| 503 | Service Unavailable | Supabase client creation failed |

## 🛡️ Security Features

### Input Sanitization
- Email normalization (lowercase, trim)
- Password type validation
- String length limits
- Special character handling

### Error Code System
```json
{
  "error": "Human readable message",
  "code": "MACHINE_READABLE_CODE"
}
```

Error codes help frontend applications handle specific scenarios:
- `MISSING_EMAIL` - Show email field error
- `INVALID_EMAIL_FORMAT` - Show email format error
- `RATE_LIMITED` - Show cooldown timer
- `SERVICE_UNAVAILABLE` - Show retry message

### Security Logging
All requests are logged with:
- Masked email (first 3 characters + ***)
- Client IP address
- User agent (truncated)
- Timestamp
- Success/failure status

### Data Protection
Response only includes safe user data:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "email_confirmed_at": "timestamp",
    "created_at": "timestamp",
    "last_sign_in_at": "timestamp"
  }
}
```

Excluded sensitive fields:
- `phone`
- `user_metadata`
- `app_metadata` 
- `identities`
- `aud`
- `role`

## 🎯 Production Recommendations

1. **Rate Limiting**: Implement Redis-based rate limiting
2. **CSRF Protection**: Add CSRF token validation
3. **IP Allowlisting**: Consider IP restrictions for admin accounts
4. **Monitoring**: Set up alerts for failed login patterns
5. **Audit Logging**: Store security events in database
6. **Remove Route**: Consider removing this legacy endpoint entirely