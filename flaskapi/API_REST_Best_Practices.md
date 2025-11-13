# RESTful API Best Practices, HTTP Methods, and Status Codes

## What is a RESTful API?
A RESTful API (Representational State Transfer) is an architectural style for designing networked applications. It uses HTTP requests to access and manipulate resources, typically represented in JSON format.

---

## Best Practices for RESTful API Design

### 1. Use JSON for Data Exchange
- JSON is the de-facto standard for request and response bodies.
- Always set the `Content-Type: application/json` header.

### 2. Use Nouns, Not Verbs, in Endpoints
- Endpoints should represent resources (nouns), not actions (verbs).
- Example: `/users` instead of `/getUsers` or `/createUser`.

### 3. Use Plural Nouns for Collections
- Collections should use plural nouns: `/users`, `/posts`.
- Single resources: `/users/123`.

### 4. Leverage HTTP Methods for CRUD Operations
- `GET`: Retrieve resources.
- `POST`: Create new resources.
- `PUT`/`PATCH`: Update existing resources.
- `DELETE`: Remove resources.

### 5. Use Nesting to Show Resource Relationships
- Example: `/users/123/posts` for posts belonging to user 123.
- Avoid deep nesting (preferably no more than 3 levels).

### 6. Support Filtering, Sorting, and Pagination
- Use query parameters for filtering, sorting, and pagination.
- Example: `/posts?author=alice&sort=date&page=2&pageSize=10`.

### 7. Use SSL (HTTPS) for Security
- Always serve APIs over HTTPS to protect data in transit.

### 8. Version Your API
- Include versioning in the URL or headers: `/v1/users` or `Accept: application/vnd.api.v1+json`.

### 9. Provide Clear API Documentation
- Document all endpoints, parameters, request/response examples, and error codes.
- Tools: Swagger/OpenAPI, Postman.

---

## HTTP Methods and Their Usage

| Method  | Usage                        | Description                       |
|---------|------------------------------|-----------------------------------|
| GET     | Read                         | Retrieve resource(s)              |
| POST    | Create                       | Add a new resource                |
| PUT     | Update (replace)             | Replace an existing resource      |
| PATCH   | Update (partial)             | Partially update a resource       |
| DELETE  | Delete                       | Remove a resource                 |

---

## Query Parameters
- Used for filtering, sorting, and pagination.
- Syntax: `?key1=value1&key2=value2`
- Example: `/users?role=admin&active=true`

---

## Common HTTP Status Codes

| Code | Name                  | Meaning                                                      |
|------|-----------------------|--------------------------------------------------------------|
| 200  | OK                    | Request succeeded                                            |
| 201  | Created               | Resource created successfully                                |
| 204  | No Content            | Request succeeded, no content returned                       |
| 400  | Bad Request           | Malformed request                                            |
| 401  | Unauthorized          | Authentication required or failed                            |
| 403  | Forbidden             | Authenticated but not allowed                                |
| 404  | Not Found             | Resource not found                                           |
| 405  | Method Not Allowed    | HTTP method not supported for this resource                  |
| 409  | Conflict              | Request conflicts with current state of the resource         |
| 422  | Unprocessable Entity  | Validation error                                             |
| 429  | Too Many Requests     | Rate limit exceeded                                          |
| 500  | Internal Server Error | Generic server error                                         |
| 502  | Bad Gateway           | Invalid response from upstream server                        |
| 503  | Service Unavailable   | Server is overloaded or down for maintenance                 |

---

## References
- [MDN: HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [freeCodeCamp: REST API Best Practices](https://www.freecodecamp.org/news/rest-api-best-practices-rest-endpoint-design-examples/)
- [Smashing Magazine: Understanding and Using REST APIs](https://www.smashingmagazine.com/2018/01/understanding-using-rest-api/)

---

*Following these conventions ensures your API is predictable, maintainable, and user-friendly.*
